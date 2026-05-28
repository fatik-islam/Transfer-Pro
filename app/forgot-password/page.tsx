import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Forgot password",
  description: "Request a password reset link for Transfer Pro admin, driver, or customer access.",
  path: "/forgot-password"
});

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="page-card-dark p-6 text-cloud md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Recovery</p>
          <h1 className="mt-5 font-display text-5xl leading-none">Reset access without contacting dispatch.</h1>
          <p className="mt-5 text-base leading-8 text-cloud/72">
            Admins and drivers can request a reset link directly from their account email and set a new password on the next screen.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
