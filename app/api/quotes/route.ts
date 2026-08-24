import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createQuote } from "@/lib/repository";
import { quoteSchema } from "@/lib/validation";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await enforceRateLimit("api.quote.create", { limit: 6, windowSeconds: 3600 });
    const payload = await request.json();
    const parsed = quoteSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await getSession();
    const quote = await createQuote(parsed.data, session);

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }

    return NextResponse.json({ error: "Quote request could not be processed." }, { status: 400 });
  }
}
