import bcrypt from "bcryptjs";
import { PrismaClient, RouteMode, UserRole, VehicleClass } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@transferpro.test" },
    update: {},
    create: {
      email: "admin@transferpro.test",
      name: "Mara Holden",
      role: UserRole.ADMIN,
      phone: "+971 50 900 2201",
      passwordHash
    }
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "driver@transferpro.test" },
    update: {},
    create: {
      email: "driver@transferpro.test",
      name: "Yousef Kareem",
      role: UserRole.DRIVER,
      phone: "+971 50 900 2202",
      passwordHash
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@transferpro.test" },
    update: {},
    create: {
      email: "customer@transferpro.test",
      name: "Lena Hart",
      role: UserRole.CUSTOMER,
      phone: "+44 20 7946 0991",
      passwordHash
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      companyName: "Harborline Studios",
      preferredChannel: "WHATSAPP",
      billingAddress: "57 Quayside Road, London"
    }
  });

  const driver = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      baseCity: "Dubai",
      licenseNumber: "DXB-44392",
      bio: "Airport specialist for premium arrivals and event moves."
    }
  });

  const sedan = await prisma.vehicle.upsert({
    where: { slug: "signature-sedan" },
    update: {},
    create: {
      slug: "signature-sedan",
      name: "Backup Sedan",
      vehicleClass: VehicleClass.EXECUTIVE_SEDAN,
      seats: 3,
      luggage: 2,
      basePriceCents: 8800,
      summary: "Quiet executive cabin for airport and city work.",
      features: ["Meet-and-greet", "Phone chargers", "Bottled water"],
      driverId: driver.id
    }
  });

  const suv = await prisma.vehicle.upsert({
    where: { slug: "harbor-suv" },
    update: {},
    create: {
      slug: "harbor-suv",
      name: "Transfer Pro SUV",
      vehicleClass: VehicleClass.BUSINESS_SUV,
      seats: 5,
      luggage: 4,
      basePriceCents: 12400,
      summary: "Extra luggage room for families and executive teams.",
      features: ["Child seat on request", "Flight monitoring", "Wi-Fi hotspot"]
    }
  });

  const van = await prisma.vehicle.upsert({
    where: { slug: "pier-van" },
    update: {},
    create: {
      slug: "pier-van",
      name: "Executive Van",
      vehicleClass: VehicleClass.VIP_VAN,
      seats: 7,
      luggage: 8,
      basePriceCents: 17800,
      summary: "VIP van for delegations, events, and larger family moves.",
      features: ["Wide luggage bay", "Conference seating", "Onboard refreshments"]
    }
  });

  const fixedRoute = await prisma.route.upsert({
    where: { slug: "airport-to-marina" },
    update: {},
    create: {
      slug: "airport-to-marina",
      origin: "Dubai International Airport",
      destination: "Dubai Marina",
      distanceKm: 35,
      durationMin: 32,
      mode: RouteMode.FIXED,
      summary: "High-frequency airport corridor with instant confirmation.",
      seoTitle: "Dubai Airport to Marina private transfer",
      seoDescription: "Fixed-price private airport transfer with live driver assignment."
    }
  });

  await prisma.route.upsert({
    where: { slug: "marina-to-abu-dhabi-corniche" },
    update: {},
    create: {
      slug: "marina-to-abu-dhabi-corniche",
      origin: "Dubai Marina",
      destination: "Abu Dhabi Corniche",
      distanceKm: 145,
      durationMin: 95,
      mode: RouteMode.QUOTE,
      summary: "Long-distance premium transfer with concierge quoting."
    }
  });

  await prisma.routePrice.upsert({
    where: {
      routeId_vehicleId: {
        routeId: fixedRoute.id,
        vehicleId: sedan.id
      }
    },
    update: {},
    create: {
      routeId: fixedRoute.id,
      vehicleId: sedan.id,
      oneWayCents: 12600,
      returnCents: 23800,
      depositCents: 3000
    }
  });

  await prisma.routePrice.upsert({
    where: {
      routeId_vehicleId: {
        routeId: fixedRoute.id,
        vehicleId: suv.id
      }
    },
    update: {},
    create: {
      routeId: fixedRoute.id,
      vehicleId: suv.id,
      oneWayCents: 16400,
      returnCents: 30800,
      depositCents: 4500
    }
  });

  await prisma.routePrice.upsert({
    where: {
      routeId_vehicleId: {
        routeId: fixedRoute.id,
        vehicleId: van.id
      }
    },
    update: {},
    create: {
      routeId: fixedRoute.id,
      vehicleId: van.id,
      oneWayCents: 22600,
      returnCents: 42800,
      depositCents: 6000
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
