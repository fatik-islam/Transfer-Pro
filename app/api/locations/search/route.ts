import { NextResponse } from "next/server";
import { z } from "zod";

import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

const querySchema = z.string().trim().min(3).max(160);

export async function GET(request: Request) {
  try {
    await enforceRateLimit("api.locations.search", { limit: 45, windowSeconds: 60 });
    const query = querySchema.parse(new URL(request.url).searchParams.get("q"));
    const search = new URLSearchParams({
      format: "jsonv2",
      q: query,
      limit: "5",
      addressdetails: "1"
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${search.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TransferPro/1.0 (https://transferpro.ca)"
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error("Location provider unavailable");
    }

    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter at least three characters." }, { status: 400 });
    }

    return NextResponse.json({ error: "Location search is temporarily unavailable." }, { status: 503 });
  }
}
