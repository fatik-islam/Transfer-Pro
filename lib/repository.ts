import "server-only";

import bcrypt from "bcryptjs";
import { unstable_cache, unstable_noStore as noStore } from "next/cache";

import { createInsForgeServerClient, isInsForgeConfigured, unwrapInsForgeResult } from "@/lib/insforge";
import {
  dashboardBookings,
  dashboardQuotes,
  driverCards,
  fleetVehicles,
  invoiceRecords,
  routeCatalog
} from "@/lib/site-data";
import { demoUsers } from "@/lib/demo-users";
import { offerMatchesInput, verifyPricingOffer } from "@/lib/offers";
import { buildPhoneNumber, normalizePhoneCountryIso } from "@/lib/phone";
import { parseCoordinatesString } from "@/lib/pricing";
import { formatCurrency, makeReference } from "@/lib/utils";
import type { BookingInput, DriverCreateInput, QuoteInput } from "@/lib/validation";
import type {
  BookingRecord,
  CustomerAccount,
  DashboardSummaryItem,
  DriverCard,
  FleetVehicle,
  InvoiceRecord,
  PaymentMethod,
  PaymentStatus,
  QuoteRecord,
  RouteCard,
  RouteMode,
  SessionUser,
  UserRole
} from "@/lib/types";

type DbUser = {
  id: string;
  role: UserRole;
  email: string;
  pendingEmail?: string | null;
  emailVerifiedAt?: string | null;
  googleSub?: string | null;
  passwordHash: string;
  name: string;
  phone: string | null;
  phoneCountryIso?: string | null;
  pendingPhone?: string | null;
  pendingPhoneCountryIso?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  mustChangePassword?: boolean;
};

type DbCustomerProfile = {
  id: string;
  userId: string;
  companyName: string | null;
  billingAddress: string | null;
  preferredChannel: string | null;
  loyaltyTier: string | null;
  notes: string | null;
};

type DbDriverProfile = {
  id: string;
  userId: string;
  licenseNumber: string | null;
  baseCity: string;
  status: DriverCard["status"];
  rating: number;
  bio: string | null;
};

type DbVehicle = {
  id: string;
  slug: string;
  name: string;
  vehicleClass: string;
  seats: number;
  luggage: number;
  basePriceCents: number;
  currency: string;
  summary: string;
  features: string[] | null;
  active: boolean;
  image: string | null;
  driverId: string | null;
};

type DbRoute = {
  id: string;
  slug: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  mode: RouteMode;
  active: boolean;
  summary: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

type DbRoutePrice = {
  id: string;
  routeId: string;
  vehicleId: string;
  oneWayCents: number;
  returnCents: number | null;
  currency: string;
  depositCents: number | null;
};

type DbBooking = {
  id: string;
  reference: string;
  customerId: string;
  driverId: string | null;
  routeId: string | null;
  vehicleId: string | null;
  quoteId: string | null;
  status: BookingRecord["status"];
  paymentStatus: BookingRecord["paymentStatus"];
  pickupAt: string;
  originLabel: string;
  destinationLabel: string;
  pickupAddress: string;
  destinationAddress: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengers: number;
  luggage: number;
  childSeats: number;
  specialInstructions: string | null;
  flightNumber?: string | null;
  meetAndGreet?: boolean | null;
  paymentMethod?: PaymentMethod | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  distanceKm?: number | null;
  distanceSource?: string | null;
  pricingRegion?: string | null;
  pricingTierLabel?: string | null;
  ratePerKmCents?: number | null;
  pickupFeeCents?: number | null;
  oneWaySubtotalCents?: number | null;
  roundTrip?: boolean | null;
  roundTripDiscountCents?: number | null;
  urgentService?: boolean | null;
  urgentSurchargeCents?: number | null;
  tipCents?: number | null;
  tipPaymentStatus?: PaymentStatus | null;
  tipProviderRef?: string | null;
  tipPaidAt?: string | null;
  pricingBreakdown?: Record<string, unknown> | null;
  totalCents: number;
  depositCents: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type DbRideQuote = {
  id: string;
  reference: string;
  customerId: string;
  routeId: string | null;
  status: QuoteRecord["status"];
  pickupAt: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengers: number;
  luggage: number;
  notes: string | null;
  requestedVehicle: string | null;
  offerCents: number | null;
  currency: string;
  expiresAt: string | null;
  createdAt: string;
};

type DbInvoice = {
  id: string;
  number: string;
  bookingId: string;
  customerId: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
};

type DbPaymentTransaction = {
  id: string;
  bookingId: string;
  provider: string;
  providerRef: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  capturedAt: string | null;
  createdAt: string;
};

function withRuntimeData() {
  if (isInsForgeConfigured()) {
    noStore();
    return true;
  }

  return false;
}

function filterByRole<T extends { roleVisibleTo: UserRole[] }>(items: T[], role: UserRole) {
  return items.filter((item) => item.roleVisibleTo.includes(role));
}

function unique<T>(values: Array<T | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is T => Boolean(value))));
}

function mapById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function normalizePhoneForLinks(phone?: string | null) {
  return phone?.replace(/[^\d+]/g, "") ?? "";
}

function paymentMethodLabel(method?: PaymentMethod | null) {
  switch (method) {
    case "STRIPE":
      return "Card on hold";
    case "PAY_LATER":
      return "Pay after ride";
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

function buildInvoiceDownloadHref(invoiceId: string) {
  return `/dashboard/invoices/${invoiceId}/download`;
}

function buildReceiptDownloadHref(invoiceId: string) {
  return `/dashboard/invoices/${invoiceId}/receipt`;
}

function buildBookingPaymentHref(bookingId: string) {
  return `/dashboard/bookings/${bookingId}/payment`;
}

const openDriverQueueStatuses = new Set<BookingRecord["status"]>([
  "PENDING",
  "PENDING_PAYMENT",
  "CONFIRMED"
]);

function buildBookingTimeline(status: BookingRecord["status"]) {
  const steps: Array<{ key: BookingRecord["status"]; label: string }> = [
    { key: "PENDING_PAYMENT", label: "Booked" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "IN_PROGRESS", label: "Driver on the way" },
    { key: "ARRIVED", label: "Arrived" },
    { key: "COMPLETED", label: "Completed" }
  ];
  const rank: Record<BookingRecord["status"], number> = {
    PENDING: 0,
    PENDING_PAYMENT: 0,
    CONFIRMED: 1,
    ASSIGNED: 1,
    IN_PROGRESS: 2,
    ARRIVED: 3,
    COMPLETED: 4,
    CANCELLED: -1
  };
  const activeIndex = rank[status] ?? 0;

  return steps.map((step, index) => ({
    label: step.label,
    active: index === activeIndex,
    completed: activeIndex >= index
  }));
}

function buildRepeatHref(booking: Pick<DbBooking, "pickupAddress" | "destinationAddress" | "pickupLatitude" | "pickupLongitude" | "destinationLatitude" | "destinationLongitude" | "vehicleId">, vehicleSlug?: string) {
  const search = new URLSearchParams({
    pickup: booking.pickupAddress,
    destination: booking.destinationAddress
  });

  if (vehicleSlug) {
    search.set("vehicle", vehicleSlug);
  }

  if (booking.pickupLatitude && booking.pickupLongitude) {
    search.set("pickupCoordinates", `${booking.pickupLatitude},${booking.pickupLongitude}`);
  }

  if (booking.destinationLatitude && booking.destinationLongitude) {
    search.set("destinationCoordinates", `${booking.destinationLatitude},${booking.destinationLongitude}`);
  }

  return `/book?${search.toString()}`;
}

function toCents(value: number | null | undefined) {
  return value == null ? null : Math.round(value * 100);
}

function fromCents(value: number | null | undefined) {
  return Number((((value ?? 0) as number) / 100).toFixed(2));
}

async function loadUsersByIds(ids: string[]) {
  if (!ids.length || !isInsForgeConfigured()) {
    return [] as DbUser[];
  }

  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database.from("User").select("*").in("id", ids),
    "Load users"
  ) as Promise<DbUser[]>;
}

async function loadRoutesByIds(ids: string[]) {
  if (!ids.length || !isInsForgeConfigured()) {
    return [] as DbRoute[];
  }

  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database.from("Route").select("*").in("id", ids),
    "Load routes"
  ) as Promise<DbRoute[]>;
}

async function loadVehiclesByIds(ids: string[]) {
  if (!ids.length || !isInsForgeConfigured()) {
    return [] as DbVehicle[];
  }

  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database.from("Vehicle").select("*").in("id", ids),
    "Load vehicles"
  ) as Promise<DbVehicle[]>;
}

async function loadPaymentsByBookingIds(ids: string[]) {
  if (!ids.length || !isInsForgeConfigured()) {
    return [] as DbPaymentTransaction[];
  }

  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database.from("PaymentTransaction").select("*").in("bookingId", ids),
    "Load payments"
  ) as Promise<DbPaymentTransaction[]>;
}

async function loadActiveRoutes() {
  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database.from("Route").select("*").eq("active", true).order("distanceKm", { ascending: true }),
    "Load routes"
  ) as Promise<DbRoute[]>;
}

async function loadActiveVehicles() {
  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database
      .from("Vehicle")
      .select("*")
      .eq("active", true)
      .order("basePriceCents", { ascending: true }),
    "Load vehicles"
  ) as Promise<DbVehicle[]>;
}

async function loadRoutePrices() {
  const insforge = createInsForgeServerClient();
  return unwrapInsForgeResult(
    insforge.database.from("RoutePrice").select("*"),
    "Load route prices"
  ) as Promise<DbRoutePrice[]>;
}

function decorateRoute(route: DbRoute, prices: DbRoutePrice[], vehiclesById: Map<string, DbVehicle>) {
  const routePrices = prices.filter((price) => price.routeId === route.id);
  const pricingByVehicle = Object.fromEntries(
    routePrices.flatMap((price) => {
      const vehicle = vehiclesById.get(price.vehicleId);

      if (!vehicle) {
        return [];
      }

      return [[vehicle.slug, Math.round(price.oneWayCents / 100)]];
    })
  ) as Record<string, number>;

  const lowestPrice = routePrices.length
    ? Math.min(...routePrices.map((price) => price.oneWayCents))
    : undefined;

  return {
    id: route.id,
    slug: route.slug,
    origin: route.origin,
    destination: route.destination,
    duration: `${route.durationMin} min`,
    distance: `${route.distanceKm} km`,
    mode: route.mode,
    fromPrice: lowestPrice ? Math.round(lowestPrice / 100) : undefined,
    pricingByVehicle: Object.keys(pricingByVehicle).length ? pricingByVehicle : undefined,
    copy: route.summary,
    tags: [
      route.mode === "FIXED" ? "Fixed fare" : "Quote",
      route.distanceKm >= 80 ? "Long distance" : "Transfer"
    ]
  } satisfies RouteCard;
}

const getCachedRouteCatalog = unstable_cache(
  async (): Promise<RouteCard[]> => {
    const [routes, prices, vehicles] = await Promise.all([
      loadActiveRoutes(),
      loadRoutePrices(),
      loadActiveVehicles()
    ]);
    const vehiclesById = mapById(vehicles);

    return routes.map((route) => decorateRoute(route, prices, vehiclesById));
  },
  ["public-route-catalog"],
  {
    revalidate: 300
  }
);

const getCachedFleet = unstable_cache(
  async (): Promise<FleetVehicle[]> => {
    const vehicles = await loadActiveVehicles();

    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      slug: vehicle.slug,
      name: vehicle.name,
      classLabel: vehicle.vehicleClass.toLowerCase().replaceAll("_", " "),
      seats: vehicle.seats,
      luggage: vehicle.luggage,
      priceFrom: Math.round(vehicle.basePriceCents / 100),
      summary: vehicle.summary,
      features: vehicle.features ?? []
    }));
  },
  ["public-fleet"],
  {
    revalidate: 300
  }
);

const getCachedFixedPrice = unstable_cache(
  async (routeSlug: string, vehicleSlug: string) => {
    const insforge = createInsForgeServerClient();
    const [route, vehicle] = await Promise.all([
      unwrapInsForgeResult(
        insforge.database.from("Route").select("*").eq("slug", routeSlug).maybeSingle(),
        "Load route"
      ) as Promise<DbRoute | null>,
      unwrapInsForgeResult(
        insforge.database.from("Vehicle").select("*").eq("slug", vehicleSlug).maybeSingle(),
        "Load vehicle"
      ) as Promise<DbVehicle | null>
    ]);

    if (!route || !vehicle || route.mode === "QUOTE") {
      return null;
    }

    const routePrice = (await unwrapInsForgeResult(
      insforge.database
        .from("RoutePrice")
        .select("*")
        .eq("routeId", route.id)
        .eq("vehicleId", vehicle.id)
        .maybeSingle(),
      "Load route price"
    )) as DbRoutePrice | null;

    if (!routePrice) {
      return null;
    }

    return {
      route: decorateRoute(route, [routePrice], new Map([[vehicle.id, vehicle]])),
      vehicle: {
        id: vehicle.id,
        slug: vehicle.slug,
        name: vehicle.name,
        classLabel: vehicle.vehicleClass.toLowerCase().replaceAll("_", " "),
        seats: vehicle.seats,
        luggage: vehicle.luggage,
        priceFrom: Math.round(vehicle.basePriceCents / 100),
        summary: vehicle.summary,
        features: vehicle.features ?? []
      } satisfies FleetVehicle,
      total: Math.round(routePrice.oneWayCents / 100)
    };
  },
  ["public-fixed-price"],
  {
    revalidate: 300
  }
);

async function resolveCustomerId(email: string, name: string, phone: string, actor?: SessionUser | null) {
  if (actor?.id) {
    return actor.id;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isInsForgeConfigured()) {
    return `demo_${normalizedEmail}`;
  }

  const insforge = createInsForgeServerClient();
  const [existing, pendingEmailMatch] = await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("User").select("id").eq("email", normalizedEmail).maybeSingle(),
      "Load customer"
    ),
    unwrapInsForgeResult(
      insforge.database
        .from("User")
        .select("id")
        .eq("pendingEmail", normalizedEmail)
        .maybeSingle(),
      "Load customer pending email"
    )
  ]);

  if (existing?.id) {
    return existing.id as string;
  }

  if (pendingEmailMatch?.id) {
    return pendingEmailMatch.id as string;
  }

  const userId = `user_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .insert([{
        id: userId,
        email: normalizedEmail,
        name,
        phone,
        role: "CUSTOMER",
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 8),
        updatedAt: now
      }])
      .select("id")
      .single(),
    "Create customer"
  );

  await unwrapInsForgeResult(
    insforge.database.from("CustomerProfile").insert([{
      id: `customer_${crypto.randomUUID()}`,
      userId
    }]),
    "Create customer profile"
  );

  return userId;
}

export async function getRouteCatalog(): Promise<RouteCard[]> {
  if (!isInsForgeConfigured()) {
    return routeCatalog;
  }

  return getCachedRouteCatalog();
}

export async function getFleet(): Promise<FleetVehicle[]> {
  if (!isInsForgeConfigured()) {
    return fleetVehicles;
  }

  return getCachedFleet();
}

export async function getBookingsForRole(user: SessionUser): Promise<BookingRecord[]> {
  if (!withRuntimeData()) {
    return filterByRole(dashboardBookings, user.role);
  }

  const insforge = createInsForgeServerClient();
  const bookings = (await unwrapInsForgeResult(
    insforge.database.from("Booking").select("*").order("pickupAt", { ascending: true }),
    "Load bookings"
  )) as DbBooking[];

  const visibleBookings = bookings.filter((booking) => {
    if (user.role === "ADMIN") {
      return true;
    }

    if (user.role === "DRIVER") {
      return booking.driverId === user.id || (!booking.driverId && openDriverQueueStatuses.has(booking.status));
    }

    return booking.customerId === user.id;
  });

  const [users, vehicles, invoices] = await Promise.all([
    loadUsersByIds(unique(visibleBookings.flatMap((booking) => [booking.customerId, booking.driverId]))),
    loadVehiclesByIds(unique(visibleBookings.map((booking) => booking.vehicleId))),
    visibleBookings.length
      ? (unwrapInsForgeResult(
          insforge.database.from("Invoice").select("id,bookingId").in("bookingId", visibleBookings.map((booking) => booking.id)),
          "Load booking invoices"
        ) as Promise<Array<Pick<DbInvoice, "id" | "bookingId">>>)
      : Promise.resolve([])
  ]);

  const usersById = mapById(users);
  const vehiclesById = mapById(vehicles);
  const invoicesByBookingId = new Map(invoices.map((invoice) => [invoice.bookingId, invoice]));

  return visibleBookings.map((booking) => {
    const customer = usersById.get(booking.customerId);
    const driver = booking.driverId ? usersById.get(booking.driverId) : null;
    const vehicle = booking.vehicleId ? vehiclesById.get(booking.vehicleId) : null;
    const invoice = invoicesByBookingId.get(booking.id);
    const canOpenPaymentPage = user.role === "CUSTOMER" && booking.status === "COMPLETED";

    return {
      id: booking.id,
      reference: booking.reference,
      customerName: customer?.name ?? booking.passengerName,
      customerEmail: customer?.email ?? booking.passengerEmail,
      passengerPhone: booking.passengerPhone,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      pickupAt: booking.pickupAt,
      origin: booking.originLabel,
      destination: booking.destinationLabel,
      vehicle: vehicle?.name ?? "Unassigned",
      driver: driver?.name,
      driverId: booking.driverId ?? undefined,
      paymentMethod: booking.paymentMethod ?? "STRIPE",
      paymentMethodLabel: paymentMethodLabel(booking.paymentMethod ?? "STRIPE"),
      flightNumber: booking.flightNumber ?? undefined,
      meetAndGreet: Boolean(booking.meetAndGreet),
      timeline: buildBookingTimeline(booking.status),
      repeatHref: buildRepeatHref(booking, vehicle?.slug),
      whatsappHref:
        user.role === "CUSTOMER"
          ? driver?.phone
            ? `https://wa.me/${normalizePhoneForLinks(driver.phone).replace(/^\+/, "")}`
            : undefined
          : booking.passengerPhone
            ? `https://wa.me/${normalizePhoneForLinks(booking.passengerPhone).replace(/^\+/, "")}`
            : undefined,
      callHref:
        user.role === "CUSTOMER"
          ? driver?.phone
            ? `tel:${normalizePhoneForLinks(driver.phone)}`
            : undefined
          : booking.passengerPhone
            ? `tel:${normalizePhoneForLinks(booking.passengerPhone)}`
            : undefined,
      openToAccept: user.role === "DRIVER" && !booking.driverId && openDriverQueueStatuses.has(booking.status),
      assignedToCurrentUser: booking.driverId === user.id,
      paymentActionHref: canOpenPaymentPage ? buildBookingPaymentHref(booking.id) : undefined,
      invoiceDownloadHref:
        user.role === "CUSTOMER" || !invoice ? undefined : buildInvoiceDownloadHref(invoice.id),
      receiptDownloadHref:
        invoice && (booking.paymentStatus === "PAID" || booking.tipPaymentStatus === "PAID")
          ? buildReceiptDownloadHref(invoice.id)
          : undefined,
      tipAmount: fromCents(booking.tipCents),
      tipPaymentStatus: booking.tipPaymentStatus ?? "UNPAID",
      total: fromCents(booking.totalCents),
      roleVisibleTo: ["ADMIN", "DRIVER", "CUSTOMER"]
    };
  });
}

export async function getQuotesForRole(user: SessionUser): Promise<QuoteRecord[]> {
  if (!withRuntimeData()) {
    return filterByRole(dashboardQuotes, user.role);
  }

  if (user.role === "DRIVER") {
    return [];
  }

  const insforge = createInsForgeServerClient();
  const quotes = (await unwrapInsForgeResult(
    insforge.database.from("RideQuote").select("*").order("pickupAt", { ascending: true }),
    "Load quotes"
  )) as DbRideQuote[];

  const visibleQuotes =
    user.role === "ADMIN" ? quotes : quotes.filter((quote) => quote.customerId === user.id);

  const [customers, routes] = await Promise.all([
    loadUsersByIds(unique(visibleQuotes.map((quote) => quote.customerId))),
    loadRoutesByIds(unique(visibleQuotes.map((quote) => quote.routeId)))
  ]);

  const customersById = mapById(customers);
  const routesById = mapById(routes);

  return visibleQuotes.map((quote) => {
    const route = quote.routeId ? routesById.get(quote.routeId) : null;

    return {
      id: quote.id,
      reference: quote.reference,
      customerName: customersById.get(quote.customerId)?.name ?? quote.passengerName,
      route: route ? `${route.origin} to ${route.destination}` : "Custom journey",
      pickupAt: quote.pickupAt,
      status: quote.status,
      offer: quote.offerCents ? fromCents(quote.offerCents) : undefined,
      roleVisibleTo: ["ADMIN", "CUSTOMER"]
    };
  });
}

export async function getDrivers(): Promise<DriverCard[]> {
  if (!withRuntimeData()) {
    return driverCards;
  }

  const insforge = createInsForgeServerClient();
  const [drivers, vehicles, bookings] = await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("DriverProfile").select("*").order("rating", { ascending: false }),
      "Load drivers"
    ) as Promise<DbDriverProfile[]>,
    loadActiveVehicles(),
    unwrapInsForgeResult(
      insforge.database.from("Booking").select("id,driverId,pickupAt"),
      "Load driver trips"
    ) as Promise<Array<Pick<DbBooking, "id" | "driverId" | "pickupAt">>>
  ]);

  const users = await loadUsersByIds(drivers.map((driver) => driver.userId));
  const usersById = mapById(users);
  const vehiclesByDriverId = new Map<string, DbVehicle[]>();

  for (const vehicle of vehicles) {
    if (!vehicle.driverId) {
      continue;
    }

    const assigned = vehiclesByDriverId.get(vehicle.driverId) ?? [];
    assigned.push(vehicle);
    vehiclesByDriverId.set(vehicle.driverId, assigned);
  }

  const today = new Date().toISOString().slice(0, 10);

  return drivers.map((driver) => {
    const userRecord = usersById.get(driver.userId);
    const assignedVehicles = vehiclesByDriverId.get(driver.id) ?? [];
    const jobsToday = bookings.filter(
      (booking) => booking.driverId === driver.userId && booking.pickupAt.slice(0, 10) === today
    ).length;

    return {
      id: driver.id,
      userId: driver.userId,
      name: userRecord?.name ?? "Driver",
      email: userRecord?.email ?? "",
      phone: userRecord?.phone ?? undefined,
      baseCity: driver.baseCity,
      rating: driver.rating,
      status: driver.status,
      assignedVehicle: assignedVehicles[0]?.name ?? "Awaiting vehicle",
      jobsToday
    };
  });
}

export async function getDriverEmailRecipients(): Promise<
  Array<{ id: string; name: string; email: string }>
> {
  if (!isInsForgeConfigured()) {
    return demoUsers
      .filter((user) => user.role === "DRIVER")
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email
      }));
  }

  const insforge = createInsForgeServerClient();
  const drivers = (await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .select("id,name,email,emailVerifiedAt")
      .eq("role", "DRIVER")
      .order("name", { ascending: true }),
    "Load driver email recipients"
  )) as Array<Pick<DbUser, "id" | "name" | "email" | "emailVerifiedAt">>;

  return drivers
    .filter((driver) => Boolean(driver.emailVerifiedAt))
    .map((driver) => ({
      id: driver.id,
      name: driver.name,
      email: driver.email
    }));
}

export async function getInvoices(user: SessionUser): Promise<InvoiceRecord[]> {
  if (!withRuntimeData()) {
    return user.role === "ADMIN" ? invoiceRecords : invoiceRecords.filter((invoice) => invoice.customerName === user.name);
  }

  if (user.role === "DRIVER") {
    return [];
  }

  const insforge = createInsForgeServerClient();
  const invoices = (await unwrapInsForgeResult(
    insforge.database.from("Invoice").select("*").order("issuedAt", { ascending: false }),
    "Load invoices"
  )) as DbInvoice[];

  const visibleInvoices =
    user.role === "ADMIN"
      ? invoices
      : invoices.filter((invoice) => invoice.customerId === user.id && Boolean(invoice.paidAt));

  const [bookings, customers, payments] = await Promise.all([
    visibleInvoices.length
      ? (unwrapInsForgeResult(
          insforge.database.from("Booking").select("id,reference").in("id", visibleInvoices.map((invoice) => invoice.bookingId)),
          "Load invoice bookings"
        ) as Promise<Array<Pick<DbBooking, "id" | "reference" | "tipPaymentStatus">>>)
      : Promise.resolve([]),
    loadUsersByIds(unique(visibleInvoices.map((invoice) => invoice.customerId))),
    loadPaymentsByBookingIds(unique(visibleInvoices.map((invoice) => invoice.bookingId)))
  ]);

  const bookingsById = mapById(bookings);
  const customersById = mapById(customers);
  const paymentsByBookingId = new Map(payments.map((payment) => [payment.bookingId, payment]));

  return visibleInvoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    bookingReference: bookingsById.get(invoice.bookingId)?.reference ?? "Pending booking",
    customerName: customersById.get(invoice.customerId)?.name ?? "Customer",
    issuedAt: invoice.issuedAt,
    total: fromCents(invoice.totalCents),
    status:
      paymentsByBookingId.get(invoice.bookingId)?.status === "REFUNDED"
        ? "REFUNDED"
        : invoice.paidAt
          ? "PAID"
          : "OPEN",
    downloadHref: user.role === "ADMIN" ? buildInvoiceDownloadHref(invoice.id) : undefined,
    receiptHref: invoice.paidAt ? buildReceiptDownloadHref(invoice.id) : undefined,
    paymentHref:
      user.role === "CUSTOMER" &&
      invoice.paidAt &&
      bookingsById.get(invoice.bookingId)?.tipPaymentStatus !== "PAID"
        ? buildBookingPaymentHref(invoice.bookingId)
        : undefined
  }));
}

export async function getCustomers(): Promise<CustomerAccount[]> {
  if (!withRuntimeData()) {
    return Array.from(
      new Map(
        [...dashboardBookings, ...dashboardQuotes].map((item) => {
          const email =
            "customerEmail" in item
              ? item.customerEmail
              : `${item.customerName.toLowerCase().replaceAll(" ", ".")}@example.com`;

          return [email, { id: email, name: item.customerName, email }];
        })
      ).values()
    );
  }

  const insforge = createInsForgeServerClient();
  const [customers, profiles] = await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("User").select("id,name,email,phone").eq("role", "CUSTOMER").order("name", { ascending: true }),
      "Load customers"
    ) as Promise<Array<Pick<DbUser, "id" | "name" | "email" | "phone">>>,
    unwrapInsForgeResult(
      insforge.database.from("CustomerProfile").select("*"),
      "Load customer profiles"
    ) as Promise<DbCustomerProfile[]>
  ]);

  const profilesByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? undefined,
    companyName: profilesByUserId.get(customer.id)?.companyName ?? undefined
  }));
}

export async function getBookingPaymentDetails(bookingId: string, user: SessionUser) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  const booking = (await unwrapInsForgeResult(
    insforge.database.from("Booking").select("*").eq("id", bookingId).maybeSingle(),
    "Load booking payment details"
  )) as DbBooking | null;

  if (!booking) {
    return null;
  }

  if (user.role !== "ADMIN" && booking.customerId !== user.id) {
    throw new Error("You do not have access to this booking.");
  }

  const [customer, driver, vehicle, invoice] = await Promise.all([
    loadUsersByIds([booking.customerId]).then((records) => records[0] ?? null),
    booking.driverId ? loadUsersByIds([booking.driverId]).then((records) => records[0] ?? null) : Promise.resolve(null),
    booking.vehicleId ? loadVehiclesByIds([booking.vehicleId]).then((records) => records[0] ?? null) : Promise.resolve(null),
    unwrapInsForgeResult(
      insforge.database.from("Invoice").select("*").eq("bookingId", booking.id).maybeSingle(),
      "Load payment invoice"
    ) as Promise<DbInvoice | null>
  ]);

  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod ?? "STRIPE",
    paymentMethodLabel: paymentMethodLabel(booking.paymentMethod ?? "STRIPE"),
    pickupAt: booking.pickupAt,
    origin: booking.originLabel,
    destination: booking.destinationLabel,
    total: fromCents(booking.totalCents),
    tipAmount: fromCents(booking.tipCents),
    tipPaymentStatus: booking.tipPaymentStatus ?? "UNPAID",
    customerName: customer?.name ?? booking.passengerName,
    customerEmail: customer?.email ?? booking.passengerEmail,
    driverName: driver?.name ?? null,
    vehicleName: vehicle?.name ?? "Transfer Pro vehicle",
    whatsappHref: driver?.phone
      ? `https://wa.me/${normalizePhoneForLinks(driver.phone).replace(/^\+/, "")}`
      : undefined,
    callHref: driver?.phone ? `tel:${normalizePhoneForLinks(driver.phone)}` : undefined,
    invoiceDownloadHref: undefined,
    receiptDownloadHref:
      invoice && (booking.paymentStatus === "PAID" || booking.tipPaymentStatus === "PAID")
        ? buildReceiptDownloadHref(invoice.id)
        : undefined
  };
}

export async function getInvoiceDocumentData(invoiceId: string, user: SessionUser) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  const invoice = (await unwrapInsForgeResult(
    insforge.database.from("Invoice").select("*").eq("id", invoiceId).maybeSingle(),
    "Load invoice document"
  )) as DbInvoice | null;

  if (!invoice) {
    return null;
  }

  if (user.role !== "ADMIN" && invoice.customerId !== user.id) {
    throw new Error("You do not have access to this invoice.");
  }

  const booking = (await unwrapInsForgeResult(
    insforge.database.from("Booking").select("*").eq("id", invoice.bookingId).maybeSingle(),
    "Load booking for invoice document"
  )) as DbBooking | null;

  if (!booking) {
    return null;
  }

  const [customer, driver, payment] = await Promise.all([
    loadUsersByIds([invoice.customerId]).then((records) => records[0] ?? null),
    booking.driverId ? loadUsersByIds([booking.driverId]).then((records) => records[0] ?? null) : Promise.resolve(null),
    loadPaymentsByBookingIds([booking.id]).then((records) => records[0] ?? null)
  ]);

  return {
    invoiceId: invoice.id,
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    paidAt: invoice.paidAt,
    subtotal: fromCents(invoice.subtotalCents),
    tax: fromCents(invoice.taxCents),
    total: fromCents(invoice.totalCents),
    currency: invoice.currency,
    bookingReference: booking.reference,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod ?? "STRIPE",
    paymentMethodLabel: paymentMethodLabel(booking.paymentMethod ?? "STRIPE"),
    pickupAt: booking.pickupAt,
    origin: booking.originLabel,
    destination: booking.destinationLabel,
    customerName: customer?.name ?? booking.passengerName,
    customerEmail: customer?.email ?? booking.passengerEmail,
    customerPhone: customer?.phone ?? booking.passengerPhone,
    driverName: driver?.name ?? null,
    tipAmount: fromCents(booking.tipCents),
    tipPaymentStatus: booking.tipPaymentStatus ?? "UNPAID",
    capturedAt: payment?.capturedAt ?? null
  };
}

export async function getDashboardSummary(user: SessionUser): Promise<DashboardSummaryItem[]> {
  const [bookings, quotes] = await Promise.all([getBookingsForRole(user), getQuotesForRole(user)]);
  const averageBasket =
    bookings.length > 0
      ? Math.round(bookings.reduce((sum, booking) => sum + booking.total, 0) / bookings.length)
      : 0;

  return [
    {
      label: user.role === "DRIVER" ? "Driver queue" : "Upcoming rides",
      value: String(bookings.length),
      detail:
        user.role === "ADMIN"
          ? "Across all managed journeys"
          : user.role === "DRIVER"
            ? "Open rides plus trips you have already accepted"
            : "Confirmed and pending rides on your account"
    },
    {
      label: "Quote backlog",
      value: String(quotes.filter((quote) => quote.status === "PENDING").length),
      detail:
        user.role === "ADMIN"
          ? "Requests still waiting for pricing"
          : "Bespoke journeys still awaiting an offer"
    },
    {
      label: "Average basket",
      value: formatCurrency(averageBasket),
      detail: "Calculated from the currently visible bookings"
    }
  ];
}

export async function findFixedPrice(routeSlug: string, vehicleSlug: string) {
  if (!isInsForgeConfigured()) {
    const route = routeCatalog.find((item) => item.slug === routeSlug);
    const vehicle = fleetVehicles.find((item) => item.slug === vehicleSlug);

    if (!route || !vehicle || route.mode === "QUOTE") {
      return null;
    }

    const exactPrice = route.pricingByVehicle?.[vehicle.slug];

    return {
      route,
      vehicle,
      total: exactPrice ?? route.fromPrice ?? 0
    };
  }

  return getCachedFixedPrice(routeSlug, vehicleSlug);
}

async function assertDriverAvailable(driverUserId: string | null | undefined, pickupAt: Date) {
  if (!driverUserId || !isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const bookings = (await unwrapInsForgeResult(
    insforge.database.from("Booking").select("id,reference,pickupAt,status,driverId"),
    "Load availability bookings"
  )) as Array<Pick<DbBooking, "id" | "reference" | "pickupAt" | "status" | "driverId">>;

  const pickupMs = pickupAt.getTime();
  const blockedStatuses = new Set(["PENDING_PAYMENT", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "ARRIVED"]);
  const conflict = bookings.find((booking) => {
    if (booking.driverId !== driverUserId || !blockedStatuses.has(booking.status)) {
      return false;
    }

    return Math.abs(new Date(booking.pickupAt).getTime() - pickupMs) < 2 * 60 * 60 * 1000;
  });

  if (conflict) {
    throw new Error(
      `This pickup conflicts with booking ${conflict.reference}. Choose another time or request a manual quote.`
    );
  }
}

async function writeBookingAudit(params: {
  actorId?: string | null;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
}) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  await unwrapInsForgeResult(
    insforge.database.from("AuditLog").insert([{
      id: `audit_${crypto.randomUUID()}`,
      actorId: params.actorId ?? null,
      entityType: "Booking",
      entityId: params.entityId,
      action: params.action,
      payload: params.payload ?? {}
    }]),
    "Create booking audit log"
  );
}

export async function createBooking(input: BookingInput, actor?: SessionUser | null) {
  const pickupCoordinates = parseCoordinatesString(input.pickupCoordinates);
  const destinationCoordinates = parseCoordinatesString(input.destinationCoordinates);
  const pickupAt = new Date(input.pickupAtIso);
  const reference = makeReference("HB");

  if (!pickupCoordinates || !destinationCoordinates) {
    throw new Error("Pickup and destination coordinates are required for pricing.");
  }

  const lockedOffer = await verifyPricingOffer(input.priceOfferToken);
  const offerInput = {
    pickupCoordinates,
    destinationCoordinates,
    pickupCountryCode: input.pickupCountryCode,
    destinationCountryCode: input.destinationCountryCode,
    pickupAt: pickupAt.toISOString(),
    returnTrip: input.returnTrip
  };

  if (!offerMatchesInput(lockedOffer, offerInput)) {
    throw new Error("The locked fare no longer matches this booking. Refresh the offer before checkout.");
  }

  const pricing = lockedOffer.quote;

  if (pricing.pricingMode === "CONTACT" || pricing.total === null) {
    return {
      id: reference,
      reference,
      total: 0,
      checkoutMode: "CONTACT" as const,
      contactRequired: true,
      distanceKm: pricing.distanceKm
    };
  }

  const total = pricing.total;

  if (!isInsForgeConfigured()) {
    return {
      id: reference,
      reference,
      total,
      checkoutMode: "FIXED" as const,
      contactRequired: false,
      distanceKm: pricing.distanceKm
    };
  }

  const phoneCountryIso = normalizePhoneCountryIso(input.phoneCountryIso);
  const phone = buildPhoneNumber(phoneCountryIso, input.phoneNationalNumber);
  const insforge = createInsForgeServerClient();
  const customerId = await resolveCustomerId(input.email, input.name, phone, actor);
  const [route, vehicle] = await Promise.all([
    input.routeSlug
      ? (unwrapInsForgeResult(
          insforge.database.from("Route").select("id,origin,destination").eq("slug", input.routeSlug).maybeSingle(),
          "Load booking route"
        ) as Promise<Pick<DbRoute, "id" | "origin" | "destination"> | null>)
      : Promise.resolve(null),
    unwrapInsForgeResult(
      insforge.database.from("Vehicle").select("id,name").eq("slug", input.vehicleSlug).maybeSingle(),
      "Load booking vehicle"
    ) as Promise<Pick<DbVehicle, "id" | "name"> | null>
  ]);

  const bookingId = `booking_${crypto.randomUUID()}`;
  const booking = await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .insert([{
        id: bookingId,
        reference,
        customerId,
        driverId: null,
        routeId: route?.id ?? null,
        vehicleId: vehicle?.id ?? null,
        status: input.paymentMethod === "STRIPE" ? "PENDING_PAYMENT" : "CONFIRMED",
        paymentStatus: "UNPAID",
        pickupAt: pickupAt.toISOString(),
        originLabel: route?.origin ?? input.pickupAddress,
        destinationLabel: route?.destination ?? input.destinationAddress,
        pickupAddress: input.pickupAddress,
        destinationAddress: input.destinationAddress,
        passengerName: input.name,
        passengerEmail: input.email,
        passengerPhone: phone,
        passengers: input.passengers,
        luggage: input.luggage,
        childSeats: input.childSeats,
        specialInstructions: input.notes || null,
        flightNumber: input.flightNumber || null,
        meetAndGreet: input.meetAndGreet,
        paymentMethod: input.paymentMethod,
        pickupLatitude: pickupCoordinates.lat,
        pickupLongitude: pickupCoordinates.lng,
        destinationLatitude: destinationCoordinates.lat,
        destinationLongitude: destinationCoordinates.lng,
        distanceKm: pricing.distanceKm,
        distanceSource: pricing.distanceSource,
        pricingRegion: pricing.region,
        pricingTierLabel: pricing.tierLabel,
        ratePerKmCents: toCents(pricing.ratePerKm),
        pickupFeeCents: toCents(pricing.pickupFee),
        oneWaySubtotalCents: toCents(pricing.oneWaySubtotal),
        roundTrip: pricing.roundTrip,
        roundTripDiscountCents: toCents(pricing.roundTripDiscount),
        urgentService: pricing.urgentService,
        urgentSurchargeCents: toCents(pricing.urgentSurcharge),
        pricingBreakdown: pricing,
        totalCents: Math.round(total * 100),
        currency: pricing.currency,
        updatedAt: new Date().toISOString()
      }])
      .select("id,reference")
      .single(),
    "Create booking"
  ) as Pick<DbBooking, "id" | "reference">;

  await writeBookingAudit({
    actorId: actor?.id,
    entityId: bookingId,
    action: "booking.created",
    payload: {
      reference,
      paymentMethod: input.paymentMethod,
      driverId: null,
      pricing
    }
  });

  return {
    id: booking.id,
    reference: booking.reference,
    total,
    checkoutMode: "FIXED" as const,
    contactRequired: false,
    distanceKm: pricing.distanceKm
  };
}

export async function createQuote(input: QuoteInput, actor?: SessionUser | null) {
  const pickupAt = new Date(`${input.pickupDate}T${input.pickupTime}`);
  const reference = makeReference("HQ");
  const noteParts = [
    input.routeSummary,
    input.pickupLabel ? `Pickup point: ${input.pickupLabel}` : "",
    input.destinationLabel ? `Drop-off point: ${input.destinationLabel}` : "",
    input.pickupCoordinates ? `Pickup coordinates: ${input.pickupCoordinates}` : "",
    input.destinationCoordinates ? `Drop-off coordinates: ${input.destinationCoordinates}` : "",
    input.notes ?? ""
  ].filter(Boolean);

  if (!isInsForgeConfigured()) {
    return {
      id: reference,
      reference
    };
  }

  const phoneCountryIso = normalizePhoneCountryIso(input.phoneCountryIso);
  const phone = buildPhoneNumber(phoneCountryIso, input.phoneNationalNumber);
  const insforge = createInsForgeServerClient();
  const customerId = await resolveCustomerId(input.email, input.name, phone, actor);

  const quote = await unwrapInsForgeResult(
    insforge.database
      .from("RideQuote")
      .insert([{
        id: `quote_${crypto.randomUUID()}`,
        reference,
        customerId,
        pickupAt: pickupAt.toISOString(),
        passengerName: input.name,
        passengerEmail: input.email,
        passengerPhone: phone,
        passengers: input.passengers,
        luggage: input.luggage,
        requestedVehicle: input.requestedVehicle || null,
        notes: noteParts.join("\n")
      }])
      .select("id,reference")
      .single(),
    "Create quote"
  ) as Pick<DbRideQuote, "id" | "reference">;

  return {
    id: quote.id,
    reference: quote.reference
  };
}

function isBookingStatus(value: string): value is BookingRecord["status"] {
  return ["PENDING", "PENDING_PAYMENT", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "ARRIVED", "COMPLETED", "CANCELLED"].includes(value);
}

const bookingStatusTransitions: Record<BookingRecord["status"], BookingRecord["status"][]> = {
  PENDING: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED"],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "ARRIVED", "CANCELLED"],
  IN_PROGRESS: ["ARRIVED", "COMPLETED", "CANCELLED"],
  ARRIVED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

const driverStatusTransitions = new Set<BookingRecord["status"]>([
  "IN_PROGRESS",
  "ARRIVED",
  "COMPLETED",
  "CANCELLED"
]);

export async function updateBookingStatus(
  bookingId: string,
  status: string,
  actor: SessionUser
) {
  if (!isBookingStatus(status)) {
    throw new Error("Unsupported booking status.");
  }

  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const booking = (await unwrapInsForgeResult(
    insforge.database.from("Booking").select("id,driverId,status").eq("id", bookingId).maybeSingle(),
    "Load booking before status update"
  )) as Pick<DbBooking, "id" | "driverId" | "status"> | null;

  if (!booking) {
    throw new Error("Booking was not found.");
  }

  if (actor.role === "DRIVER" && booking.driverId !== actor.id) {
    throw new Error("Drivers can only update rides they have accepted.");
  }

  if (status === booking.status) {
    return;
  }

  if (!bookingStatusTransitions[booking.status].includes(status)) {
    throw new Error(`Booking cannot move from ${booking.status} to ${status}.`);
  }

  if (actor.role === "DRIVER" && !driverStatusTransitions.has(status)) {
    throw new Error("Drivers cannot make this booking status change.");
  }

  await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .update({
        status,
        updatedAt: new Date().toISOString()
      })
      .eq("id", bookingId),
    "Update booking status"
  );

  await writeBookingAudit({
    actorId: actor.id,
    entityId: bookingId,
    action: "booking.status_updated",
    payload: { status }
  });
}

export async function assignBookingDriver(
  bookingId: string,
  driverProfileId: string,
  actor: SessionUser
) {
  if (actor.role !== "ADMIN") {
    throw new Error("Only admins can assign drivers.");
  }

  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const driver = (await unwrapInsForgeResult(
    insforge.database.from("DriverProfile").select("*").eq("id", driverProfileId).maybeSingle(),
    "Load assignment driver"
  )) as DbDriverProfile | null;

  if (!driver) {
    throw new Error("Driver was not found.");
  }

  const booking = (await unwrapInsForgeResult(
    insforge.database.from("Booking").select("pickupAt").eq("id", bookingId).maybeSingle(),
    "Load booking for assignment"
  )) as Pick<DbBooking, "pickupAt"> | null;

  if (!booking) {
    throw new Error("Booking was not found.");
  }

  await assertDriverAvailable(driver.userId, new Date(booking.pickupAt));

  await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .update({
        driverId: driver.userId,
        status: "ASSIGNED",
        updatedAt: new Date().toISOString()
      })
      .eq("id", bookingId),
    "Assign booking driver"
  );

  await writeBookingAudit({
    actorId: actor.id,
    entityId: bookingId,
    action: "booking.driver_assigned",
    payload: { driverProfileId, driverUserId: driver.userId }
  });
}

export async function acceptBooking(
  bookingId: string,
  actor: SessionUser
) {
  if (actor.role !== "DRIVER") {
    throw new Error("Only drivers can accept open rides.");
  }

  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const [driver, booking] = await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("DriverProfile").select("*").eq("userId", actor.id).maybeSingle(),
      "Load current driver"
    ) as Promise<DbDriverProfile | null>,
    unwrapInsForgeResult(
      insforge.database
        .from("Booking")
        .select("id,reference,customerId,driverId,pickupAt,status,originLabel,destinationLabel,passengerName,passengerEmail")
        .eq("id", bookingId)
        .maybeSingle(),
      "Load booking for acceptance"
    ) as Promise<
      Pick<
        DbBooking,
        | "id"
        | "reference"
        | "customerId"
        | "driverId"
        | "pickupAt"
        | "status"
        | "originLabel"
        | "destinationLabel"
        | "passengerName"
        | "passengerEmail"
      > | null
    >
  ]);

  if (!driver) {
    throw new Error("Driver profile was not found.");
  }

  if (!booking) {
    throw new Error("Booking was not found.");
  }

  if (booking.driverId === actor.id) {
    return;
  }

  if (booking.driverId) {
    throw new Error("This ride has already been accepted by another driver.");
  }

  if (!openDriverQueueStatuses.has(booking.status)) {
    throw new Error("This ride is no longer open for driver acceptance.");
  }

  await assertDriverAvailable(actor.id, new Date(booking.pickupAt));

  const accepted = await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .update({
        driverId: actor.id,
        status: "ASSIGNED",
        updatedAt: new Date().toISOString()
      })
      .eq("id", bookingId)
      .is("driverId", null)
      .select("id")
      .maybeSingle(),
    "Accept booking"
  );

  if (!accepted) {
    throw new Error("This ride was just accepted by another driver.");
  }

  await writeBookingAudit({
    actorId: actor.id,
    entityId: bookingId,
    action: "booking.accepted_by_driver",
    payload: { driverProfileId: driver.id, driverUserId: actor.id }
  });

  return {
    bookingId: booking.id,
    customerId: booking.customerId,
    reference: booking.reference,
    customerName: booking.passengerName,
    customerEmail: booking.passengerEmail,
    pickupAt: booking.pickupAt,
    origin: booking.originLabel,
    destination: booking.destinationLabel
  };
}

export async function createDriver(
  input: DriverCreateInput,
  actor: SessionUser
) {
  if (actor.role !== "ADMIN") {
    throw new Error("Only admins can add drivers.");
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (!isInsForgeConfigured()) {
    return {
      userId: `demo_driver_${normalizedEmail}`,
      name: input.name,
      email: normalizedEmail
    };
  }

  const insforge = createInsForgeServerClient();
  const [existing, pendingEmailMatch] = await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("User").select("id").eq("email", normalizedEmail).maybeSingle(),
      "Check existing driver email"
    ),
    unwrapInsForgeResult(
      insforge.database
        .from("User")
        .select("id")
        .eq("pendingEmail", normalizedEmail)
        .maybeSingle(),
      "Check pending driver email"
    )
  ]);

  if (existing?.id || pendingEmailMatch?.id) {
    throw new Error("That email is already being used by another account.");
  }

  const userId = `user_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const phoneCountryIso = normalizePhoneCountryIso(input.phoneCountryIso);
  const phone = buildPhoneNumber(phoneCountryIso, input.phoneNationalNumber);

  await unwrapInsForgeResult(
    insforge.database.from("User").insert([{
      id: userId,
      role: "DRIVER",
      name: input.name,
      email: normalizedEmail,
      phone,
      phoneCountryIso,
      passwordHash,
      mustChangePassword: true,
      updatedAt: now
    }]),
    "Create driver user"
  );

  await unwrapInsForgeResult(
    insforge.database.from("DriverProfile").insert([{
      id: `driver_${crypto.randomUUID()}`,
      userId,
      baseCity: input.baseCity,
      status: "AVAILABLE"
    }]),
    "Create driver profile"
  );

  return {
    userId,
    name: input.name,
    email: normalizedEmail
  };
}

export async function deleteDriver(
  driverProfileId: string,
  actor: SessionUser
) {
  if (actor.role !== "ADMIN") {
    throw new Error("Only admins can remove drivers.");
  }

  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const driver = (await unwrapInsForgeResult(
    insforge.database.from("DriverProfile").select("id,userId").eq("id", driverProfileId).maybeSingle(),
    "Load driver for removal"
  )) as Pick<DbDriverProfile, "id" | "userId"> | null;

  if (!driver) {
    return;
  }

  await unwrapInsForgeResult(
    insforge.database.from("User").delete().eq("id", driver.userId),
    "Delete driver"
  );
}

export async function markBookingPaid(
  bookingId: string,
  provider: string,
  actor: SessionUser
) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const booking = (await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .select("id,reference,customerId,status,paymentStatus,totalCents,currency")
      .eq("id", bookingId)
      .maybeSingle(),
    "Load manual payment booking"
  )) as Pick<DbBooking, "id" | "reference" | "customerId" | "status" | "paymentStatus" | "totalCents" | "currency"> | null;

  if (!booking) {
    throw new Error("Booking was not found.");
  }

  const normalizedProvider = provider.trim().toUpperCase();
  const allowedProviders = new Set(["CASH", "BANK_TRANSFER", "INVOICE", "MANUAL"]);

  if (!allowedProviders.has(normalizedProvider)) {
    throw new Error("Unsupported manual payment provider.");
  }

  if (booking.paymentStatus === "PAID") {
    return;
  }

  if (actor.role === "DRIVER") {
    const assigned = (await unwrapInsForgeResult(
      insforge.database.from("Booking").select("driverId").eq("id", bookingId).maybeSingle(),
      "Load assigned driver before payment update"
    )) as Pick<DbBooking, "driverId"> | null;

    if (assigned?.driverId !== actor.id) {
      throw new Error("Drivers can only mark their own rides as paid.");
    }

    if (booking.status !== "COMPLETED" || normalizedProvider !== "CASH") {
      throw new Error("Drivers can only record cash after completing their assigned ride.");
    }
  }

  await applyStripePaymentUpdate({
    bookingId,
    providerRef: `manual_${booking.reference}`,
    amountCents: booking.totalCents,
    currency: booking.currency,
    status: "PAID",
    provider: normalizedProvider,
    capturedAt: new Date().toISOString(),
    eventType: "manual.payment_recorded",
    payload: { provider: normalizedProvider, actorId: actor.id }
  });
}

type StripePaymentUpdateInput = {
  bookingId?: string | null;
  reference?: string | null;
  providerRef?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  status: PaymentStatus;
  provider?: string;
  capturedAt?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
};

type StripePaymentUpdateResult = {
  matched: boolean;
  bookingId?: string;
  bookingReference?: string;
  customerId?: string;
  paymentStatus?: PaymentStatus;
};

function deriveBookingStatus(currentStatus: BookingRecord["status"], paymentStatus: PaymentStatus) {
  if (paymentStatus === "AUTHORIZED") {
    return currentStatus === "PENDING" || currentStatus === "PENDING_PAYMENT"
      ? "CONFIRMED"
      : currentStatus;
  }

  if (paymentStatus === "PAID") {
    return currentStatus === "PENDING" || currentStatus === "PENDING_PAYMENT"
      ? "CONFIRMED"
      : currentStatus;
  }

  if (paymentStatus === "UNPAID" && currentStatus === "PENDING") {
    return "PENDING_PAYMENT";
  }

  return currentStatus;
}

export async function applyStripePaymentUpdate(
  input: StripePaymentUpdateInput
): Promise<StripePaymentUpdateResult> {
  if (!isInsForgeConfigured()) {
    return { matched: false };
  }

  const insforge = createInsForgeServerClient();
  let booking:
    | Pick<DbBooking, "id" | "reference" | "customerId" | "status" | "paymentStatus" | "totalCents" | "currency">
    | null = null;

  if (input.bookingId) {
    booking = (await unwrapInsForgeResult(
      insforge.database
        .from("Booking")
        .select("id,reference,customerId,status,paymentStatus,totalCents,currency")
        .eq("id", input.bookingId)
        .maybeSingle(),
      "Load webhook booking by id"
    )) as
      | Pick<DbBooking, "id" | "reference" | "customerId" | "status" | "paymentStatus" | "totalCents" | "currency">
      | null;
  }

  if (!booking && input.reference) {
    booking = (await unwrapInsForgeResult(
      insforge.database
        .from("Booking")
        .select("id,reference,customerId,status,paymentStatus,totalCents,currency")
        .eq("reference", input.reference)
        .maybeSingle(),
      "Load webhook booking by reference"
    )) as
      | Pick<DbBooking, "id" | "reference" | "customerId" | "status" | "paymentStatus" | "totalCents" | "currency">
      | null;
  }

  if (!booking && input.providerRef) {
    const payment = (await unwrapInsForgeResult(
      insforge.database
        .from("PaymentTransaction")
        .select("bookingId")
        .eq("providerRef", input.providerRef)
        .maybeSingle(),
      "Load webhook payment"
    )) as Pick<DbPaymentTransaction, "bookingId"> | null;

    if (payment?.bookingId) {
      booking = (await unwrapInsForgeResult(
        insforge.database
          .from("Booking")
          .select("id,reference,customerId,status,paymentStatus,totalCents,currency")
          .eq("id", payment.bookingId)
          .maybeSingle(),
        "Load webhook booking by payment"
      )) as
        | Pick<DbBooking, "id" | "reference" | "customerId" | "status" | "paymentStatus" | "totalCents" | "currency">
        | null;
    }
  }

  if (!booking) {
    return { matched: false };
  }

  const existingPayment = (await unwrapInsForgeResult(
    insforge.database.from("PaymentTransaction").select("*").eq("bookingId", booking.id).maybeSingle(),
    "Load existing payment transaction"
  )) as DbPaymentTransaction | null;

  const now = new Date().toISOString();
  const amountCents = input.amountCents ?? existingPayment?.amountCents ?? booking.totalCents;
  const currency = (input.currency ?? existingPayment?.currency ?? booking.currency ?? "CAD").toUpperCase();
  const providerRef = input.providerRef ?? existingPayment?.providerRef ?? null;
  const provider = input.provider ?? "STRIPE";
  const capturedAt = input.status === "PAID" ? input.capturedAt ?? existingPayment?.capturedAt ?? now : null;

  if (
    (input.status === "PAID" || input.status === "AUTHORIZED") &&
    (amountCents !== booking.totalCents || currency !== booking.currency.toUpperCase())
  ) {
    throw new Error("Stripe payment amount or currency does not match the booking total.");
  }

  if (existingPayment) {
    await unwrapInsForgeResult(
      insforge.database
        .from("PaymentTransaction")
        .update({
          provider,
          providerRef,
          amountCents,
          currency,
          status: input.status,
          capturedAt
        })
        .eq("id", existingPayment.id),
      "Update payment transaction"
    );
  } else {
    await unwrapInsForgeResult(
      insforge.database.from("PaymentTransaction").insert([{
        id: `payment_${crypto.randomUUID()}`,
        bookingId: booking.id,
        provider,
        providerRef,
        amountCents,
        currency,
        status: input.status,
        capturedAt
      }]),
      "Create payment transaction"
    );
  }

  const nextBookingStatus = deriveBookingStatus(booking.status, input.status);

  await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .update({
        paymentStatus: input.status,
        status: nextBookingStatus,
        updatedAt: now
      })
      .eq("id", booking.id),
    "Update booking payment status"
  );

  const existingInvoice = (await unwrapInsForgeResult(
    insforge.database.from("Invoice").select("*").eq("bookingId", booking.id).maybeSingle(),
    "Load existing invoice"
  )) as DbInvoice | null;

  const invoicePayload = {
    number: existingInvoice?.number ?? `INV-${booking.reference}`,
    bookingId: booking.id,
    customerId: booking.customerId,
    subtotalCents: booking.totalCents,
    taxCents: existingInvoice?.taxCents ?? 0,
    totalCents: booking.totalCents + (existingInvoice?.taxCents ?? 0),
    currency,
    dueAt: existingInvoice?.dueAt ?? null,
    paidAt:
      input.status === "PAID"
        ? existingInvoice?.paidAt ?? capturedAt ?? now
        : input.status === "REFUNDED"
          ? existingInvoice?.paidAt ?? capturedAt ?? now
          : null,
    pdfUrl: existingInvoice?.pdfUrl ?? null
  };

  if (existingInvoice) {
    await unwrapInsForgeResult(
      insforge.database.from("Invoice").update(invoicePayload).eq("id", existingInvoice.id),
      "Update invoice"
    );
  } else {
    await unwrapInsForgeResult(
      insforge.database.from("Invoice").insert([{
        id: `invoice_${crypto.randomUUID()}`,
        issuedAt: now,
        ...invoicePayload
      }]),
      "Create invoice"
    );
  }

  await unwrapInsForgeResult(
    insforge.database.from("AuditLog").insert([{
      id: `audit_${crypto.randomUUID()}`,
      actorId: null,
      entityType: "Booking",
      entityId: booking.id,
      action: `stripe.${input.eventType}`,
      payload: {
        bookingReference: booking.reference,
        providerRef,
        amountCents,
        currency,
        paymentStatus: input.status,
        eventType: input.eventType,
        ...input.payload
      }
    }]),
    "Create payment audit log"
  );

  return {
    matched: true,
    bookingId: booking.id,
    bookingReference: booking.reference,
    customerId: booking.customerId,
    paymentStatus: input.status
  };
}

export async function applyTipPaymentUpdate(input: {
  bookingId?: string | null;
  reference?: string | null;
  providerRef?: string | null;
  amountCents?: number | null;
  status: PaymentStatus;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  if (!isInsForgeConfigured()) {
    return { matched: false };
  }

  const insforge = createInsForgeServerClient();
  let booking:
    | Pick<DbBooking, "id" | "reference" | "customerId" | "tipCents" | "tipPaymentStatus">
    | null = null;

  if (input.bookingId) {
    booking = (await unwrapInsForgeResult(
      insforge.database
        .from("Booking")
        .select("id,reference,customerId,tipCents,tipPaymentStatus")
        .eq("id", input.bookingId)
        .maybeSingle(),
      "Load tip booking by id"
    )) as Pick<DbBooking, "id" | "reference" | "customerId" | "tipCents" | "tipPaymentStatus"> | null;
  }

  if (!booking && input.reference) {
    booking = (await unwrapInsForgeResult(
      insforge.database
        .from("Booking")
        .select("id,reference,customerId,tipCents,tipPaymentStatus")
        .eq("reference", input.reference)
        .maybeSingle(),
      "Load tip booking by reference"
    )) as Pick<DbBooking, "id" | "reference" | "customerId" | "tipCents" | "tipPaymentStatus"> | null;
  }

  if (!booking) {
    return { matched: false };
  }

  const now = new Date().toISOString();
  const tipCents = input.status === "PAID" ? input.amountCents ?? booking.tipCents ?? 0 : booking.tipCents ?? 0;

  await unwrapInsForgeResult(
    insforge.database
      .from("Booking")
      .update({
        tipCents,
        tipPaymentStatus: input.status,
        tipProviderRef: input.providerRef ?? null,
        tipPaidAt: input.status === "PAID" ? now : null,
        updatedAt: now
      })
      .eq("id", booking.id),
    "Update booking tip payment"
  );

  await unwrapInsForgeResult(
    insforge.database.from("AuditLog").insert([{
      id: `audit_${crypto.randomUUID()}`,
      actorId: null,
      entityType: "Booking",
      entityId: booking.id,
      action: `stripe.${input.eventType}.tip`,
      payload: {
        bookingReference: booking.reference,
        providerRef: input.providerRef ?? null,
        tipCents,
        paymentStatus: input.status,
        ...input.payload
      }
    }]),
    "Create tip payment audit log"
  );

  return {
    matched: true,
    bookingId: booking.id,
    bookingReference: booking.reference,
    customerId: booking.customerId,
    paymentStatus: input.status
  };
}

export async function claimStripeEvent(eventId: string, eventType: string) {
  if (!isInsForgeConfigured()) {
    return true;
  }

  const insforge = createInsForgeServerClient();
  const existing = await unwrapInsForgeResult(
    insforge.database.from("PaymentEvent").select("id").eq("eventId", eventId).maybeSingle(),
    "Check Stripe event"
  );

  if (existing) {
    return false;
  }

  await unwrapInsForgeResult(
    insforge.database.from("PaymentEvent").insert([{
      id: `payment_event_${crypto.randomUUID()}`,
      eventId,
      eventType
    }]),
    "Claim Stripe event"
  );

  return true;
}

export async function releaseStripeEvent(eventId: string) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  await unwrapInsForgeResult(
    insforge.database.from("PaymentEvent").delete().eq("eventId", eventId),
    "Release failed Stripe event"
  );
}
