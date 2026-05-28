import { z } from "zod";

import { buildPhoneNumber, normalizePhoneCountryIso } from "@/lib/phone";

const booleanField = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean()
);

const emailField = z.string().trim().email();
const phoneCountryIsoField = z.string().trim().min(2);
const phoneNationalNumberField = z.string().trim().min(6);

function withPhoneValidation<
  T extends z.ZodRawShape & {
    phoneCountryIso: z.ZodTypeAny;
    phoneNationalNumber: z.ZodTypeAny;
  }
>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    try {
      buildPhoneNumber(
        normalizePhoneCountryIso(data.phoneCountryIso as string),
        data.phoneNationalNumber as string
      );
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNationalNumber"],
        message: error instanceof Error ? error.message : "Enter a valid mobile number."
      });
    }
  });
}

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(8)
});

export const signUpSchema = withPhoneValidation({
  name: z.string().min(2),
  email: emailField,
  phoneCountryIso: phoneCountryIsoField,
  phoneNationalNumber: phoneNationalNumberField,
  password: z.string().min(8)
});

export const profileUpdateSchema = withPhoneValidation({
  name: z.string().min(2),
  email: emailField,
  phoneCountryIso: phoneCountryIsoField,
  phoneNationalNumber: phoneNationalNumberField
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
});

export const accountDeleteSchema = z.object({
  password: z.string().min(8)
});

export const forgotPasswordSchema = z.object({
  email: emailField
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
});

export const driverCreateSchema = withPhoneValidation({
  name: z.string().min(2),
  email: emailField,
  phoneCountryIso: phoneCountryIsoField,
  phoneNationalNumber: phoneNationalNumberField,
  baseCity: z.string().min(2),
  password: z.string().min(8)
});

export const verifyPhoneCodeSchema = z.object({
  email: emailField,
  code: z.string().regex(/^\d{6}$/)
});

export const resendPhoneCodeSchema = z.object({
  email: emailField
});

export const bookingSchema = withPhoneValidation({
  routeSlug: z.string().optional().or(z.literal("")),
  vehicleSlug: z.string().min(1),
  pickupDate: z.string().min(1),
  pickupTime: z.string().min(1),
  pickupAtIso: z.string().datetime(),
  name: z.string().min(2),
  email: emailField,
  phoneCountryIso: phoneCountryIsoField,
  phoneNationalNumber: phoneNationalNumberField,
  passengers: z.coerce.number().min(1).max(12),
  luggage: z.coerce.number().min(0).max(12),
  childSeats: z.coerce.number().min(0).max(6),
  notes: z.string().max(500).optional().or(z.literal("")),
  pickupAddress: z.string().min(4),
  destinationAddress: z.string().min(4),
  pickupCoordinates: z.string().min(3),
  destinationCoordinates: z.string().min(3),
  pickupCountryCode: z.string().optional().or(z.literal("")),
  destinationCountryCode: z.string().optional().or(z.literal("")),
  returnTrip: booleanField,
  priceOfferToken: z.string().min(20),
  paymentMethod: z.enum(["STRIPE", "PAY_LATER", "CASH", "BANK_TRANSFER", "INVOICE"]),
  flightNumber: z.string().max(40).optional().or(z.literal("")),
  meetAndGreet: booleanField
});

export const quoteSchema = withPhoneValidation({
  pickupDate: z.string().min(1),
  pickupTime: z.string().min(1),
  name: z.string().min(2),
  email: emailField,
  phoneCountryIso: phoneCountryIsoField,
  phoneNationalNumber: phoneNationalNumberField,
  passengers: z.coerce.number().min(1).max(12),
  luggage: z.coerce.number().min(0).max(12),
  requestedVehicle: z.string().optional(),
  pickupLabel: z.string().optional().or(z.literal("")),
  destinationLabel: z.string().optional().or(z.literal("")),
  pickupCoordinates: z.string().optional().or(z.literal("")),
  destinationCoordinates: z.string().optional().or(z.literal("")),
  routeSummary: z.string().min(4),
  notes: z.string().max(500).optional().or(z.literal(""))
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type AccountDeleteInput = z.infer<typeof accountDeleteSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type DriverCreateInput = z.infer<typeof driverCreateSchema>;
export type VerifyPhoneCodeInput = z.infer<typeof verifyPhoneCodeSchema>;
export type ResendPhoneCodeInput = z.infer<typeof resendPhoneCodeSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
