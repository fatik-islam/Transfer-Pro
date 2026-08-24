import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createBooking } from "@/lib/repository";
import { bookingSchema } from "@/lib/validation";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await enforceRateLimit("api.booking.create", { limit: 8, windowSeconds: 3600 });
    const payload = await request.json();
    const parsed = bookingSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await getSession();
    const booking = await createBooking(parsed.data, session);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }

    return NextResponse.json({ error: "Booking request could not be processed." }, { status: 400 });
  }
}
