import { NextResponse, type NextRequest } from "next/server";

import { productionAppUrl } from "@/lib/app-config";

const secondaryHosts = new Set([
  "626s5mcn.insforge.site",
  "transferpro.insforge.site",
  "www.transferpro.ca"
]);

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (process.env.NODE_ENV === "production" && secondaryHosts.has(hostname)) {
    const canonical = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, productionAppUrl);
    return NextResponse.redirect(canonical, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*"
};
