import { NextResponse } from "next/server";

import { createGoogleAuthorizationRequest, isGoogleAuthConfigured } from "@/lib/auth";

const GOOGLE_STATE_COOKIE = "transpro_google_state";
const GOOGLE_VERIFIER_COOKIE = "transpro_google_verifier";

function buildEphemeralCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  };
}

export async function GET(request: Request) {
  const signInUrl = new URL("/sign-in", request.url);

  if (!isGoogleAuthConfigured()) {
    signInUrl.searchParams.set("notice", "google-config");
    return NextResponse.redirect(signInUrl);
  }

  try {
    const authRequest = createGoogleAuthorizationRequest();
    const response = NextResponse.redirect(authRequest.authorizationUrl);

    response.cookies.set(GOOGLE_STATE_COOKIE, authRequest.state, buildEphemeralCookieOptions());
    response.cookies.set(
      GOOGLE_VERIFIER_COOKIE,
      authRequest.codeVerifier,
      buildEphemeralCookieOptions()
    );

    return response;
  } catch {
    signInUrl.searchParams.set("notice", "google-failed");
    return NextResponse.redirect(signInUrl);
  }
}
