import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Reset password",
  description: "Set a new Transfer Pro password from a recovery link.",
  path: "/reset-password"
});

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="page-card-dark p-6 text-cloud md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Recovery</p>
          <h1 className="mt-5 font-display text-5xl leading-none">Set a new password.</h1>
          <p className="mt-5 text-base leading-8 text-cloud/72">
            Use the recovery link from your email. Each link is single-use and expires automatically.
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <section className="page-card p-6 md:p-8">
            <p className="text-sm text-slate">
              This reset link is missing a token. Request a new one from the{" "}
              <Link href="/forgot-password" className="font-semibold text-ink underline">
                forgot-password page
              </Link>
              .
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
