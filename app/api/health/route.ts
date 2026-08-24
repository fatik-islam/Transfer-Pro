import { NextResponse } from "next/server";

import { createInsForgeServerClient, unwrapInsForgeResult } from "@/lib/insforge";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const insforge = createInsForgeServerClient();
    await unwrapInsForgeResult(
      insforge.database.from("Route").select("id").eq("active", true).limit(1),
      "Health database check"
    );

    return NextResponse.json(
      {
        status: "healthy",
        database: "reachable",
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString()
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unreachable",
        timestamp: new Date().toISOString()
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
