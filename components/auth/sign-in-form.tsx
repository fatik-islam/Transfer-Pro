"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/app/actions";
import { GoogleAuthLink } from "@/components/auth/google-auth-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { initialActionState } from "@/lib/action-state";

export function SignInForm({
  notice
}: {
  notice?: { text: string; tone: "success" | "warning" };
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialActionState);

  return (
    <form action={formAction} className="page-card space-y-5 p-6 md:p-8">
      <div className="space-y-3">
        <GoogleAuthLink label="Continue with Google" />
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate/55">
          <span className="h-px flex-1 bg-slate/10" />
          <span>Email and password</span>
          <span className="h-px flex-1 bg-slate/10" />
        </div>
      </div>

      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Email</span>
        <Input type="email" name="email" required />
      </label>
      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Password</span>
        <PasswordInput name="password" required />
      </label>

      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-ink underline">
          Forgot password?
        </Link>
      </div>

      {notice ? (
        <p
          className={`rounded-3xl px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "bg-emerald-500/10 text-emerald-800"
              : "bg-amber-500/10 text-amber-800"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-3xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in..." : "Sign in"}
      </Button>

    </form>
  );
}
