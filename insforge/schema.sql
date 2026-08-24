CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DRIVER', 'CUSTOMER');
CREATE TYPE "RouteMode" AS ENUM ('FIXED', 'QUOTE');
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFF_SHIFT');
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ARRIVED',
  'COMPLETED',
  'CANCELLED'
);
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'AUTHORIZED', 'PAID', 'REFUNDED');
CREATE TYPE "VehicleClass" AS ENUM (
  'EXECUTIVE_SEDAN',
  'BUSINESS_SUV',
  'VIP_VAN',
  'GROUP_SHUTTLE'
);
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
CREATE TYPE "EmailVerificationPurpose" AS ENUM ('SIGN_UP', 'EMAIL_CHANGE');
CREATE TYPE "PhoneVerificationPurpose" AS ENUM ('SIGN_UP', 'PHONE_CHANGE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "email" TEXT NOT NULL,
  "pendingEmail" TEXT,
  "emailVerifiedAt" TIMESTAMP(3),
  "googleSub" TEXT,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "phoneCountryIso" TEXT,
  "pendingPhone" TEXT,
  "pendingPhoneCountryIso" TEXT,
  "phoneVerifiedAt" TIMESTAMP(3),
  "sessionVersion" INTEGER NOT NULL DEFAULT 1,
  "deletedAt" TIMESTAMP(3),
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyName" TEXT,
  "billingAddress" TEXT,
  "preferredChannel" TEXT,
  "loyaltyTier" TEXT,
  "notes" TEXT,
  CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriverProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "licenseNumber" TEXT,
  "baseCity" TEXT NOT NULL,
  "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 5,
  "bio" TEXT,
  CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "vehicleClass" "VehicleClass" NOT NULL,
  "seats" INTEGER NOT NULL,
  "luggage" INTEGER NOT NULL,
  "basePriceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "summary" TEXT NOT NULL,
  "features" TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "image" TEXT,
  "driverId" TEXT,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Route" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "distanceKm" INTEGER NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "mode" "RouteMode" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "summary" TEXT NOT NULL,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoutePrice" (
  "id" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "oneWayCents" INTEGER NOT NULL,
  "returnCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "depositCents" INTEGER,
  CONSTRAINT "RoutePrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RideQuote" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "routeId" TEXT,
  "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
  "pickupAt" TIMESTAMP(3) NOT NULL,
  "passengerName" TEXT NOT NULL,
  "passengerEmail" TEXT NOT NULL,
  "passengerPhone" TEXT NOT NULL,
  "passengers" INTEGER NOT NULL,
  "luggage" INTEGER NOT NULL,
  "notes" TEXT,
  "requestedVehicle" TEXT,
  "offerCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RideQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "driverId" TEXT,
  "routeId" TEXT,
  "vehicleId" TEXT,
  "quoteId" TEXT,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "pickupAt" TIMESTAMP(3) NOT NULL,
  "originLabel" TEXT NOT NULL,
  "destinationLabel" TEXT NOT NULL,
  "pickupAddress" TEXT NOT NULL,
  "destinationAddress" TEXT NOT NULL,
  "passengerName" TEXT NOT NULL,
  "passengerEmail" TEXT NOT NULL,
  "passengerPhone" TEXT NOT NULL,
  "passengers" INTEGER NOT NULL,
  "luggage" INTEGER NOT NULL,
  "childSeats" INTEGER NOT NULL DEFAULT 0,
  "specialInstructions" TEXT,
  "flightNumber" TEXT,
  "meetAndGreet" BOOLEAN NOT NULL DEFAULT false,
  "paymentMethod" TEXT NOT NULL DEFAULT 'STRIPE',
  "pickupLatitude" DOUBLE PRECISION,
  "pickupLongitude" DOUBLE PRECISION,
  "destinationLatitude" DOUBLE PRECISION,
  "destinationLongitude" DOUBLE PRECISION,
  "distanceKm" DOUBLE PRECISION,
  "distanceSource" TEXT,
  "pricingRegion" TEXT,
  "pricingTierLabel" TEXT,
  "ratePerKmCents" INTEGER,
  "pickupFeeCents" INTEGER,
  "oneWaySubtotalCents" INTEGER,
  "roundTrip" BOOLEAN NOT NULL DEFAULT false,
  "roundTripDiscountCents" INTEGER,
  "urgentService" BOOLEAN NOT NULL DEFAULT false,
  "urgentSurchargeCents" INTEGER,
  "tipCents" INTEGER NOT NULL DEFAULT 0,
  "tipPaymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "tipProviderRef" TEXT,
  "tipPaidAt" TIMESTAMP(3),
  "pricingBreakdown" JSONB,
  "totalCents" INTEGER NOT NULL,
  "depositCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingStop" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  CONSTRAINT "BookingStop_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "subtotalCents" INTEGER NOT NULL,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "pdfUrl" TEXT,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerRef" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "status" "PaymentStatus" NOT NULL,
  "capturedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "refundedCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT,
  "userId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "templateKey" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "providerRef" TEXT,
  "error" TEXT,
  "recipient" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "rating" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "purpose" "EmailVerificationPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhoneVerificationCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "phoneCountryIso" TEXT NOT NULL,
  "purpose" "PhoneVerificationPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_pendingEmail_key" ON "User"("pendingEmail");
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");
CREATE UNIQUE INDEX "Route_slug_key" ON "Route"("slug");
CREATE UNIQUE INDEX "RoutePrice_routeId_vehicleId_key" ON "RoutePrice"("routeId", "vehicleId");
CREATE UNIQUE INDEX "RideQuote_reference_key" ON "RideQuote"("reference");
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");
CREATE UNIQUE INDEX "PaymentTransaction_bookingId_key" ON "PaymentTransaction"("bookingId");
CREATE UNIQUE INDEX "PaymentEvent_eventId_key" ON "PaymentEvent"("eventId");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE UNIQUE INDEX "PhoneVerificationCode_codeHash_key" ON "PhoneVerificationCode"("codeHash");
CREATE INDEX "User_role_deletedAt_idx" ON "User"("role", "deletedAt");
CREATE INDEX "RideQuote_customerId_status_pickupAt_idx" ON "RideQuote"("customerId", "status", "pickupAt");
CREATE INDEX "RideQuote_status_pickupAt_idx" ON "RideQuote"("status", "pickupAt");
CREATE INDEX "Booking_customerId_pickupAt_idx" ON "Booking"("customerId", "pickupAt");
CREATE INDEX "Booking_driverId_status_pickupAt_idx" ON "Booking"("driverId", "status", "pickupAt");
CREATE INDEX "Booking_status_pickupAt_idx" ON "Booking"("status", "pickupAt");
CREATE INDEX "PaymentTransaction_providerRef_idx" ON "PaymentTransaction"("providerRef");
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");
CREATE INDEX "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_status_nextAttemptAt_idx" ON "Notification"("status", "nextAttemptAt");
CREATE INDEX "RateLimitEvent_scope_keyHash_createdAt_idx" ON "RateLimitEvent"("scope", "keyHash", "createdAt" DESC);
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt" DESC);
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");
CREATE INDEX "PhoneVerificationCode_userId_expiresAt_idx" ON "PhoneVerificationCode"("userId", "expiresAt");

ALTER TABLE "CustomerProfile"
  ADD CONSTRAINT "CustomerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DriverProfile"
  ADD CONSTRAINT "DriverProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RoutePrice"
  ADD CONSTRAINT "RoutePrice_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoutePrice"
  ADD CONSTRAINT "RoutePrice_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RideQuote"
  ADD CONSTRAINT "RideQuote_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RideQuote"
  ADD CONSTRAINT "RideQuote_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_routeId_fkey"
  FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "RideQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BookingStop"
  ADD CONSTRAINT "BookingStop_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailVerificationToken"
  ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhoneVerificationCode"
  ADD CONSTRAINT "PhoneVerificationCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DriverProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Route" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoutePrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideQuote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingStop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhoneVerificationCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_scope TEXT,
  p_key_hash TEXT,
  p_window_seconds INTEGER,
  p_max_requests INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  IF p_window_seconds < 1 OR p_max_requests < 1 THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_scope || ':' || p_key_hash));

  DELETE FROM public."RateLimitEvent"
  WHERE "scope" = p_scope
    AND "keyHash" = p_key_hash
    AND "createdAt" < now() - make_interval(secs => GREATEST(p_window_seconds, 86400));

  SELECT count(*)::INTEGER
  INTO recent_count
  FROM public."RateLimitEvent"
  WHERE "scope" = p_scope
    AND "keyHash" = p_key_hash
    AND "createdAt" >= now() - make_interval(secs => p_window_seconds);

  IF recent_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public."RateLimitEvent" ("scope", "keyHash")
  VALUES (p_scope, p_key_hash);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO project_admin;
