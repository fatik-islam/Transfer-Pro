ALTER TABLE "Vehicle" ALTER COLUMN "currency" SET DEFAULT 'CAD';
ALTER TABLE "RoutePrice" ALTER COLUMN "currency" SET DEFAULT 'CAD';
ALTER TABLE "RideQuote" ALTER COLUMN "currency" SET DEFAULT 'CAD';
ALTER TABLE "Booking" ALTER COLUMN "currency" SET DEFAULT 'CAD';
ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT 'CAD';
ALTER TABLE "PaymentTransaction" ALTER COLUMN "currency" SET DEFAULT 'CAD';

UPDATE "Vehicle" SET "currency" = 'CAD' WHERE "currency" = 'USD';
UPDATE "RoutePrice" SET "currency" = 'CAD' WHERE "currency" = 'USD';
UPDATE "RideQuote" SET "currency" = 'CAD' WHERE "currency" = 'USD';
UPDATE "Booking" SET "currency" = 'CAD' WHERE "currency" = 'USD';
UPDATE "Invoice" SET "currency" = 'CAD' WHERE "currency" = 'USD';
UPDATE "PaymentTransaction" SET "currency" = 'CAD' WHERE "currency" = 'USD';
