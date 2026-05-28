import { NextResponse } from "next/server";
import { z } from "zod";

import { findFixedPrice } from "@/lib/repository";
import { signPricingOffer } from "@/lib/offers";
import { getTransferPricing } from "@/lib/pricing";

const pricingRequestSchema = z.object({
  pickupCoordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  destinationCoordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  pickupCountryCode: z.string().optional(),
  destinationCountryCode: z.string().optional(),
  returnTrip: z.boolean().optional(),
  pickupAt: z.string().datetime()
});

export async function GET(request: Request) {
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
  const payload = await request.json();
  const parsed = pricingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getTransferPricing(parsed.data);
  const lockedOffer = await signPricingOffer(parsed.data, result);
  return NextResponse.json(lockedOffer);
}
