import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create account",
  description: "Customer account sign-up page for Transfer Pro bookings, receipts, and repeat rides.",
  path: "/sign-up"
});

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="page-card-dark p-6 text-cloud md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Customer accounts</p>
          <h1 className="mt-5 font-display text-5xl leading-none">Save bookings, receipts, and repeat routes under one profile.</h1>
          <p className="mt-5 text-base leading-8 text-cloud/72">
            This onboarding flow is built for direct bookings and repeat customers. Customers confirm their email before first sign-in, then can track rides and download receipts without contacting ops.
          </p>
          <p className="mt-8 text-sm text-cloud/60">
            Already registered?{" "}
            <Link href="/sign-in" className="font-semibold text-cloud underline">
              Sign in
            </Link>
            .
          </p>
        </div>
        <SignUpForm />
      </div>
    </main>
  );
}
