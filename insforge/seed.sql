-- Development-only Canadian catalog fixtures.
-- This file deliberately creates no users, passwords, bookings, invoices, or payment records.
-- Never import fixture data into production.

BEGIN;

INSERT INTO "Vehicle" (
  "id", "slug", "name", "vehicleClass", "seats", "luggage",
  "basePriceCents", "currency", "summary", "features", "active", "driverId"
)
VALUES (
  'vehicle_transpro_private',
  'transpro-private-car',
  'Transfer Pro Private Car',
  'BUSINESS_SUV'::"VehicleClass",
  5,
  4,
  3400,
  'CAD',
  'Private airport, city, and intercity transfer vehicle.',
  ARRAY['Direct driver contact', 'Child seat on request', 'Pickup updates'],
  true,
  NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "slug" = EXCLUDED."slug",
  "name" = EXCLUDED."name",
  "vehicleClass" = EXCLUDED."vehicleClass",
  "seats" = EXCLUDED."seats",
  "luggage" = EXCLUDED."luggage",
  "basePriceCents" = EXCLUDED."basePriceCents",
  "currency" = EXCLUDED."currency",
  "summary" = EXCLUDED."summary",
  "features" = EXCLUDED."features",
  "active" = EXCLUDED."active",
  "driverId" = EXCLUDED."driverId";

UPDATE "Vehicle"
SET "active" = false
WHERE "id" <> 'vehicle_transpro_private';

INSERT INTO "Route" (
  "id", "slug", "origin", "destination", "distanceKm", "durationMin",
  "mode", "active", "summary", "seoTitle", "seoDescription"
)
VALUES
  ('route_toronto_montreal', 'toronto-to-montreal', 'Toronto', 'Montreal', 542, 345, 'FIXED'::"RouteMode", true, 'Direct private transfer between Toronto and Montreal.', 'Toronto to Montreal private transfer', 'Book a private transfer from Toronto to Montreal with Transfer Pro.'),
  ('route_toronto_city', 'toronto-city-rides', 'Toronto', 'Greater Toronto Area', 45, 75, 'FIXED'::"RouteMode", true, 'Local Toronto and GTA rides.', 'Toronto private city rides', 'Book private rides within Toronto and the GTA.'),
  ('route_montreal_city', 'montreal-city-rides', 'Montreal', 'Greater Montreal Area', 45, 75, 'FIXED'::"RouteMode", true, 'Local Montreal rides.', 'Montreal private city rides', 'Book private rides within Montreal.'),
  ('route_canada_usa', 'canada-to-usa', 'Canada', 'United States', 1001, 720, 'QUOTE'::"RouteMode", true, 'Cross-border rides reviewed manually.', 'Canada to USA private transfer', 'Request a Canada to USA private transfer with Transfer Pro.')
ON CONFLICT ("id") DO UPDATE SET
  "slug" = EXCLUDED."slug",
  "origin" = EXCLUDED."origin",
  "destination" = EXCLUDED."destination",
  "distanceKm" = EXCLUDED."distanceKm",
  "durationMin" = EXCLUDED."durationMin",
  "mode" = EXCLUDED."mode",
  "active" = EXCLUDED."active",
  "summary" = EXCLUDED."summary",
  "seoTitle" = EXCLUDED."seoTitle",
  "seoDescription" = EXCLUDED."seoDescription";

UPDATE "Route"
SET "active" = false
WHERE "id" NOT IN (
  'route_toronto_montreal',
  'route_toronto_city',
  'route_montreal_city',
  'route_canada_usa'
);

INSERT INTO "RoutePrice" (
  "id", "routeId", "vehicleId", "oneWayCents", "returnCents", "currency", "depositCents"
)
VALUES
  ('price_toronto_montreal_private', 'route_toronto_montreal', 'vehicle_transpro_private', 108400, 195120, 'CAD', 0),
  ('price_toronto_city_private', 'route_toronto_city', 'vehicle_transpro_private', 3400, NULL, 'CAD', 0),
  ('price_montreal_city_private', 'route_montreal_city', 'vehicle_transpro_private', 3400, NULL, 'CAD', 0)
ON CONFLICT ("routeId", "vehicleId") DO UPDATE SET
  "oneWayCents" = EXCLUDED."oneWayCents",
  "returnCents" = EXCLUDED."returnCents",
  "currency" = EXCLUDED."currency",
  "depositCents" = EXCLUDED."depositCents";

COMMIT;
