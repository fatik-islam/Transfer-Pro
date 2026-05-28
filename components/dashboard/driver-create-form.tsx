"use client";

import { useActionState } from "react";

import { createDriverAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneField } from "@/components/ui/phone-field";
import { initialActionState } from "@/lib/action-state";

export function DriverCreateForm() {
  const [state, formAction, pending] = useActionState(createDriverAction, initialActionState);

  return (
    <form action={formAction} className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Add driver</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Create a driver login and dispatch profile.</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Name</span>
          <Input name="name" required />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Email</span>
          <Input type="email" name="email" required />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Mobile number</span>
          <PhoneField required className="grid-cols-1 sm:grid-cols-1" />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Base city</span>
          <Input name="baseCity" required />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Temporary password</span>
          <PasswordInput name="password" required />
        </label>
      </div>

      {state.message ? (
        <p
          className={`mt-4 rounded-3xl px-4 py-3 text-sm ${
            state.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding driver..." : "Add driver"}
        </Button>
      </div>
    </form>
  );
}
