"use client";

import { useActionState } from "react";

import { signUpAction } from "@/app/actions";
import { GoogleAuthLink } from "@/components/auth/google-auth-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneField } from "@/components/ui/phone-field";
import { initialActionState } from "@/lib/action-state";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialActionState);

  return (
    <form action={formAction} className="page-card space-y-5 p-6 md:p-8">
      <div className="space-y-3">
        <GoogleAuthLink label="Continue with Google" />
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate/55">
          <span className="h-px flex-1 bg-slate/10" />
          <span>Or create with email</span>
          <span className="h-px flex-1 bg-slate/10" />
        </div>
      </div>

      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Full name</span>
        <Input name="name" required />
      </label>
      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Email</span>
        <Input type="email" name="email" required />
      </label>
      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Mobile number</span>
        <PhoneField required />
      </label>
      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Password</span>
        <PasswordInput name="password" required />
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
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
