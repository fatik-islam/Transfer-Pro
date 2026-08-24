export type UserRole = "ADMIN" | "DRIVER" | "CUSTOMER";
export type RouteMode = "FIXED" | "QUOTE";
export type QuoteStatus = "PENDING" | "OFFER_SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED";
export type BookingStatus =
  | "PENDING"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus = "UNPAID" | "AUTHORIZED" | "PAID" | "REFUNDED";
export type PaymentMethod = "STRIPE" | "PAY_LATER" | "CASH" | "BANK_TRANSFER" | "INVOICE";
export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_SHIFT";

export interface DemoUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface RouteCard {
  id: string;
  slug: string;
  origin: string;
  destination: string;
  duration: string;
  distance: string;
  mode: RouteMode;
  fromPrice?: number;
  pricingByVehicle?: Record<string, number>;
  copy: string;
  tags: string[];
}

export interface FleetVehicle {
  id: string;
  slug: string;
  name: string;
  classLabel: string;
  seats: number;
  luggage: number;
  priceFrom: number;
  summary: string;
  features: string[];
}

export interface BookingRecord {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  pickupAt: string;
  origin: string;
  destination: string;
  vehicle: string;
  driver?: string;
  driverId?: string;
  passengerPhone?: string;
  paymentMethod?: PaymentMethod;
  paymentMethodLabel?: string;
  flightNumber?: string;
  meetAndGreet?: boolean;
  timeline?: Array<{ label: string; active: boolean; completed: boolean }>;
  repeatHref?: string;
  whatsappHref?: string;
  callHref?: string;
  openToAccept?: boolean;
  assignedToCurrentUser?: boolean;
  paymentActionHref?: string;
  invoiceDownloadHref?: string;
  receiptDownloadHref?: string;
  tipAmount?: number;
  tipPaymentStatus?: PaymentStatus;
  total: number;
  roleVisibleTo: UserRole[];
}

export interface QuoteRecord {
  id: string;
  reference: string;
  customerName: string;
  route: string;
  pickupAt: string;
  status: QuoteStatus;
  offer?: number;
  roleVisibleTo: UserRole[];
}

export interface DriverCard {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  baseCity: string;
  rating: number;
  status: DriverStatus;
  assignedVehicle: string;
  jobsToday: number;
}

export interface InvoiceRecord {
  id: string;
  number: string;
  bookingReference: string;
  customerName: string;
  issuedAt: string;
  total: number;
  status: "OPEN" | "PAID" | "REFUNDED";
  downloadHref?: string;
  receiptHref?: string;
  paymentHref?: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export interface DashboardSummaryItem {
  label: string;
  value: string;
  detail: string;
}

export interface DestinationGuide {
  slug: string;
  headline: string;
  intro: string;
  highlights: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface SessionUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  sessionVersion: number;
  mustChangePassword: boolean;
}

export interface AccountProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  phoneCountryIso?: string;
  pendingPhone?: string;
  pendingPhoneCountryIso?: string;
  pendingEmail?: string;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  mustChangePassword?: boolean;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface TransferPricingQuote {
  pricingMode: "INSTANT" | "CONTACT";
  currency: string;
  distanceKm: number;
  distanceSource: "routing" | "estimated";
  region: "GENERAL" | "USA";
  tierLabel: string;
  ratePerKm: number | null;
  pickupFee: number;
  oneWaySubtotal: number | null;
  roundTrip: boolean;
  roundTripDiscount: number;
  urgentService: boolean;
  urgentSurcharge: number;
  total: number | null;
  pickupAt?: string;
  offerToken?: string;
  offerExpiresAt?: string;
  contactReason?: string;
}
