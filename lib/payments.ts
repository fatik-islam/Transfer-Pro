import "server-only";

import Stripe from "stripe";
import { getAppUrl } from "@/lib/app-config";

import { createInsForgeServerClient, isInsForgeConfigured, unwrapInsForgeResult } from "@/lib/insforge";

export type CheckoutLinkResult = {
  url: string | null;
  error?: string;
};

type CheckoutPurpose = "FARE_AUTH" | "FARE_CAPTURE" | "TIP";

type DbBookingPaymentContext = {
  id: string;
  reference: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalCents: number;
  currency: string;
  tipCents: number | null;
  tipPaymentStatus: string | null;
};

type DbPaymentTransaction = {
  id: string;
  bookingId: string;
  providerRef: string | null;
  status: string;
};

function normalizeAppUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function describeStripeError(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Stripe checkout could not be created.";
}

function readStripeSecretKey() {
  const raw = process.env.STRIPE_SECRET_KEY?.trim();

  if (!raw) {
    return null;
  }

  const unquoted = raw.replace(/^['"]|['"]$/g, "").trim();
  const key = unquoted.match(/sk_(?:test|live)_[A-Za-z0-9]+/)?.[0];

  return key ?? null;
}

export function getStripeClient() {
  const secretKey = readStripeSecretKey();

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

export async function createCheckoutLink(params: {
  bookingId?: string;
  reference: string;
  amount: number;
  customerEmail: string;
  lineItemName?: string;
  successPath?: string;
  cancelPath?: string;
  captureStrategy?: "manual" | "automatic";
  purpose?: CheckoutPurpose;
}): Promise<CheckoutLinkResult> {
  const stripe = getStripeClient();
  const appUrl = normalizeAppUrl(getAppUrl());

  if (!stripe) {
    return {
      url: null,
      error:
        "Stripe secret key is missing or invalid. Set STRIPE_SECRET_KEY to the full sk_test_ or sk_live_ value from Stripe."
    };
  }

  if (!appUrl) {
    return {
      url: null,
      error: "The application URL is invalid. Set NEXT_PUBLIC_APP_URL to https://transferpro.ca."
    };
  }

  try {
    const successPath =
      params.successPath ??
      `/book?checkout=success&reference=${encodeURIComponent(params.reference)}`;
    const cancelPath =
      params.cancelPath ??
      `/book?checkout=cancelled&reference=${encodeURIComponent(params.reference)}`;
    const purpose = params.purpose ?? "FARE_CAPTURE";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}${cancelPath}`,
      customer_email: params.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: Math.round(params.amount * 100),
            product_data: {
              name: params.lineItemName ?? `Transfer booking ${params.reference}`
            }
          }
        }
      ],
      metadata: {
        bookingId: params.bookingId ?? "",
        reference: params.reference,
        paymentPurpose: purpose
      },
      payment_intent_data: {
        capture_method: params.captureStrategy === "manual" ? "manual" : undefined,
        metadata: {
          bookingId: params.bookingId ?? "",
          reference: params.reference,
          paymentPurpose: purpose
        }
      }
    });

    return { url: session.url };
  } catch (error) {
    const message = describeStripeError(error);
    console.error("Stripe checkout creation failed", {
      reference: params.reference,
      bookingId: params.bookingId,
      error: message
    });

    return {
      url: null,
      error: message
    };
  }
}

async function loadBookingPaymentContext(bookingId: string) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  const [booking, payment] = await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("Booking").select("*").eq("id", bookingId).maybeSingle(),
      "Load booking payment context"
    ) as Promise<DbBookingPaymentContext | null>,
    unwrapInsForgeResult(
      insforge.database.from("PaymentTransaction").select("*").eq("bookingId", bookingId).maybeSingle(),
      "Load booking payment transaction"
    ) as Promise<DbPaymentTransaction | null>
  ]);

  return {
    booking,
    payment
  };
}

export async function captureAuthorizedBookingPayment(bookingId: string) {
  const stripe = getStripeClient();

  if (!stripe) {
    return { ok: false, reason: "Stripe is not configured." };
  }

  const context = await loadBookingPaymentContext(bookingId);

  if (!context?.booking || !context.payment?.providerRef) {
    return { ok: false, reason: "No authorized Stripe payment was found for this booking." };
  }

  if (context.payment.status === "PAID") {
    return { ok: true, skipped: true };
  }

  if (context.payment.status !== "AUTHORIZED") {
    return { ok: false, reason: "This booking does not have a capturable payment hold." };
  }

  await stripe.paymentIntents.capture(context.payment.providerRef);
  return { ok: true };
}

export async function releaseAuthorizedBookingPayment(
  bookingId: string,
  reason: "requested_by_customer" | "abandoned" | "duplicate" | "fraudulent" = "requested_by_customer"
) {
  const stripe = getStripeClient();

  if (!stripe) {
    return { ok: false, reason: "Stripe is not configured." };
  }

  const context = await loadBookingPaymentContext(bookingId);

  if (!context?.booking || !context.payment?.providerRef) {
    return { ok: false, reason: "No authorized Stripe payment was found for this booking." };
  }

  if (context.payment.status !== "AUTHORIZED") {
    return { ok: true, skipped: true };
  }

  await stripe.paymentIntents.cancel(context.payment.providerRef, {
    cancellation_reason: reason
  });

  return { ok: true };
}

export async function createPostTripCardCheckoutLink(params: {
  bookingId: string;
  customerId: string;
}) {
  const context = await loadBookingPaymentContext(params.bookingId);

  if (!context?.booking) {
    return { url: null, error: "Booking was not found." } satisfies CheckoutLinkResult;
  }

  if (context.booking.customerId !== params.customerId) {
    return { url: null, error: "This booking does not belong to your account." };
  }

  if (context.booking.status !== "COMPLETED") {
    return { url: null, error: "Card settlement is only available after the ride is completed." };
  }

  if (context.booking.paymentStatus === "PAID") {
    return { url: null, error: "This ride has already been paid." };
  }

  return createCheckoutLink({
    bookingId: params.bookingId,
    reference: context.booking.reference,
    amount: context.booking.totalCents / 100,
    customerEmail: await loadCustomerEmail(context.booking.customerId),
    lineItemName: `Transfer Pro fare settlement ${context.booking.reference}`,
    successPath: `/dashboard/bookings/${params.bookingId}/payment?fare=success`,
    cancelPath: `/dashboard/bookings/${params.bookingId}/payment?fare=cancelled`,
    captureStrategy: "automatic",
    purpose: "FARE_CAPTURE"
  });
}

export async function createTipCheckoutLink(params: {
  bookingId: string;
  customerId: string;
  tipAmount: number;
}) {
  const context = await loadBookingPaymentContext(params.bookingId);

  if (!context?.booking) {
    return { url: null, error: "Booking was not found." } satisfies CheckoutLinkResult;
  }

  if (context.booking.customerId !== params.customerId) {
    return { url: null, error: "This booking does not belong to your account." };
  }

  if (context.booking.status !== "COMPLETED") {
    return { url: null, error: "Tips can only be added after the ride is completed." };
  }

  if ((context.booking.tipPaymentStatus ?? "UNPAID") === "PAID") {
    return { url: null, error: "A card tip has already been recorded for this booking." };
  }

  if (!Number.isFinite(params.tipAmount) || params.tipAmount < 1 || params.tipAmount > 500) {
    return { url: null, error: "Tip amount must be between CAD 1 and CAD 500." };
  }

  return createCheckoutLink({
    bookingId: params.bookingId,
    reference: context.booking.reference,
    amount: params.tipAmount,
    customerEmail: await loadCustomerEmail(context.booking.customerId),
    lineItemName: `Driver tip ${context.booking.reference}`,
    successPath: `/dashboard/bookings/${params.bookingId}/payment?tip=success`,
    cancelPath: `/dashboard/bookings/${params.bookingId}/payment?tip=cancelled`,
    captureStrategy: "automatic",
    purpose: "TIP"
  });
}

async function loadCustomerEmail(customerId: string) {
  const insforge = createInsForgeServerClient();
  const customer = (await unwrapInsForgeResult(
    insforge.database.from("User").select("email").eq("id", customerId).maybeSingle(),
    "Load checkout customer"
  )) as { email: string } | null;

  if (!customer?.email) {
    throw new Error("Customer email was not found.");
  }

  return customer.email;
}
