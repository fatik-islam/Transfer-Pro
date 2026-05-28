import { NextResponse } from "next/server";
import { z } from "zod";

import { createCheckoutLink } from "@/lib/payments";

const checkoutSchema = z.object({
  bookingId: z.string().min(1).optional(),
  reference: z.string().min(1),
  amount: z.number().positive(),
  customerEmail: z.string().email()
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = checkoutSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const checkout = await createCheckoutLink(parsed.data);

  if (checkout.error) {
    return NextResponse.json(
      {
        error: "Stripe checkout could not be created.",
        detail: checkout.error,
        mode: "unavailable"
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    url: checkout.url,
    mode: checkout.url ? "live" : "demo"
  });
}
