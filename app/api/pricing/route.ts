import { NextResponse } from "next/server";
import { z } from "zod";

import { findFixedPrice } from "@/lib/repository";
import { signPricingOffer } from "@/lib/offers";
import { getTransferPricing } from "@/lib/pricing";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

const pricingRequestSchema = z.object({
  pickupCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  destinationCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  pickupCountryCode: z.string().optional(),
  destinationCountryCode: z.string().optional(),
  returnTrip: z.boolean().optional(),
  pickupAt: z.string().datetime()
});

export async function GET(request: Request) {
  try {
    await enforceRateLimit("api.pricing.read", { limit: 40, windowSeconds: 900 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const routeSlug = searchParams.get("route");
  const vehicleSlug = searchParams.get("vehicle");

  if (!routeSlug || !vehicleSlug) {
    return NextResponse.json(
      { error: "Missing route or vehicle query parameter." },
      { status: 400 }
    );
  }

  const result = await findFixedPrice(routeSlug, vehicleSlug);

  if (!result) {
    return NextResponse.json({ error: "No fixed price found." }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit("api.pricing.lock", { limit: 20, windowSeconds: 900 });
    const payload = await request.json();
    const parsed = pricingRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await getTransferPricing(parsed.data);
    const lockedOffer = await signPricingOffer(parsed.data, result);
    return NextResponse.json(lockedOffer);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }

    return NextResponse.json({ error: "Fare could not be calculated." }, { status: 400 });
  }
}
