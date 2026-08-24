import type { LocationCoordinates, TransferPricingQuote } from "@/lib/types";

type TransferPricingInput = {
  pickupCoordinates: LocationCoordinates;
  destinationCoordinates: LocationCoordinates;
  pickupCountryCode?: string | null;
  destinationCountryCode?: string | null;
  returnTrip?: boolean;
  pickupAt?: string | Date | null;
};

type DistanceResult = {
  distanceKm: number;
  distanceSource: TransferPricingQuote["distanceSource"];
};

const PRICING_CURRENCY = "CAD";
const URGENT_WINDOW_MINUTES = 35;

function haversineDistanceKm(origin: LocationCoordinates, destination: LocationCoordinates) {
  const earthRadiusKm = 6371;
  const latDelta = ((destination.lat - origin.lat) * Math.PI) / 180;
  const lngDelta = ((destination.lng - origin.lng) * Math.PI) / 180;
  const originLat = (origin.lat * Math.PI) / 180;
  const destinationLat = (destination.lat * Math.PI) / 180;

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * arc;
}

async function resolveDistance(input: TransferPricingInput): Promise<DistanceResult> {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (googleMapsApiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleMapsApiKey,
          "X-Goog-FieldMask": "routes.distanceMeters"
        },
        body: JSON.stringify({
          origin: { location: { latLng: input.pickupCoordinates } },
          destination: { location: { latLng: input.destinationCoordinates } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          units: "METRIC"
        }),
        signal: controller.signal,
        cache: "no-store"
      });

      if (response.ok) {
        const payload = (await response.json()) as { routes?: Array<{ distanceMeters?: number }> };
        const distanceMeters = payload.routes?.[0]?.distanceMeters;

        if (distanceMeters && Number.isFinite(distanceMeters)) {
          return {
            distanceKm: Number((distanceMeters / 1000).toFixed(1)),
            distanceSource: "routing"
          };
        }
      }
    } catch {
      // Fall through to the secondary road-routing provider.
    } finally {
      clearTimeout(timeout);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${input.pickupCoordinates.lng},${input.pickupCoordinates.lat};${input.destinationCoordinates.lng},${input.destinationCoordinates.lat}?overview=false`,
      {
        signal: controller.signal,
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      throw new Error("Routing request failed");
    }

    const payload = (await response.json()) as {
      routes?: Array<{ distance?: number }>;
    };
    const routeDistanceMeters = payload.routes?.[0]?.distance;

    if (!routeDistanceMeters || Number.isNaN(routeDistanceMeters)) {
      throw new Error("Routing distance missing");
    }

    return {
      distanceKm: Number((routeDistanceMeters / 1000).toFixed(1)),
      distanceSource: "routing"
    };
  } catch {
    return {
      distanceKm: Number((haversineDistanceKm(input.pickupCoordinates, input.destinationCoordinates) * 1.2).toFixed(1)),
      distanceSource: "estimated"
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isUsRide(input: TransferPricingInput) {
  return (
    input.pickupCountryCode?.toLowerCase() === "us" &&
    input.destinationCountryCode?.toLowerCase() === "us"
  );
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function isUrgentPickup(pickupAt?: string | Date | null) {
  if (!pickupAt) {
    return false;
  }

  const pickupDate = pickupAt instanceof Date ? pickupAt : new Date(pickupAt);

  if (Number.isNaN(pickupDate.getTime())) {
    return false;
  }

  const minutesUntilPickup = (pickupDate.getTime() - Date.now()) / 60000;
  return minutesUntilPickup >= 0 && minutesUntilPickup < URGENT_WINDOW_MINUTES;
}

function normalizePickupAt(pickupAt?: string | Date | null) {
  if (!pickupAt) {
    return undefined;
  }

  const pickupDate = pickupAt instanceof Date ? pickupAt : new Date(pickupAt);
  return Number.isNaN(pickupDate.getTime()) ? undefined : pickupDate.toISOString();
}

export function parseCoordinatesString(value?: string | null) {
  if (!value) {
    return null;
  }

  const [latValue, lngValue] = value.split(",");
  const lat = Number(latValue);
  const lng = Number(lngValue);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng } satisfies LocationCoordinates;
}

export async function getTransferPricing(
  input: TransferPricingInput
): Promise<TransferPricingQuote> {
  const { distanceKm, distanceSource } = await resolveDistance(input);
  const returnTrip = Boolean(input.returnTrip);
  const urgentService = isUrgentPickup(input.pickupAt);
  const usaRide = isUsRide(input);
  const pickupAt = normalizePickupAt(input.pickupAt);

  if (distanceSource === "estimated") {
    return {
      pricingMode: "CONTACT",
      currency: PRICING_CURRENCY,
      distanceKm,
      distanceSource,
      region: usaRide ? "USA" : "GENERAL",
      tierLabel: "Route review",
      ratePerKm: null,
      pickupFee: 0,
      oneWaySubtotal: null,
      roundTrip: returnTrip,
      roundTripDiscount: 0,
      urgentService,
      urgentSurcharge: 0,
      total: null,
      pickupAt,
      contactReason: "Live road routing is temporarily unavailable, so this trip needs manual fare confirmation."
    };
  }

  if (distanceKm > 1000) {
    return {
      pricingMode: "CONTACT",
      currency: PRICING_CURRENCY,
      distanceKm,
      distanceSource,
      region: usaRide ? "USA" : "GENERAL",
      tierLabel: "> 1000 km",
      ratePerKm: null,
      pickupFee: 0,
      oneWaySubtotal: null,
      roundTrip: returnTrip,
      roundTripDiscount: 0,
      urgentService,
      urgentSurcharge: 0,
      total: null,
      pickupAt,
      contactReason: "Rides above 1000 km need direct admin assistance before confirmation."
    };
  }

  const tier =
    distanceKm <= 250
      ? { tierLabel: "0-250 km", ratePerKm: 1.3, pickupFee: 8 }
      : distanceKm <= 600
        ? { tierLabel: "251-600 km", ratePerKm: 1.8, pickupFee: 0 }
        : distanceKm <= 750
          ? { tierLabel: "601-750 km", ratePerKm: 2, pickupFee: 0 }
          : { tierLabel: "751-1000 km", ratePerKm: 2.2, pickupFee: 0 };

  const oneWaySubtotal = roundMoney(distanceKm * tier.ratePerKm + tier.pickupFee);
  const tripSubtotal = roundMoney(returnTrip ? oneWaySubtotal * 2 : oneWaySubtotal);
  const roundTripDiscount =
    returnTrip && distanceKm > 50 ? roundMoney(tripSubtotal * 0.1) : 0;
  const discountedSubtotal = roundMoney(tripSubtotal - roundTripDiscount);
  const urgentSurcharge = urgentService ? roundMoney(discountedSubtotal * 0.15) : 0;
  const total = roundMoney(discountedSubtotal + urgentSurcharge);

  return {
    pricingMode: "INSTANT",
    currency: PRICING_CURRENCY,
    distanceKm,
    distanceSource,
    region: usaRide ? "USA" : "GENERAL",
    tierLabel: tier.tierLabel,
    ratePerKm: tier.ratePerKm,
    pickupFee: tier.pickupFee,
    oneWaySubtotal,
    roundTrip: returnTrip,
    roundTripDiscount,
    urgentService,
    urgentSurcharge,
    total,
    pickupAt
  };
}
