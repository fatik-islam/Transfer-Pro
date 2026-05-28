DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'BookingStatus' AND e.enumlabel = 'ARRIVED'
  ) THEN
    ALTER TYPE "BookingStatus" ADD VALUE 'ARRIVED' AFTER 'IN_PROGRESS';
  END IF;
END $$;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "flightNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "meetAndGreet" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'STRIPE',
  ADD COLUMN IF NOT EXISTS "pickupLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pickupLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "destinationLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "destinationLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "distanceKm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "distanceSource" TEXT,
  ADD COLUMN IF NOT EXISTS "pricingRegion" TEXT,
  ADD COLUMN IF NOT EXISTS "pricingTierLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "ratePerKmCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "pickupFeeCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "oneWaySubtotalCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "roundTrip" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "roundTripDiscountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "urgentService" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "urgentSurchargeCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "pricingBreakdown" JSONB;

UPDATE "Vehicle"
SET "active" = CASE WHEN "id" = 'vehicle_transpro_private' OR "slug" IN ('transpro-private-car', 'signature-sedan') THEN true ELSE false END;
