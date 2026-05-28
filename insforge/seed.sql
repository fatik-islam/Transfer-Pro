INSERT INTO "User" ("id", "role", "email", "passwordHash", "name", "phone", "updatedAt")
VALUES
  (
    'user_admin_demo',
    'ADMIN'::"UserRole",
    'admin@transferpro.test',
    '$2b$10$7tclrBzDg/5AEEuqJhRyb.3aWeb5mQ1zZJ3gkqkDFgQFKhqlNT5tS',
    'Mara Holden',
    '+971 50 900 2201',
    '2026-04-12T09:00:00'::timestamp
  ),
  (
    'user_driver_demo',
    'DRIVER'::"UserRole",
    'driver@transferpro.test',
    '$2b$10$7tclrBzDg/5AEEuqJhRyb.3aWeb5mQ1zZJ3gkqkDFgQFKhqlNT5tS',
    'Yousef Kareem',
    '+971 50 900 2202',
    '2026-04-12T09:00:00'::timestamp
  ),
  (
    'user_customer_demo',
    'CUSTOMER'::"UserRole",
    'customer@transferpro.test',
    '$2b$10$7tclrBzDg/5AEEuqJhRyb.3aWeb5mQ1zZJ3gkqkDFgQFKhqlNT5tS',
    'Lena Hart',
    '+44 20 7946 0991',
    '2026-04-12T09:00:00'::timestamp
  ),
  (
    'user_customer_daniel',
    'CUSTOMER'::"UserRole",
    'daniel@solstice.group',
    '$2b$10$7tclrBzDg/5AEEuqJhRyb.3aWeb5mQ1zZJ3gkqkDFgQFKhqlNT5tS',
    'Daniel Nouri',
    '+971 58 111 0202',
    '2026-04-12T09:00:00'::timestamp
  ),
  (
    'user_customer_mina',
    'CUSTOMER'::"UserRole",
    'mina@fjordatelier.no',
    '$2b$10$7tclrBzDg/5AEEuqJhRyb.3aWeb5mQ1zZJ3gkqkDFgQFKhqlNT5tS',
    'Mina Solberg',
    '+47 22 11 33 44',
    '2026-04-12T09:00:00'::timestamp
  ),
  (
    'user_customer_rami',
    'CUSTOMER'::"UserRole",
    'rami@harbormeetings.ae',
    '$2b$10$7tclrBzDg/5AEEuqJhRyb.3aWeb5mQ1zZJ3gkqkDFgQFKhqlNT5tS',
    'Rami Asfour',
    '+971 56 444 5512',
    '2026-04-12T09:00:00'::timestamp
  )
ON CONFLICT ("id") DO UPDATE
SET
  "role" = EXCLUDED."role",
  "email" = EXCLUDED."email",
  "passwordHash" = EXCLUDED."passwordHash",
  "name" = EXCLUDED."name",
  "phone" = EXCLUDED."phone",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "CustomerProfile" ("id", "userId", "companyName", "billingAddress", "preferredChannel", "loyaltyTier", "notes")
VALUES
  (
    'customer_profile_lena',
    'user_customer_demo',
    'Harborline Studios',
    '57 Quayside Road, London',
    'WHATSAPP',
    'Gold',
    'Frequent airport and resort guest.'
  ),
  (
    'customer_profile_daniel',
    'user_customer_daniel',
    'Solstice Group',
    'Bluewaters Island, Dubai',
    'EMAIL',
    'Silver',
    'Often books group cruise transfers.'
  ),
  (
    'customer_profile_mina',
    'user_customer_mina',
    'Fjord Atelier',
    'Aker Brygge, Oslo',
    'EMAIL',
    'Platinum',
    'Uses executive long-distance quoting.'
  ),
  (
    'customer_profile_rami',
    'user_customer_rami',
    'Harbor Meetings',
    'Dubai Harbour, Dubai',
    'WHATSAPP',
    NULL,
    'Event and roadshow itinerary customer.'
  )
ON CONFLICT ("id") DO UPDATE
SET
  "userId" = EXCLUDED."userId",
  "companyName" = EXCLUDED."companyName",
  "billingAddress" = EXCLUDED."billingAddress",
  "preferredChannel" = EXCLUDED."preferredChannel",
  "loyaltyTier" = EXCLUDED."loyaltyTier",
  "notes" = EXCLUDED."notes";

INSERT INTO "DriverProfile" ("id", "userId", "licenseNumber", "baseCity", "status", "rating", "bio")
VALUES
  (
    'driver_profile_yousef',
    'user_driver_demo',
    'DXB-44392',
    'Dubai',
    'AVAILABLE'::"DriverStatus",
    4.9,
    'Airport specialist for premium arrivals, cruise terminal work, and executive hotel dispatch.'
  )
ON CONFLICT ("id") DO UPDATE
SET
  "userId" = EXCLUDED."userId",
  "licenseNumber" = EXCLUDED."licenseNumber",
  "baseCity" = EXCLUDED."baseCity",
  "status" = EXCLUDED."status",
  "rating" = EXCLUDED."rating",
  "bio" = EXCLUDED."bio";

INSERT INTO "Vehicle" (
  "id",
  "slug",
  "name",
  "vehicleClass",
  "seats",
  "luggage",
  "basePriceCents",
  "currency",
  "summary",
  "features",
  "active",
  "driverId"
)
VALUES
  (
    'vehicle_signature_sedan',
    'signature-sedan',
    'Backup Sedan',
    'EXECUTIVE_SEDAN'::"VehicleClass",
    3,
    2,
    8800,
    'CAD',
    'Quiet executive cabin for airport and city work.',
    ARRAY['Meet-and-greet', 'USB-C + Lightning chargers', 'Still-water service'],
    true,
    'driver_profile_yousef'
  ),
  (
    'vehicle_harbor_suv',
    'harbor-suv',
    'Transfer Pro SUV',
    'BUSINESS_SUV'::"VehicleClass",
    5,
    4,
    12400,
    'CAD',
    'Extra luggage room for families and executive teams.',
    ARRAY['Child seat availability', 'Flexible loading space', 'WhatsApp arrival updates'],
    true,
    NULL
  ),
  (
    'vehicle_pier_van',
    'pier-van',
    'Executive Van',
    'VIP_VAN'::"VehicleClass",
    7,
    8,
    17800,
    'CAD',
    'VIP van for delegations, cruise groups, and event schedules.',
    ARRAY['Wide luggage bay', 'Conference seating', 'Guest-list management'],
    true,
    NULL
  ),
  (
    'vehicle_breakwater_shuttle',
    'breakwater-shuttle',
    'Group Shuttle',
    'GROUP_SHUTTLE'::"VehicleClass",
    12,
    12,
    24000,
    'CAD',
    'Group shuttle for resorts, productions, and repeat hotel rotations.',
    ARRAY['Manifest handling', 'Multi-stop logic', 'Dedicated dispatcher'],
    true,
    NULL
  )
ON CONFLICT ("id") DO UPDATE
SET
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

INSERT INTO "Route" (
  "id",
  "slug",
  "origin",
  "destination",
  "distanceKm",
  "durationMin",
  "mode",
  "active",
  "summary",
  "seoTitle",
  "seoDescription"
)
VALUES
  (
    'route_airport_marina',
    'airport-to-marina',
    'Dubai International Airport',
    'Dubai Marina',
    35,
    32,
    'FIXED'::"RouteMode",
    true,
    'High-frequency airport corridor with instant confirmation and curbside coordination.',
    'Dubai airport to marina private transfer',
    'Fixed-price private transfer with live assignment and direct checkout.'
  ),
  (
    'route_marina_palm',
    'marina-to-palm-jumeirah',
    'Dubai Marina',
    'Palm Jumeirah',
    14,
    18,
    'FIXED'::"RouteMode",
    true,
    'Short premium hop for hotel, dinner, and private guest moves.',
    'Dubai Marina to Palm Jumeirah transfer',
    'Premium short-hop transfer with instant booking.'
  ),
  (
    'route_resort_port',
    'resort-to-cruise-terminal',
    'Jumeirah Beach Resorts',
    'Dubai Harbour Cruise Terminal',
    22,
    28,
    'FIXED'::"RouteMode",
    true,
    'Luggage-first transfer flow designed for cruise embarkation windows.',
    'Resort to cruise terminal transfer',
    'Fixed-fare cruise transfer optimized for luggage and timing.'
  ),
  (
    'route_abudhabi',
    'marina-to-abu-dhabi-corniche',
    'Dubai Marina',
    'Abu Dhabi Corniche',
    145,
    95,
    'QUOTE'::"RouteMode",
    true,
    'Long-distance premium transfer with concierge quoting and tailored wait-time rules.',
    'Dubai Marina to Abu Dhabi Corniche chauffeur quote',
    'Quote-based long-distance transfer for premium city-to-city rides.'
  )
ON CONFLICT ("id") DO UPDATE
SET
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

INSERT INTO "RoutePrice" ("id", "routeId", "vehicleId", "oneWayCents", "returnCents", "currency", "depositCents")
VALUES
  ('route_price_airport_sedan', 'route_airport_marina', 'vehicle_signature_sedan', 12600, 23800, 'CAD', 3000),
  ('route_price_airport_suv', 'route_airport_marina', 'vehicle_harbor_suv', 16400, 30800, 'CAD', 4500),
  ('route_price_airport_van', 'route_airport_marina', 'vehicle_pier_van', 22600, 42800, 'CAD', 6000),
  ('route_price_airport_shuttle', 'route_airport_marina', 'vehicle_breakwater_shuttle', 28000, 52000, 'CAD', 7000),
  ('route_price_palm_sedan', 'route_marina_palm', 'vehicle_signature_sedan', 9400, 17600, 'CAD', 2500),
  ('route_price_palm_suv', 'route_marina_palm', 'vehicle_harbor_suv', 13000, 24800, 'CAD', 3500),
  ('route_price_palm_van', 'route_marina_palm', 'vehicle_pier_van', 18600, 35600, 'CAD', 5000),
  ('route_price_palm_shuttle', 'route_marina_palm', 'vehicle_breakwater_shuttle', 24000, 46000, 'CAD', 6500),
  ('route_price_cruise_sedan', 'route_resort_port', 'vehicle_signature_sedan', 11200, 20800, 'CAD', 2500),
  ('route_price_cruise_suv', 'route_resort_port', 'vehicle_harbor_suv', 14800, 28200, 'CAD', 4000),
  ('route_price_cruise_van', 'route_resort_port', 'vehicle_pier_van', 20800, 39600, 'CAD', 5500),
  ('route_price_cruise_shuttle', 'route_resort_port', 'vehicle_breakwater_shuttle', 26500, 50400, 'CAD', 7000)
ON CONFLICT ("id") DO UPDATE
SET
  "routeId" = EXCLUDED."routeId",
  "vehicleId" = EXCLUDED."vehicleId",
  "oneWayCents" = EXCLUDED."oneWayCents",
  "returnCents" = EXCLUDED."returnCents",
  "currency" = EXCLUDED."currency",
  "depositCents" = EXCLUDED."depositCents";

INSERT INTO "RideQuote" (
  "id",
  "reference",
  "customerId",
  "routeId",
  "status",
  "pickupAt",
  "passengerName",
  "passengerEmail",
  "passengerPhone",
  "passengers",
  "luggage",
  "notes",
  "requestedVehicle",
  "offerCents",
  "currency",
  "expiresAt"
)
VALUES
  (
    'quote_118',
    'HQ-118',
    'user_customer_mina',
    'route_abudhabi',
    'OFFER_SENT'::"QuoteStatus",
    '2026-04-18T09:45:00'::timestamp,
    'Mina Solberg',
    'mina@fjordatelier.no',
    '+47 22 11 33 44',
    2,
    2,
    'Dubai Marina to Abu Dhabi Corniche with hotel lobby pickup.',
    'Backup Sedan',
    34000,
    'CAD',
    '2026-04-17T22:00:00'::timestamp
  ),
  (
    'quote_119',
    'HQ-119',
    'user_customer_rami',
    NULL,
    'PENDING'::"QuoteStatus",
    '2026-04-16T14:00:00'::timestamp,
    'Rami Asfour',
    'rami@harbormeetings.ae',
    '+971 56 444 5512',
    6,
    6,
    'Dubai Harbour to Emirates Palace with a mid-route coffee stop.',
    'Executive Van',
    NULL,
    'CAD',
    NULL
  )
ON CONFLICT ("id") DO UPDATE
SET
  "reference" = EXCLUDED."reference",
  "customerId" = EXCLUDED."customerId",
  "routeId" = EXCLUDED."routeId",
  "status" = EXCLUDED."status",
  "pickupAt" = EXCLUDED."pickupAt",
  "passengerName" = EXCLUDED."passengerName",
  "passengerEmail" = EXCLUDED."passengerEmail",
  "passengerPhone" = EXCLUDED."passengerPhone",
  "passengers" = EXCLUDED."passengers",
  "luggage" = EXCLUDED."luggage",
  "notes" = EXCLUDED."notes",
  "requestedVehicle" = EXCLUDED."requestedVehicle",
  "offerCents" = EXCLUDED."offerCents",
  "currency" = EXCLUDED."currency",
  "expiresAt" = EXCLUDED."expiresAt";

INSERT INTO "Booking" (
  "id",
  "reference",
  "customerId",
  "driverId",
  "routeId",
  "vehicleId",
  "quoteId",
  "status",
  "paymentStatus",
  "pickupAt",
  "originLabel",
  "destinationLabel",
  "pickupAddress",
  "destinationAddress",
  "passengerName",
  "passengerEmail",
  "passengerPhone",
  "passengers",
  "luggage",
  "childSeats",
  "specialInstructions",
  "totalCents",
  "depositCents",
  "currency",
  "updatedAt"
)
VALUES
  (
    'booking_501',
    'HB-501',
    'user_customer_demo',
    'user_driver_demo',
    'route_airport_marina',
    'vehicle_harbor_suv',
    NULL,
    'CONFIRMED'::"BookingStatus",
    'PAID'::"PaymentStatus",
    '2026-04-14T18:30:00'::timestamp,
    'Dubai International Airport T3',
    'Atlantis The Royal',
    'Dubai International Airport Terminal 3',
    'Atlantis The Royal, Palm Jumeirah',
    'Lena Hart',
    'customer@transferpro.test',
    '+44 20 7946 0991',
    2,
    3,
    0,
    'Flight EK17 with curbside coordination.',
    16400,
    4500,
    'CAD',
    '2026-04-12T09:15:00'::timestamp
  ),
  (
    'booking_502',
    'HB-502',
    'user_customer_daniel',
    'user_driver_demo',
    'route_resort_port',
    'vehicle_pier_van',
    NULL,
    'ASSIGNED'::"BookingStatus",
    'AUTHORIZED'::"PaymentStatus",
    '2026-04-15T07:15:00'::timestamp,
    'Address Downtown',
    'Dubai Harbour Cruise Terminal',
    'Address Downtown Hotel',
    'Dubai Harbour Cruise Terminal',
    'Daniel Nouri',
    'daniel@solstice.group',
    '+971 58 111 0202',
    5,
    6,
    2,
    'Family departure with extra luggage support.',
    22600,
    6000,
    'CAD',
    '2026-04-12T09:15:00'::timestamp
  ),
  (
    'booking_503',
    'HB-503',
    'user_customer_mina',
    NULL,
    'route_abudhabi',
    'vehicle_signature_sedan',
    NULL,
    'PENDING_PAYMENT'::"BookingStatus",
    'UNPAID'::"PaymentStatus",
    '2026-04-18T09:45:00'::timestamp,
    'Dubai Marina',
    'Abu Dhabi Corniche',
    'Dubai Marina Residence lobby',
    'Abu Dhabi Corniche hotel entrance',
    'Mina Solberg',
    'mina@fjordatelier.no',
    '+47 22 11 33 44',
    2,
    2,
    0,
    'Waiting on payment before final driver assignment.',
    34000,
    NULL,
    'CAD',
    '2026-04-12T09:15:00'::timestamp
  )
ON CONFLICT ("id") DO UPDATE
SET
  "reference" = EXCLUDED."reference",
  "customerId" = EXCLUDED."customerId",
  "driverId" = EXCLUDED."driverId",
  "routeId" = EXCLUDED."routeId",
  "vehicleId" = EXCLUDED."vehicleId",
  "quoteId" = EXCLUDED."quoteId",
  "status" = EXCLUDED."status",
  "paymentStatus" = EXCLUDED."paymentStatus",
  "pickupAt" = EXCLUDED."pickupAt",
  "originLabel" = EXCLUDED."originLabel",
  "destinationLabel" = EXCLUDED."destinationLabel",
  "pickupAddress" = EXCLUDED."pickupAddress",
  "destinationAddress" = EXCLUDED."destinationAddress",
  "passengerName" = EXCLUDED."passengerName",
  "passengerEmail" = EXCLUDED."passengerEmail",
  "passengerPhone" = EXCLUDED."passengerPhone",
  "passengers" = EXCLUDED."passengers",
  "luggage" = EXCLUDED."luggage",
  "childSeats" = EXCLUDED."childSeats",
  "specialInstructions" = EXCLUDED."specialInstructions",
  "totalCents" = EXCLUDED."totalCents",
  "depositCents" = EXCLUDED."depositCents",
  "currency" = EXCLUDED."currency",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "Invoice" (
  "id",
  "number",
  "bookingId",
  "customerId",
  "subtotalCents",
  "taxCents",
  "totalCents",
  "currency",
  "issuedAt",
  "dueAt",
  "paidAt",
  "pdfUrl"
)
VALUES
  (
    'invoice_240501',
    'INV-240501',
    'booking_501',
    'user_customer_demo',
    15200,
    1200,
    16400,
    'CAD',
    '2026-04-12T11:00:00'::timestamp,
    '2026-04-14T18:30:00'::timestamp,
    '2026-04-12T11:02:00'::timestamp,
    'https://example.com/invoices/inv-240501.pdf'
  ),
  (
    'invoice_240502',
    'INV-240502',
    'booking_502',
    'user_customer_daniel',
    21000,
    1600,
    22600,
    'CAD',
    '2026-04-12T12:00:00'::timestamp,
    '2026-04-15T06:00:00'::timestamp,
    NULL,
    'https://example.com/invoices/inv-240502.pdf'
  )
ON CONFLICT ("id") DO UPDATE
SET
  "number" = EXCLUDED."number",
  "bookingId" = EXCLUDED."bookingId",
  "customerId" = EXCLUDED."customerId",
  "subtotalCents" = EXCLUDED."subtotalCents",
  "taxCents" = EXCLUDED."taxCents",
  "totalCents" = EXCLUDED."totalCents",
  "currency" = EXCLUDED."currency",
  "issuedAt" = EXCLUDED."issuedAt",
  "dueAt" = EXCLUDED."dueAt",
  "paidAt" = EXCLUDED."paidAt",
  "pdfUrl" = EXCLUDED."pdfUrl";

INSERT INTO "PaymentTransaction" (
  "id",
  "bookingId",
  "provider",
  "providerRef",
  "amountCents",
  "currency",
  "status",
  "capturedAt"
)
VALUES
  (
    'payment_501',
    'booking_501',
    'STRIPE',
    'pi_demo_paid_501',
    16400,
    'CAD',
    'PAID'::"PaymentStatus",
    '2026-04-12T11:02:00'::timestamp
  ),
  (
    'payment_502',
    'booking_502',
    'STRIPE',
    'pi_demo_auth_502',
    22600,
    'CAD',
    'AUTHORIZED'::"PaymentStatus",
    NULL
  )
ON CONFLICT ("id") DO UPDATE
SET
  "bookingId" = EXCLUDED."bookingId",
  "provider" = EXCLUDED."provider",
  "providerRef" = EXCLUDED."providerRef",
  "amountCents" = EXCLUDED."amountCents",
  "currency" = EXCLUDED."currency",
  "status" = EXCLUDED."status",
  "capturedAt" = EXCLUDED."capturedAt";

INSERT INTO "Notification" ("id", "bookingId", "userId", "channel", "templateKey", "subject", "body", "sentAt")
VALUES
  (
    'notification_booking_501',
    'booking_501',
    'user_customer_demo',
    'EMAIL'::"NotificationChannel",
    'booking_confirmation',
    'Booking confirmed: HB-501',
    'Your transfer has been confirmed and assigned to Yousef Kareem.',
    '2026-04-12T11:05:00'::timestamp
  ),
  (
    'notification_quote_118',
    NULL,
    'user_customer_mina',
    'EMAIL'::"NotificationChannel",
    'quote_offer',
    'Quote offer ready: HQ-118',
    'Your Abu Dhabi transfer offer is ready for review.',
    '2026-04-12T12:05:00'::timestamp
  )
ON CONFLICT ("id") DO UPDATE
SET
  "bookingId" = EXCLUDED."bookingId",
  "userId" = EXCLUDED."userId",
  "channel" = EXCLUDED."channel",
  "templateKey" = EXCLUDED."templateKey",
  "subject" = EXCLUDED."subject",
  "body" = EXCLUDED."body",
  "sentAt" = EXCLUDED."sentAt";

INSERT INTO "AuditLog" ("id", "actorId", "entityType", "entityId", "action", "payload")
VALUES
  (
    'audit_booking_501',
    'user_admin_demo',
    'Booking',
    'booking_501',
    'BOOKING_CONFIRMED',
    '{"status":"CONFIRMED","source":"seed"}'::jsonb
  ),
  (
    'audit_quote_118',
    'user_admin_demo',
    'RideQuote',
    'quote_118',
    'QUOTE_OFFER_SENT',
    '{"status":"OFFER_SENT","offerCents":34000}'::jsonb
  )
ON CONFLICT ("id") DO UPDATE
SET
  "actorId" = EXCLUDED."actorId",
  "entityType" = EXCLUDED."entityType",
  "entityId" = EXCLUDED."entityId",
  "action" = EXCLUDED."action",
  "payload" = EXCLUDED."payload";

INSERT INTO "Vehicle" (
  "id",
  "slug",
  "name",
  "vehicleClass",
  "seats",
  "luggage",
  "basePriceCents",
  "currency",
  "summary",
  "features",
  "active",
  "driverId"
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
  'The real active vehicle for airport pickups, city rides, and Toronto-Montreal transfers.',
  ARRAY['Direct driver contact', 'Child seat on request', 'WhatsApp pickup updates'],
  true,
  'driver_profile_yousef'
)
ON CONFLICT ("id") DO UPDATE
SET
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

INSERT INTO "Route" ("id", "slug", "origin", "destination", "distanceKm", "durationMin", "mode", "active", "summary", "seoTitle", "seoDescription")
VALUES
  ('route_toronto_montreal', 'toronto-to-montreal', 'Toronto', 'Montreal', 542, 345, 'FIXED'::"RouteMode", true, 'Direct private transfer between Toronto and Montreal.', 'Toronto to Montreal private transfer', 'Book a private transfer from Toronto to Montreal with Transfer Pro.'),
  ('route_toronto_city', 'toronto-city-rides', 'Toronto', 'Greater Toronto Area', 45, 75, 'FIXED'::"RouteMode", true, 'Local Toronto and GTA rides.', 'Toronto private city rides', 'Book private rides within Toronto and the GTA.'),
  ('route_montreal_city', 'montreal-city-rides', 'Montreal', 'Greater Montreal Area', 45, 75, 'FIXED'::"RouteMode", true, 'Local Montreal rides.', 'Montreal private city rides', 'Book private rides within Montreal.'),
  ('route_canada_usa', 'canada-to-usa', 'Canada', 'United States', 1001, 720, 'QUOTE'::"RouteMode", true, 'Cross-border rides reviewed manually.', 'Canada to USA private transfer', 'Request a Canada to USA private transfer with Transfer Pro.')
ON CONFLICT ("id") DO UPDATE
SET
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
WHERE "id" NOT IN ('route_toronto_montreal', 'route_toronto_city', 'route_montreal_city', 'route_canada_usa');

INSERT INTO "RoutePrice" ("id", "routeId", "vehicleId", "oneWayCents", "returnCents", "currency", "depositCents")
VALUES
  ('price_toronto_montreal_private', 'route_toronto_montreal', 'vehicle_transpro_private', 108400, 195120, 'CAD', 0),
  ('price_toronto_city_private', 'route_toronto_city', 'vehicle_transpro_private', 3400, NULL, 'CAD', 0),
  ('price_montreal_city_private', 'route_montreal_city', 'vehicle_transpro_private', 3400, NULL, 'CAD', 0)
ON CONFLICT ("routeId", "vehicleId") DO UPDATE
SET
  "oneWayCents" = EXCLUDED."oneWayCents",
  "returnCents" = EXCLUDED."returnCents",
  "currency" = EXCLUDED."currency",
  "depositCents" = EXCLUDED."depositCents";
