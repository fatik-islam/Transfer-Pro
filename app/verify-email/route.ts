import { NextResponse } from "next/server";

import {
  buildSessionCookieOptions,
  createSessionToken,
  getSession,
  sessionCookieName,
  verifyEmailWithToken
} from "@/lib/auth";

function redirectToSignIn(request: Request, notice: string) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("notice", notice);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirectToSignIn(request, "verify-invalid");
  }

  try {
    const verified = await verifyEmailWithToken(token);
    const currentSession = await getSession();
    const sameAccount = currentSession?.id === verified.user.id;
    const redirectUrl = new URL(
      sameAccount ? "/dashboard/settings" : "/sign-in",
      request.url
    );

    redirectUrl.searchParams.set(
      "notice",
      verified.purpose === "EMAIL_CHANGE" ? "email-change-verified" : "email-verified"
    );

    const response = NextResponse.redirect(redirectUrl);

    if (sameAccount) {
      response.cookies.set(
        sessionCookieName,
        await createSessionToken(verified.user),
        buildSessionCookieOptions()
      );
    }

    return response;
  } catch {
    return redirectToSignIn(request, "verify-invalid");
  }
}
