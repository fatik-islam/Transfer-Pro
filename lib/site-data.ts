import type {
  BookingRecord,
  DemoUser,
  DestinationGuide,
  DriverCard,
  FleetVehicle,
  InvoiceRecord,
  QuoteRecord,
  RouteCard
} from "@/lib/types";

export const brand = {
  name: "Transfer Pro",
  tagline: "Private chauffeurs. Premium journeys.",
  description:
    "Transfer Pro is a direct private transfer service for regular customers who want a known driver, clear pricing, airport pickup support, and simple repeat booking across Toronto, Montreal, and Canada to USA routes."
} as const;

export const trustStats = [
  { label: "Average first offer", value: "< 5 min" },
  { label: "On-time pickup rate", value: "96%" },
  { label: "Returning passengers", value: "42%" },
  { label: "Rated completed rides", value: "4.9/5" }
] as const;

export const marketplaceAdvantages = [
  "Book as a guest without creating an account",
  "Lock a clear fare before checkout",
  "Call or WhatsApp the driver when timing changes",
  "Repeat a previous ride from your booking history"
] as const;

export const demoUsers: DemoUser[] = [
  {
    id: "user_admin_demo",
    role: "ADMIN",
    name: "Transfer Pro Admin",
    email: "admin@transferpro.test",
    password: "demo1234",
    phone: "+1 416 555 2201"
  },
  {
    id: "user_driver_demo",
    role: "DRIVER",
    name: "Transfer Pro Driver",
    email: "driver@transferpro.test",
    password: "demo1234",
    phone: "+1 416 555 2202"
  },
  {
    id: "user_customer_demo",
    role: "CUSTOMER",
    name: "Lena Hart",
    email: "customer@transferpro.test",
    password: "demo1234",
    phone: "+44 20 7946 0991"
  }
];

export const routeCatalog: RouteCard[] = [
  {
    id: "route_toronto_montreal",
    slug: "toronto-to-montreal",
    origin: "Toronto",
    destination: "Montreal",
    duration: "5 hr 45 min",
    distance: "542 km",
    mode: "FIXED",
    fromPrice: 1084,
    copy: "Direct intercity transfer between Toronto and Montreal with a locked fare and pickup-time planning.",
    tags: ["Toronto", "Montreal", "Intercity"]
  },
  {
    id: "route_toronto_city",
    slug: "toronto-city-rides",
    origin: "Toronto",
    destination: "Greater Toronto Area",
    duration: "30-90 min",
    distance: "10-80 km",
    mode: "FIXED",
    fromPrice: 34,
    copy: "Local airport, hotel, appointment, and family transfers within Toronto and the GTA.",
    tags: ["Toronto", "Airport", "Local"]
  },
  {
    id: "route_montreal_city",
    slug: "montreal-city-rides",
    origin: "Montreal",
    destination: "Greater Montreal Area",
    duration: "30-90 min",
    distance: "10-80 km",
    mode: "FIXED",
    fromPrice: 34,
    copy: "Private local rides across Montreal for airport pickups, hotels, meetings, and regular customers.",
    tags: ["Montreal", "Airport", "Local"]
  },
  {
    id: "route_canada_usa",
    slug: "canada-to-usa",
    origin: "Canada",
    destination: "United States",
    duration: "Custom",
    distance: "Custom",
    mode: "QUOTE",
    copy: "Cross-border trips are reviewed manually for distance, timing, border wait, and return planning.",
    tags: ["Canada to USA", "Cross-border", "Quote"]
  }
];

export const fleetVehicles: FleetVehicle[] = [
  {
    id: "vehicle_transpro_private",
    slug: "transpro-private-car",
    name: "Transfer Pro Private Car",
    classLabel: "Private car",
    seats: 5,
    luggage: 4,
    priceFrom: 34,
    summary: "The main vehicle for airport pickups, city rides, and Toronto-Montreal transfers.",
    features: ["Direct driver contact", "Child seat on request", "WhatsApp pickup updates"]
  }
];

export const dashboardBookings: BookingRecord[] = [
  {
    id: "booking_501",
    reference: "HB-501",
    customerName: "Lena Hart",
    customerEmail: "customer@transferpro.test",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    pickupAt: "2026-04-14T18:30:00.000Z",
    origin: "Toronto Pearson Airport",
    destination: "Downtown Toronto",
    vehicle: "Transfer Pro Private Car",
    driver: "Transfer Pro Driver",
    total: 164,
    roleVisibleTo: ["ADMIN", "DRIVER", "CUSTOMER"]
  },
  {
    id: "booking_502",
    reference: "HB-502",
    customerName: "Daniel Nouri",
    customerEmail: "daniel@solstice.group",
    status: "ASSIGNED",
    paymentStatus: "AUTHORIZED",
    pickupAt: "2026-04-15T07:15:00.000Z",
    origin: "Montreal-Trudeau Airport",
    destination: "Downtown Montreal",
    vehicle: "Transfer Pro Private Car",
    driver: "Transfer Pro Driver",
    total: 226,
    roleVisibleTo: ["ADMIN", "DRIVER"]
  },
  {
    id: "booking_503",
    reference: "HB-503",
    customerName: "Mina Solberg",
    customerEmail: "mina@fjordatelier.no",
    status: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
    pickupAt: "2026-04-18T09:45:00.000Z",
    origin: "Toronto",
    destination: "Montreal",
    vehicle: "Transfer Pro Private Car",
    total: 340,
    roleVisibleTo: ["ADMIN", "CUSTOMER"]
  }
];

export const dashboardQuotes: QuoteRecord[] = [
  {
    id: "quote_118",
    reference: "HQ-118",
    customerName: "Mina Solberg",
    route: "Toronto to Montreal",
    pickupAt: "2026-04-18T09:45:00.000Z",
    status: "OFFER_SENT",
    offer: 340,
    roleVisibleTo: ["ADMIN", "CUSTOMER"]
  },
  {
    id: "quote_119",
    reference: "HQ-119",
    customerName: "Rami Asfour",
    route: "Canada to USA cross-border ride",
    pickupAt: "2026-04-16T14:00:00.000Z",
    status: "PENDING",
    roleVisibleTo: ["ADMIN"]
  }
];

export const driverCards: DriverCard[] = [
  {
    id: "driver_1",
    userId: "user_driver_demo",
    name: "Transfer Pro Driver",
    email: "driver@transferpro.test",
    phone: "+1 416 555 0101",
    baseCity: "Toronto",
    rating: 4.9,
    status: "AVAILABLE",
    assignedVehicle: "Transfer Pro Private Car",
    jobsToday: 4
  },
  {
    id: "driver_2",
    userId: "demo_driver_2",
    name: "Hana Duarte",
    email: "hana@transferpro.test",
    phone: "+1 438 555 0110",
    baseCity: "Montreal",
    rating: 4.8,
    status: "ON_TRIP",
    assignedVehicle: "Executive Van",
    jobsToday: 3
  },
  {
    id: "driver_3",
    userId: "demo_driver_3",
    name: "Bilal Iqbal",
    email: "bilal@transferpro.test",
    phone: "+1 647 555 0144",
    baseCity: "Toronto",
    rating: 4.7,
    status: "OFF_SHIFT",
    assignedVehicle: "Backup Sedan",
    jobsToday: 0
  }
];

export const invoiceRecords: InvoiceRecord[] = [
  {
    id: "invoice_2001",
    number: "INV-2001",
    bookingReference: "HB-501",
    customerName: "Lena Hart",
    issuedAt: "2026-04-10T12:00:00.000Z",
    total: 164,
    status: "PAID"
  },
  {
    id: "invoice_2002",
    number: "INV-2002",
    bookingReference: "HB-503",
    customerName: "Mina Solberg",
    issuedAt: "2026-04-11T15:30:00.000Z",
    total: 340,
    status: "OPEN"
  }
];

export const faqItems = [
  {
    question: "How does fixed pricing work?",
    answer:
      "Routes you configure in the admin workspace show instant prices by vehicle. Taxes, margin, and deposit rules are included before checkout."
  },
  {
    question: "When should a ride be quote-based?",
    answer:
      "Use quote mode for long-distance, event, hourly disposal, or custom multi-stop jobs where margin depends on schedule complexity."
  },
  {
    question: "Can drivers manage trips from mobile?",
    answer:
      "Yes. The driver view is built mobile-first, with upcoming trips, passenger notes, contact shortcuts, and status controls."
  },
  {
    question: "How do invoices and notifications work?",
    answer:
      "The system creates invoice records per booking and can fan out booking, reminder, and completion messages across email, SMS, or WhatsApp integrations."
  }
] as const;

export const offerHighlights = [
  {
    eyebrow: "Intercity",
    title: "Toronto to Montreal",
    copy: "A direct private ride with pickup-time planning, locked fare, luggage notes, and return-trip support.",
    priceFrom: 1084,
    href: "/destinations/toronto-to-montreal-private-transfer"
  },
  {
    eyebrow: "Local",
    title: "Toronto and Montreal city rides",
    copy: "Airport pickups, hotel transfers, appointments, and regular customer rides without account friction.",
    priceFrom: 34,
    href: "/destinations/toronto-montreal-city-rides"
  },
  {
    eyebrow: "Cross-border",
    title: "Canada to USA rides",
    copy: "Long-distance and cross-border rides go to admin review for border timing, waiting, and return planning.",
    priceFrom: 0,
    href: "/destinations/canada-to-usa-private-transfer"
  }
] as const;

export const locationCollections = [
  {
    id: "airports",
    label: "Airports",
    headline: "Airport pickups with direct driver contact",
    description: "Use flight numbers, meet-and-greet notes, and WhatsApp updates for arrivals.",
    routes: [
      {
        origin: "Toronto Pearson Airport",
        destination: "Toronto or GTA address",
        note: "Flight number, luggage, and terminal pickup notes",
        priceFrom: 34,
        href: "/book?vehicle=transpro-private-car"
      },
      {
        origin: "Montreal-Trudeau Airport",
        destination: "Montreal area address",
        note: "Meet-and-greet and late-night pickup policy",
        priceFrom: 34,
        href: "/book?vehicle=transpro-private-car"
      }
    ]
  },
  {
    id: "city",
    label: "City rides",
    headline: "Local rides for regular customers",
    description: "Short trips across Toronto and Montreal with repeat booking and manual payment options.",
    routes: [
      {
        origin: "Toronto",
        destination: "Greater Toronto Area",
        note: "Appointments, hotels, family visits, and airport rides",
        priceFrom: 34,
        href: "/destinations/toronto-montreal-city-rides"
      },
      {
        origin: "Montreal",
        destination: "Greater Montreal Area",
        note: "City rides, hotel pickups, airport runs, and family transfers",
        priceFrom: 34,
        href: "/destinations/toronto-montreal-city-rides"
      }
    ]
  },
  {
    id: "intercity",
    label: "Intercity",
    headline: "Long-distance rides with admin review when needed",
    description: "Instant pricing up to 1000 km, with direct admin help above that threshold.",
    routes: [
      {
        origin: "Toronto",
        destination: "Montreal",
        note: "Direct intercity ride with return-trip discount when applicable",
        priceFrom: 1084,
        href: "/destinations/toronto-to-montreal-private-transfer"
      },
      {
        origin: "Canada",
        destination: "United States",
        note: "Cross-border timing, border waits, and return planning",
        priceFrom: 0,
        href: "/destinations/canada-to-usa-private-transfer"
      }
    ]
  },
  {
    id: "policies",
    label: "Policies",
    headline: "Clear rules before the ride",
    description: "Waiting time, cancellation, child seats, airport pickup, and late-night details are stated upfront.",
    routes: [
      {
        origin: "Airport pickup",
        destination: "Any served address",
        note: "Flight number, meet-and-greet, child seat, and luggage notes",
        priceFrom: 34,
        href: "/how-it-works"
      },
      {
        origin: "Late-night ride",
        destination: "Toronto, Montreal, or intercity",
        note: "Urgent service is automatic within 35 minutes",
        priceFrom: 34,
        href: "/how-it-works"
      }
    ]
  }
] as const;

export const travelerReviews = [
  {
    name: "Amina S.",
    trip: "Airport pickup and return ride",
    quote:
      "I like booking with the same driver. The pickup was confirmed quickly and I could message on WhatsApp when my flight changed."
  },
  {
    name: "Daniel N.",
    trip: "Cruise terminal transfer",
    quote:
      "The fare was clear before checkout and the driver helped with luggage without making the ride feel rushed."
  },
  {
    name: "Lena H.",
    trip: "Executive intercity booking",
    quote:
      "For Toronto to Montreal, having one person accountable for pickup, stops, and arrival timing made the trip easier."
  }
] as const;

export const destinationGuides: DestinationGuide[] = [
  {
    slug: "toronto-to-montreal-private-transfer",
    headline: "Toronto to Montreal private transfer with direct driver booking",
    intro:
      "Book a private long-distance ride between Toronto and Montreal with locked distance-based pricing, return-trip discount support, and direct driver communication.",
    highlights: [
      "Instant fare up to 1000 km using the configured distance slabs",
      "10% return-trip discount when the one-way distance is above 50 km",
      "Manual admin help for complex stops, unusual timing, or rides above 1000 km"
    ],
    seoTitle: "Toronto to Montreal private transfer | Transfer Pro",
    seoDescription:
      "Book a direct private transfer from Toronto to Montreal with Transfer Pro, locked pricing, WhatsApp updates, and optional return trip."
  },
  {
    slug: "toronto-montreal-city-rides",
    headline: "Private city rides within Toronto and Montreal",
    intro:
      "Use Transfer Pro for local airport pickups, hotel transfers, appointments, family rides, and repeat customer trips within Toronto, Montreal, and nearby suburbs.",
    highlights: [
      "Guest booking without mandatory account signup",
      "Flight number, meet-and-greet, child seat, and luggage notes",
      "Pay by card, cash, bank transfer, pay later, or invoice if approved"
    ],
    seoTitle: "Toronto and Montreal private city rides | Transfer Pro",
    seoDescription:
      "Book private rides within Toronto and Montreal with direct driver contact, airport pickup support, and repeat booking."
  },
  {
    slug: "canada-to-usa-private-transfer",
    headline: "Canada to USA private transfer requests",
    intro:
      "Cross-border rides are handled through admin review so timing, border waits, luggage, return plans, and payment terms are clear before the driver commits.",
    highlights: [
      "Manual quote review for cross-border timing and waiting rules",
      "Direct admin contact for rides above 1000 km",
      "Invoice and bank-transfer options for trusted repeat customers"
    ],
    seoTitle: "Canada to USA private transfer | Transfer Pro",
    seoDescription:
      "Request a Canada to USA private transfer with Transfer Pro for cross-border planning, direct driver contact, and manual quote review."
  }
];

export const workflowSteps = [
  {
    title: "Customer books as a guest",
    copy:
      "The customer chooses pickup, drop-off, date, time, luggage, child seats, flight number, and payment preference without being forced into an account."
  },
  {
    title: "Fare locks before checkout",
    copy:
      "The price is signed for checkout, urgent service is detected from pickup time, and rides above 1000 km move to admin review."
  },
  {
    title: "Driver confirms or assigns backup",
    copy:
      "The dashboard shows today, tomorrow, unpaid rides, and quote requests with one-tap status changes and backup-driver assignment."
  },
  {
    title: "Payment and updates stay simple",
    copy:
      "Stripe is used for prepaid bookings, while trusted customers can use pay later, cash, bank transfer, or invoice with manual paid marking."
  }
] as const;
