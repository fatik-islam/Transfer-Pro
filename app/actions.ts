"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  authenticateUser,
  changeAccountPassword,
  clearSession,
  deleteOwnAccount,
  getSession,
  registerCustomer,
  requestPasswordReset,
  resetPasswordWithToken,
  sendEmailVerificationForUser,
  setSession,
  updateAccountProfile
} from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { queueNotification } from "@/lib/notifications";
import {
  captureAuthorizedBookingPayment,
  createCheckoutLink,
  createPostTripCardCheckoutLink,
  createTipCheckoutLink,
  releaseAuthorizedBookingPayment
} from "@/lib/payments";
import {
  acceptBooking,
  assignBookingDriver,
  createDriver,
  createBooking,
  createQuote,
  deleteDriver,
  getDriverEmailRecipients,
  markBookingPaid,
  updateBookingStatus
} from "@/lib/repository";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getAppUrl } from "@/lib/app-config";
import { enforceRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import {
  accountDeleteSchema,
  bookingSchema,
  driverCreateSchema,
  forgotPasswordSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  quoteSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema
} from "@/lib/validation";

async function actionRateLimit(
  scope: string,
  options: { limit: number; windowSeconds: number }
): Promise<ActionState | null> {
  try {
    await enforceRateLimit(scope, options);
    return null;
  } catch (error) {
    const message = rateLimitMessage(error);

    if (message) {
      return { ok: false, message };
    }

    throw error;
  }
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await actionRateLimit("auth.sign-in", { limit: 8, windowSeconds: 900 });
  if (limited) return limited;

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email and password."
    };
  }

  const result = await authenticateUser(parsed.data.email, parsed.data.password);

  if (result.status === "INVALID") {
    return {
      ok: false,
      message: "Credentials were not recognized."
    };
  }

  if (result.status === "UNVERIFIED") {
    return {
      ok: false,
      message: `Email not verified yet. A fresh verification link was sent to ${result.email}.`
    };
  }

  await setSession(result.user);
  redirect(result.user.mustChangePassword ? "/dashboard/settings?notice=password-required" : "/dashboard");
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await actionRateLimit("auth.sign-up", { limit: 4, windowSeconds: 3600 });
  if (limited) return limited;

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneCountryIso: formData.get("phoneCountryIso"),
    phoneNationalNumber: formData.get("phoneNationalNumber"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        "Use a 10+ character password with uppercase, lowercase, and a number."
    };
  }

  try {
    const registration = await registerCustomer(parsed.data);

    if (registration.autoSignInUser) {
      await setSession(registration.autoSignInUser);
      redirect("/dashboard");
    }

    redirect(`/sign-in?notice=signup-email-sent&email=${encodeURIComponent(registration.email)}`);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "We could not create the customer account."
    };
  }
}

export async function createBookingAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limited = await actionRateLimit("booking.create", { limit: 8, windowSeconds: 3600 });
  if (limited) return limited;

  const parsed = bookingSchema.safeParse({
    routeSlug: formData.get("routeSlug") ?? "",
    vehicleSlug: formData.get("vehicleSlug"),
    pickupDate: formData.get("pickupDate"),
    pickupTime: formData.get("pickupTime"),
    pickupAtIso: formData.get("pickupAtIso"),
    name: formData.get("name"),
    email: formData.get("email"),
    phoneCountryIso: formData.get("phoneCountryIso"),
    phoneNationalNumber: formData.get("phoneNationalNumber"),
    passengers: formData.get("passengers"),
    luggage: formData.get("luggage"),
    childSeats: formData.get("childSeats"),
    notes: formData.get("notes"),
    pickupAddress: formData.get("pickupAddress"),
    destinationAddress: formData.get("destinationAddress"),
    pickupCoordinates: formData.get("pickupCoordinates"),
    destinationCoordinates: formData.get("destinationCoordinates"),
    pickupCountryCode: formData.get("pickupCountryCode"),
    destinationCountryCode: formData.get("destinationCountryCode"),
    returnTrip: formData.get("returnTrip"),
    priceOfferToken: formData.get("priceOfferToken"),
    paymentMethod: formData.get("paymentMethod"),
    flightNumber: formData.get("flightNumber"),
    meetAndGreet: formData.get("meetAndGreet")
  });

  if (!parsed.success) {
    const fieldLabels: Record<string, string> = {
      name: "passenger name",
      email: "email",
      phoneCountryIso: "country code",
      phoneNationalNumber: "phone number",
      pickupDate: "pickup date",
      pickupTime: "pickup time",
      pickupAtIso: "pickup time",
      vehicleSlug: "vehicle",
      pickupAddress: "pickup address",
      destinationAddress: "drop-off address",
      pickupCoordinates: "pickup point",
      destinationCoordinates: "drop-off point",
      priceOfferToken: "locked fare"
    };
    const missingFields = Array.from(
      new Set(
        parsed.error.issues
          .map((issue) => issue.path[0])
          .filter((value): value is string => typeof value === "string")
          .map((field) => fieldLabels[field] ?? field)
      )
    );

    return {
      ok: false,
      message: missingFields.length
        ? `Complete these fields before submitting: ${missingFields.join(", ")}.`
        : "Complete the route, contact, and pickup fields before submitting."
    };
  }

  const session = await getSession();
  let booking: Awaited<ReturnType<typeof createBooking>>;

  try {
    booking = await createBooking(parsed.data, session);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "We could not create this booking."
    };
  }

  if (booking.contactRequired) {
    return {
      ok: false,
      message:
        "Rides over 1000 km need direct admin support. Use the contact-admin option instead of instant checkout.",
      reference: booking.reference
    };
  }

  const checkout =
    parsed.data.paymentMethod === "STRIPE" && booking.total > 0
      ? await createCheckoutLink({
          bookingId: booking.id,
          reference: booking.reference,
          amount: booking.total,
          customerEmail: parsed.data.email,
          lineItemName: `Transfer Pro fare hold ${booking.reference}`,
          captureStrategy: "manual",
          purpose: "FARE_AUTH"
        })
      : { url: null, error: undefined };

  await queueNotification({
    channel: "EMAIL",
    templateKey: "booking_created_customer",
    to: parsed.data.email,
    subject: `Booking created: ${booking.reference}`,
    body: `Booking ${booking.reference} was created for ${parsed.data.name}.`
  });

  const driverRecipients = await getDriverEmailRecipients();

  if (driverRecipients.length > 0) {
    const driverSubject = `New booking available: ${booking.reference}`;
    const driverBody = [
      "A new Transfer Pro booking is waiting in the driver queue.",
      "",
      `Reference: ${booking.reference}`,
      `Passenger: ${parsed.data.name}`,
      `Pickup: ${formatDateTime(parsed.data.pickupAtIso)}`,
      `Route: ${parsed.data.pickupAddress} -> ${parsed.data.destinationAddress}`,
      `Fare: ${booking.total > 0 ? formatCurrency(booking.total) : "Manual review required"}`,
      `Payment: ${describePaymentMethod(parsed.data.paymentMethod)}`,
      "",
      `Open dispatch: ${resolveAppUrl("/dashboard/bookings")}`
    ].join("\n");

    await Promise.allSettled(
      driverRecipients.map((driver) =>
        queueNotification({
          channel: "EMAIL",
          templateKey: "booking_created_driver",
          to: driver.email,
          subject: driverSubject,
          body: [`Hello ${driver.name},`, "", driverBody].join("\n"),
          bookingId: booking.id,
          userId: driver.id
        })
      )
    );
  }

  return {
    ok: true,
    message: checkout.url
      ? "Booking created. Continue to checkout to place the fare on hold."
      : checkout.error
        ? `Booking created, but card checkout could not start: ${checkout.error}`
      : "Booking created. Payment can be handled manually from the dashboard.",
    reference: booking.reference,
    checkoutUrl: checkout.url ?? undefined
  };
}

function requireAdminOrDriver(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || (session.role !== "ADMIN" && session.role !== "DRIVER")) {
    throw new Error("Only operators can update bookings.");
  }

  return session;
}

function resolveAppUrl(path: string) {
  const baseUrl = getAppUrl();

  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

function describePaymentMethod(method: string) {
  switch (method) {
    case "STRIPE":
      return "Card hold before capture";
    case "PAY_LATER":
      return "Pay driver after the ride";
    case "CASH":
      return "Cash to driver";
    case "BANK_TRANSFER":
      return "Bank transfer";
    case "INVOICE":
      return "Invoice";
    default:
      return "Payment pending";
  }
}

export async function updateBookingStatusAction(formData: FormData) {
  const session = requireAdminOrDriver(await getSession());
  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "");

  await updateBookingStatus(bookingId, status, session);

  if (status === "COMPLETED") {
    try {
      await captureAuthorizedBookingPayment(bookingId);
    } catch (error) {
      console.error("Fare capture after completion failed", { bookingId, error });
    }
  }

  if (status === "CANCELLED") {
    try {
      await releaseAuthorizedBookingPayment(bookingId, "requested_by_customer");
    } catch (error) {
      console.error("Fare release after cancellation failed", { bookingId, error });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/invoices");
}

export async function acceptBookingAction(formData: FormData) {
  const session = requireAdminOrDriver(await getSession());

  if (session.role !== "DRIVER") {
    throw new Error("Only drivers can accept rides.");
  }

  const bookingId = String(formData.get("bookingId") ?? "");

  try {
    const accepted = await acceptBooking(bookingId, session);

    if (accepted) {
      await queueNotification({
        channel: "EMAIL",
        templateKey: "booking_accepted_customer",
        to: accepted.customerEmail,
        subject: `Booking accepted: ${accepted.reference}`,
        body: [
          `Hello ${accepted.customerName},`,
          "",
          `Your booking ${accepted.reference} has been accepted by ${session.name}.`,
          `Pickup: ${formatDateTime(accepted.pickupAt)}`,
          `Route: ${accepted.origin} -> ${accepted.destination}`,
          "",
          `You can review your booking here: ${resolveAppUrl("/dashboard/bookings")}`
        ].join("\n"),
        bookingId: accepted.bookingId,
        userId: accepted.customerId
      });
    }
  } catch (error) {
    console.error("Accept booking failed", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
}

export async function assignBookingDriverAction(formData: FormData) {
  const session = requireAdminOrDriver(await getSession());
  const bookingId = String(formData.get("bookingId") ?? "");
  const driverProfileId = String(formData.get("driverProfileId") ?? "");

  await assignBookingDriver(bookingId, driverProfileId, session);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
}

export async function markBookingPaidAction(formData: FormData) {
  const session = requireAdminOrDriver(await getSession());
  const bookingId = String(formData.get("bookingId") ?? "");
  const provider = String(formData.get("provider") ?? "MANUAL");

  await markBookingPaid(bookingId, provider, session);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/invoices");
}

export async function payOutstandingBookingByCardAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limited = await actionRateLimit("payment.checkout", { limit: 8, windowSeconds: 900 });
  if (limited) return limited;

  const session = await getSession();

  if (!session || session.role !== "CUSTOMER") {
    return {
      ok: false,
      message: "Only signed-in customers can settle bookings here."
    };
  }

  const bookingId = String(formData.get("bookingId") ?? "");
  const checkout = await createPostTripCardCheckoutLink({
    bookingId,
    customerId: session.id
  });

  if (checkout.url) {
    redirect(checkout.url as never);
  }

  return {
    ok: false,
    message: checkout.error ?? "Card settlement could not be started."
  };
}

export async function addTipCheckoutAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limited = await actionRateLimit("payment.tip", { limit: 8, windowSeconds: 900 });
  if (limited) return limited;

  const session = await getSession();

  if (!session || session.role !== "CUSTOMER") {
    return {
      ok: false,
      message: "Only signed-in customers can add tips here."
    };
  }

  const bookingId = String(formData.get("bookingId") ?? "");
  const tipAmount = Number(formData.get("tipAmount") ?? 0);
  const checkout = await createTipCheckoutLink({
    bookingId,
    customerId: session.id,
    tipAmount
  });

  if (checkout.url) {
    redirect(checkout.url as never);
  }

  return {
    ok: false,
    message: checkout.error ?? "Tip checkout could not be started."
  };
}

export async function updateProfileAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      message: "You need to sign in before updating account details."
    };
  }

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneCountryIso: formData.get("phoneCountryIso"),
    phoneNationalNumber: formData.get("phoneNationalNumber")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid name, email, and mobile number."
    };
  }

  try {
    const updated = await updateAccountProfile(session.id, parsed.data);
    await setSession(updated.user);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return {
      ok: true,
      message: updated.emailChangeRequested
        ? `Profile saved. Confirm ${updated.pendingEmail ?? parsed.data.email} from the verification email to finish changing your sign-in address.`
        : "Account details updated."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "We could not update this account."
    };
  }
}

export async function changePasswordAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      message: "You need to sign in before changing password."
    };
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Use a 10+ character password with uppercase, lowercase, and a number."
    };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return {
      ok: false,
      message: "New password and confirmation do not match."
    };
  }

  try {
    const updatedSession = await changeAccountPassword(
      session.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );

    if (updatedSession) {
      await setSession(updatedSession);
    }

    return {
      ok: true,
      message: "Password updated."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "We could not change the password."
    };
  }
}

export async function deleteOwnAccountAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      message: "You need to sign in before deleting an account."
    };
  }

  if (session.role !== "CUSTOMER" && session.role !== "DRIVER") {
    return {
      ok: false,
      message: "Only customer and driver accounts can be deleted from settings."
    };
  }

  const parsed = accountDeleteSchema.safeParse({
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter your current password to confirm account anonymization."
    };
  }

  try {
    await deleteOwnAccount(session.id, parsed.data.password);
    await clearSession();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "We could not delete this account."
    };
  }

  redirect("/sign-in?notice=account-deleted");
}

export async function requestPasswordResetAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limited = await actionRateLimit("auth.password-reset-request", {
    limit: 4,
    windowSeconds: 3600
  });
  if (limited) return limited;

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email address."
    };
  }

  await requestPasswordReset(parsed.data.email);

  return {
    ok: true,
    message:
      "If an account matched that email, a password reset link has been sent."
  };
}

export async function resetPasswordAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limited = await actionRateLimit("auth.password-reset", { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Use a valid reset link and a 10+ character password with uppercase, lowercase, and a number."
    };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return {
      ok: false,
      message: "New password and confirmation do not match."
    };
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);

    return {
      ok: true,
      message: "Password reset complete. You can now sign in with the new password."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "We could not reset the password."
    };
  }
}

export async function createDriverAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return {
      ok: false,
      message: "Only admins can add drivers."
    };
  }

  const parsed = driverCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneCountryIso: formData.get("phoneCountryIso"),
    phoneNationalNumber: formData.get("phoneNationalNumber"),
    baseCity: formData.get("baseCity"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        "Enter the driver details and a 10+ character password with uppercase, lowercase, and a number."
    };
  }

  try {
    const driver = await createDriver(parsed.data, session);
    await sendEmailVerificationForUser({
      userId: driver.userId,
      purpose: "SIGN_UP",
      email: driver.email
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/drivers");

    return {
      ok: true,
      message:
        "Driver added. Share the temporary password securely and have them verify their email before signing in."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "We could not add the driver."
    };
  }
}

export async function deleteDriverAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Only admins can remove drivers.");
  }

  const driverProfileId = String(formData.get("driverProfileId") ?? "");

  await deleteDriver(driverProfileId, session);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/bookings");
}

export async function requestQuoteAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const limited = await actionRateLimit("quote.create", { limit: 6, windowSeconds: 3600 });
  if (limited) return limited;

  const parsed = quoteSchema.safeParse({
    pickupDate: formData.get("pickupDate"),
    pickupTime: formData.get("pickupTime"),
    name: formData.get("name"),
    email: formData.get("email"),
    phoneCountryIso: formData.get("phoneCountryIso"),
    phoneNationalNumber: formData.get("phoneNationalNumber"),
    passengers: formData.get("passengers"),
    luggage: formData.get("luggage"),
    requestedVehicle: formData.get("requestedVehicle"),
    pickupLabel: formData.get("pickupLabel"),
    destinationLabel: formData.get("destinationLabel"),
    pickupCoordinates: formData.get("pickupCoordinates"),
    destinationCoordinates: formData.get("destinationCoordinates"),
    routeSummary: formData.get("routeSummary"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Describe the route and journey timing before requesting a quote."
    };
  }

  const session = await getSession();
  const quote = await createQuote(parsed.data, session);

  await queueNotification({
    channel: "EMAIL",
    to: parsed.data.email,
    subject: `Quote request created: ${quote.reference}`,
    body: `Quote ${quote.reference} was created for ${parsed.data.name}.`
  });

  return {
    ok: true,
    message: "Quote request submitted. Ops can now review the ride and reply with a manual price.",
    reference: quote.reference
  };
}

export async function signOutAction() {
  await clearSession();
  redirect("/");
}
