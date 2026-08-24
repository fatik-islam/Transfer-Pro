import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createInsForgeServerClient, unwrapInsForgeResult } from "@/lib/insforge";
import { retryPendingNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!expected || !provided) return false;

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const notifications = await retryPendingNotifications();
  const insforge = createInsForgeServerClient();
  const rateLimitCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const eventCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  await Promise.all([
    unwrapInsForgeResult(
      insforge.database.from("RateLimitEvent").delete().lt("createdAt", rateLimitCutoff),
      "Clean rate-limit events"
    ),
    unwrapInsForgeResult(
      insforge.database.from("PaymentEvent").delete().lt("createdAt", eventCutoff),
      "Clean payment webhook events"
    )
  ]);

  return NextResponse.json({ ok: true, notifications });
}
