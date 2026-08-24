import { NextResponse } from "next/server";
import { z } from "zod";

import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

export async function GET(request: Request) {
  try {
    await enforceRateLimit("api.locations.reverse", { limit: 30, windowSeconds: 60 });
    const params = new URL(request.url).searchParams;
    const coordinates = coordinatesSchema.parse({ lat: params.get("lat"), lng: params.get("lng") });
    const search = new URLSearchParams({
      format: "jsonv2",
      lat: String(coordinates.lat),
      lon: String(coordinates.lng)
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${search.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TransferPro/1.0 (https://transferpro.ca)"
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error("Location provider unavailable");
    }

    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
    }

    return NextResponse.json({ error: "Location lookup is temporarily unavailable." }, { status: 503 });
  }
}
