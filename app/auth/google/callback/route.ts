import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildSessionCookieOptions,
  createSessionToken,
  sessionCookieName,
  signInWithGoogleCode
} from "@/lib/auth";

const GOOGLE_STATE_COOKIE = "transpro_google_state";
const GOOGLE_VERIFIER_COOKIE = "transpro_google_verifier";

function buildExpiredCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

function redirectToSignIn(request: Request, notice: string) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("notice", notice);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE, "", buildExpiredCookieOptions());
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, "", buildExpiredCookieOptions());
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const store = await cookies();
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value;
  const codeVerifier = store.get(GOOGLE_VERIFIER_COOKIE)?.value;

  if (error === "access_denied") {
    return redirectToSignIn(request, "google-cancelled");
  }

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    return redirectToSignIn(request, "google-failed");
  }

  try {
    const user = await signInWithGoogleCode(code, codeVerifier);
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    response.cookies.set(sessionCookieName, await createSessionToken(user), buildSessionCookieOptions());
    response.cookies.set(GOOGLE_STATE_COOKIE, "", buildExpiredCookieOptions());
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, "", buildExpiredCookieOptions());

    return response;
  } catch {
    return redirectToSignIn(request, "google-failed");
  }
}
