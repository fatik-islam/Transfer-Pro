BEGIN;

ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE public."Booking"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

ALTER TABLE public."PaymentTransaction"
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refundedCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public."Notification"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN IF NOT EXISTS "providerRef" TEXT,
  ADD COLUMN IF NOT EXISTS "error" TEXT;

CREATE TABLE IF NOT EXISTS public."PaymentEvent" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL UNIQUE,
  "eventType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_role_deletedAt_idx" ON public."User" ("role", "deletedAt");
CREATE INDEX IF NOT EXISTS "RideQuote_customerId_status_pickupAt_idx" ON public."RideQuote" ("customerId", "status", "pickupAt");
CREATE INDEX IF NOT EXISTS "RideQuote_status_pickupAt_idx" ON public."RideQuote" ("status", "pickupAt");
CREATE INDEX IF NOT EXISTS "Booking_customerId_pickupAt_idx" ON public."Booking" ("customerId", "pickupAt");
CREATE INDEX IF NOT EXISTS "Booking_driverId_status_pickupAt_idx" ON public."Booking" ("driverId", "status", "pickupAt");
CREATE INDEX IF NOT EXISTS "Booking_status_pickupAt_idx" ON public."Booking" ("status", "pickupAt");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_providerRef_idx" ON public."PaymentTransaction" ("providerRef");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_createdAt_idx" ON public."PaymentTransaction" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentEvent_createdAt_idx" ON public."PaymentEvent" ("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_bookingId_idx" ON public."Notification" ("bookingId");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON public."Notification" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_createdAt_idx" ON public."AuditLog" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx" ON public."AuditLog" ("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_expiresAt_idx" ON public."PasswordResetToken" ("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_expiresAt_idx" ON public."EmailVerificationToken" ("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "PhoneVerificationCode_userId_expiresAt_idx" ON public."PhoneVerificationCode" ("userId", "expiresAt");

COMMIT;
