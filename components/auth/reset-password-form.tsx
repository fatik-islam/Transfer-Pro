"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { initialActionState } from "@/lib/action-state";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialActionState);

  return (
    <form action={formAction} className="page-card space-y-5 p-6 md:p-8">
      <input type="hidden" name="token" value={token} />

      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">New password</span>
        <PasswordInput name="newPassword" required />
      </label>

      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Confirm new password</span>
        <PasswordInput name="confirmPassword" required />
      </label>

      {state.message ? (
        <p
          className={`rounded-3xl px-4 py-3 text-sm ${
            state.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Resetting password..." : "Reset password"}
      </Button>

      {state.ok ? (
        <p className="text-sm text-slate">
          Continue to{" "}
          <Link href="/sign-in" className="font-semibold text-ink underline">
            sign in
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}
