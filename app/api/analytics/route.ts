import { NextResponse } from "next/server";
import { z } from "zod";

import { createInsForgeServerClient, isInsForgeConfigured, unwrapInsForgeResult } from "@/lib/insforge";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

const analyticsSchema = z.object({
  name: z.enum(["PAGE_VIEW", "CLS", "FCP", "INP", "LCP", "TTFB"]),
  path: z.string().startsWith("/").max(240),
  value: z.number().finite().nonnegative().optional(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional()
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit("api.analytics", { limit: 120, windowSeconds: 60 });
    const parsed = analyticsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return new NextResponse(null, { status: 204 });
    }

    if (isInsForgeConfigured()) {
      const insforge = createInsForgeServerClient();
      await unwrapInsForgeResult(
        insforge.database.from("AnalyticsEvent").insert([{
          name: parsed.data.name,
          path: parsed.data.path.split("?")[0],
          value: parsed.data.value ?? null,
          rating: parsed.data.rating ?? null
        }]),
        "Record performance metric"
      );
    }

    return new NextResponse(null, { status: 202 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new NextResponse(null, { status: 429 });
    }

    console.error("Analytics event could not be recorded", error);
    return new NextResponse(null, { status: 202 });
  }
}
