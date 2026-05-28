import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createQuote } from "@/lib/repository";
import { quoteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = quoteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getSession();
  const quote = await createQuote(parsed.data, session);

  return NextResponse.json(quote, { status: 201 });
}
