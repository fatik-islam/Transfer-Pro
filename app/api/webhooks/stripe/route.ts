import Stripe from "stripe";
import { NextResponse } from "next/server";

import { queueNotification } from "@/lib/notifications";
import { getStripeClient } from "@/lib/payments";
import { applyStripePaymentUpdate, applyTipPaymentUpdate } from "@/lib/repository";

function readMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readStripeObjectId(
  value: string | Stripe.PaymentIntent | Stripe.Charge | null | undefined,
  fallback?: string
) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }

  return fallback;
}

function readPaymentPurpose(metadata: Stripe.Metadata | null | undefined) {
  const value = readMetadataValue(metadata, "paymentPurpose");

  if (value === "TIP" || value === "FARE_CAPTURE" || value === "FARE_AUTH") {
    return value;
  }

  return "FARE_CAPTURE";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  const stripe = getStripeClient();

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({
      received: true,
      mode: "demo"
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const purpose = readPaymentPurpose(session.metadata);
        const paymentStatus =
          event.type === "checkout.session.expired"
            ? "UNPAID"
            : purpose === "FARE_AUTH"
              ? "AUTHORIZED"
              : "PAID";
        const reconciled =
          purpose === "TIP"
            ? await applyTipPaymentUpdate({
                bookingId: readMetadataValue(session.metadata, "bookingId"),
                reference: readMetadataValue(session.metadata, "reference"),
                providerRef: readStripeObjectId(session.payment_intent, session.id),
                amountCents: session.amount_total ?? undefined,
                status: paymentStatus,
                eventType: event.type,
                payload: {
                  sessionId: session.id,
                  paymentStatus: session.payment_status
                }
              })
            : await applyStripePaymentUpdate({
                bookingId: readMetadataValue(session.metadata, "bookingId"),
                reference: readMetadataValue(session.metadata, "reference"),
                providerRef: readStripeObjectId(session.payment_intent, session.id),
                amountCents: session.amount_total ?? undefined,
                currency: session.currency ?? undefined,
                status: paymentStatus,
                capturedAt: paymentStatus === "PAID" ? new Date().toISOString() : null,
                eventType: event.type,
                payload: {
                  sessionId: session.id,
                  paymentStatus: session.payment_status,
                  paymentPurpose: purpose
                }
              });

        if (reconciled.matched && paymentStatus === "AUTHORIZED") {
          await queueNotification({
            channel: "EMAIL",
            templateKey: "payment_authorized",
            bookingId: reconciled.bookingId,
            userId: reconciled.customerId,
            sentAt: new Date().toISOString(),
            subject: `Fare hold placed: ${reconciled.bookingReference}`,
            body: `A card authorization hold was placed for booking ${reconciled.bookingReference}. The amount is captured only after the ride is completed.`
          });
        }

        if (reconciled.matched && paymentStatus === "PAID") {
          await queueNotification({
            channel: "EMAIL",
            templateKey: purpose === "TIP" ? "tip_received" : "payment_received",
            bookingId: reconciled.bookingId,
            userId: reconciled.customerId,
            sentAt: new Date().toISOString(),
            subject:
              purpose === "TIP"
                ? `Tip received: ${reconciled.bookingReference}`
                : `Payment received: ${reconciled.bookingReference}`,
            body:
              purpose === "TIP"
                ? `Stripe tip completed for booking ${reconciled.bookingReference}.`
                : `Stripe payment completed for booking ${reconciled.bookingReference}.`
          });
        }

        return NextResponse.json({
          received: true,
          eventType: event.type,
          paymentPurpose: purpose,
          reconciled: reconciled.matched,
          bookingReference: reconciled.bookingReference ?? null
        });
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const purpose = readPaymentPurpose(paymentIntent.metadata);
        const reconciled =
          purpose === "TIP"
            ? await applyTipPaymentUpdate({
                bookingId: readMetadataValue(paymentIntent.metadata, "bookingId"),
                reference: readMetadataValue(paymentIntent.metadata, "reference"),
                providerRef: paymentIntent.id,
                amountCents: paymentIntent.amount_received || paymentIntent.amount,
                status: "PAID",
                eventType: event.type,
                payload: {
                  paymentIntentId: paymentIntent.id,
                  paymentPurpose: purpose
                }
              })
            : await applyStripePaymentUpdate({
                bookingId: readMetadataValue(paymentIntent.metadata, "bookingId"),
                reference: readMetadataValue(paymentIntent.metadata, "reference"),
                providerRef: paymentIntent.id,
                amountCents: paymentIntent.amount_received || paymentIntent.amount,
                currency: paymentIntent.currency,
                status: "PAID",
                capturedAt: new Date().toISOString(),
                eventType: event.type,
                payload: {
                  paymentIntentId: paymentIntent.id,
                  paymentPurpose: purpose
                }
              });

        return NextResponse.json({
          received: true,
          eventType: event.type,
          paymentPurpose: purpose,
          reconciled: reconciled.matched,
          bookingReference: reconciled.bookingReference ?? null
        });
      }
      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const purpose = readPaymentPurpose(paymentIntent.metadata);

        if (purpose === "TIP") {
          return NextResponse.json({
            received: true,
            eventType: event.type,
            paymentPurpose: purpose,
            ignored: true
          });
        }

        const reconciled = await applyStripePaymentUpdate({
          bookingId: readMetadataValue(paymentIntent.metadata, "bookingId"),
          reference: readMetadataValue(paymentIntent.metadata, "reference"),
          providerRef: paymentIntent.id,
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "UNPAID",
          eventType: event.type,
          payload: {
            paymentIntentId: paymentIntent.id,
            paymentPurpose: purpose
          }
        });

        return NextResponse.json({
          received: true,
          eventType: event.type,
          paymentPurpose: purpose,
          reconciled: reconciled.matched,
          bookingReference: reconciled.bookingReference ?? null
        });
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const purpose = readPaymentPurpose(paymentIntent.metadata);
        const reconciled =
          purpose === "TIP"
            ? await applyTipPaymentUpdate({
                bookingId: readMetadataValue(paymentIntent.metadata, "bookingId"),
                reference: readMetadataValue(paymentIntent.metadata, "reference"),
                providerRef: paymentIntent.id,
                amountCents: paymentIntent.amount,
                status: "UNPAID",
                eventType: event.type,
                payload: {
                  paymentIntentId: paymentIntent.id,
                  errorMessage: paymentIntent.last_payment_error?.message ?? null,
                  paymentPurpose: purpose
                }
              })
            : await applyStripePaymentUpdate({
                bookingId: readMetadataValue(paymentIntent.metadata, "bookingId"),
                reference: readMetadataValue(paymentIntent.metadata, "reference"),
                providerRef: paymentIntent.id,
                amountCents: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: "UNPAID",
                eventType: event.type,
                payload: {
                  paymentIntentId: paymentIntent.id,
                  errorMessage: paymentIntent.last_payment_error?.message ?? null,
                  paymentPurpose: purpose
                }
              });

        return NextResponse.json({
          received: true,
          eventType: event.type,
          paymentPurpose: purpose,
          reconciled: reconciled.matched,
          bookingReference: reconciled.bookingReference ?? null
        });
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const purpose = readPaymentPurpose(charge.metadata);
        const reconciled =
          purpose === "TIP"
            ? await applyTipPaymentUpdate({
                bookingId: readMetadataValue(charge.metadata, "bookingId"),
                reference: readMetadataValue(charge.metadata, "reference"),
                providerRef: readStripeObjectId(charge.payment_intent, charge.id),
                amountCents: charge.amount_refunded || charge.amount,
                status: "REFUNDED",
                eventType: event.type,
                payload: {
                  chargeId: charge.id,
                  refundedAmountCents: charge.amount_refunded,
                  paymentPurpose: purpose
                }
              })
            : await applyStripePaymentUpdate({
                bookingId: readMetadataValue(charge.metadata, "bookingId"),
                reference: readMetadataValue(charge.metadata, "reference"),
                providerRef: readStripeObjectId(charge.payment_intent, charge.id),
                amountCents: charge.amount_refunded || charge.amount,
                currency: charge.currency,
                status: "REFUNDED",
                eventType: event.type,
                payload: {
                  chargeId: charge.id,
                  refundedAmountCents: charge.amount_refunded,
                  paymentPurpose: purpose
                }
              });

        if (reconciled.matched) {
          await queueNotification({
            channel: "EMAIL",
            templateKey: purpose === "TIP" ? "tip_refunded" : "payment_refunded",
            bookingId: reconciled.bookingId,
            userId: reconciled.customerId,
            sentAt: new Date().toISOString(),
            subject:
              purpose === "TIP"
                ? `Tip refund recorded: ${reconciled.bookingReference}`
                : `Refund recorded: ${reconciled.bookingReference}`,
            body:
              purpose === "TIP"
                ? `Stripe tip refund recorded for booking ${reconciled.bookingReference}.`
                : `Stripe refund recorded for booking ${reconciled.bookingReference}.`
          });
        }

        return NextResponse.json({
          received: true,
          eventType: event.type,
          paymentPurpose: purpose,
          reconciled: reconciled.matched,
          bookingReference: reconciled.bookingReference ?? null
        });
      }
      default:
        return NextResponse.json({
          received: true,
          ignored: true,
          eventType: event.type
        });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook validation failed."
      },
      { status: 400 }
    );
  }
}
