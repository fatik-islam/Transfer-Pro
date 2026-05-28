import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createBooking } from "@/lib/repository";
import { bookingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getSession();
  const booking = await createBooking(parsed.data, session);

  return NextResponse.json(booking, { status: 201 });
}
