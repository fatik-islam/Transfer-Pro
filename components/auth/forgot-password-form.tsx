"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialActionState
  );

  return (
    <form action={formAction} className="page-card space-y-5 p-6 md:p-8">
      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Email</span>
        <Input type="email" name="email" required />
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
        {pending ? "Sending reset link..." : "Send reset link"}
      </Button>

      <p className="text-sm text-slate">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-ink underline">
          Return to sign in
        </Link>
        .
      </p>
    </form>
  );
}
