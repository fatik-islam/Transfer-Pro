import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Customer, admin, and driver sign-in page for Transfer Pro.",
  path: "/sign-in"
});

function resolveNotice(notice?: string) {
  switch (notice) {
    case "signup-email-sent":
      return {
        text: "Account created. Confirm the verification email before signing in.",
        tone: "success" as const
      };
    case "email-verified":
      return { text: "Email verified. You can sign in now.", tone: "success" as const };
    case "google-config":
      return { text: "Google sign-in is not configured yet.", tone: "warning" as const };
    case "google-cancelled":
      return { text: "Google sign-in was cancelled before completion.", tone: "warning" as const };
    case "google-failed":
      return {
        text: "Google sign-in could not be completed. Try again or use email sign-in.",
        tone: "warning" as const
      };
    case "email-change-verified":
      return {
        text: "Your new email is confirmed. Sign in with that address from now on.",
        tone: "success" as const
      };
    case "verify-invalid":
      return {
        text: "That verification link is invalid or expired. Sign in to send a fresh one.",
        tone: "warning" as const
      };
    case "account-deleted":
      return {
        text: "Account closed and personal details anonymized.",
        tone: "success" as const
      };
    default:
      return undefined;
  }
}

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="page-card-dark p-6 text-cloud md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Accounts</p>
          <h1 className="mt-5 font-display text-5xl leading-none">Customer, driver, and admin views share one login system.</h1>
          <p className="mt-5 text-base leading-8 text-cloud/72">
            Use your verified email address to sign in. Google sign-in, password recovery, and saved mobile numbers are supported from the same secure account system.
          </p>
          <p className="mt-8 text-sm text-cloud/60">
            Need a new customer account?{" "}
            <Link href="/sign-up" className="font-semibold text-cloud underline">
              Create one here
            </Link>
            .
          </p>
        </div>
        <SignInForm notice={resolveNotice(notice)} />
      </div>
    </main>
  );
}
