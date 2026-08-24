"use client";

import { useActionState } from "react";

import {
  changePasswordAction,
  deleteOwnAccountAction,
  updateProfileAction
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneField } from "@/components/ui/phone-field";
import { initialActionState } from "@/lib/action-state";
import { splitPhoneForField } from "@/lib/phone";
import type { AccountProfile } from "@/lib/types";

export function AccountSettings({
  profile,
  notice
}: {
  profile: AccountProfile;
  notice?: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialActionState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initialActionState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteOwnAccountAction,
    initialActionState
  );
  const canDeleteAccount = profile.role === "CUSTOMER" || profile.role === "DRIVER";
  const phoneField = splitPhoneForField(profile.phone, profile.phoneCountryIso);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form action={profileAction} className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Profile</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink md:text-3xl">
            Update contact details used across dispatch and invoices.
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate">
              <span className="font-medium text-ink">Name</span>
              <Input name="name" defaultValue={profile.name} required />
            </label>
            <label className="space-y-2 text-sm text-slate">
              <span className="font-medium text-ink">Email</span>
              <Input type="email" name="email" defaultValue={profile.email} required />
            </label>
            <label className="space-y-2 text-sm text-slate md:col-span-2">
              <span className="font-medium text-ink">Mobile number</span>
              <PhoneField
                required
                defaultCountryIso={phoneField.countryIso}
                defaultNationalNumber={phoneField.nationalNumber}
              />
            </label>
          </div>

          {profile.pendingEmail ? (
            <p className="mt-4 rounded-3xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
              Verification pending for {profile.pendingEmail}. Your current sign-in email stays{" "}
              {profile.email} until that inbox confirms the change.
            </p>
          ) : null}

          {notice ? (
            <p className={`mt-4 rounded-3xl px-4 py-3 text-sm ${profile.mustChangePassword ? "bg-amber-500/10 text-amber-800" : "bg-emerald-500/10 text-emerald-800"}`}>
              {notice}
            </p>
          ) : null}

          {profileState.message ? (
            <p
              className={`mt-4 rounded-3xl px-4 py-3 text-sm ${
                profileState.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-800"
              }`}
            >
              {profileState.message}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>

        <form action={passwordAction} className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Password</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink md:text-3xl">Change password.</h2>
          <p className="mt-3 text-sm leading-7 text-slate">
            Use at least 10 characters with uppercase, lowercase, and a number. If you lose access, use the reset link on the sign-in page.
          </p>

          <div className="mt-6 space-y-4">
            <label className="space-y-2 text-sm text-slate">
              <span className="font-medium text-ink">Current password</span>
              <PasswordInput name="currentPassword" required />
            </label>
            <label className="space-y-2 text-sm text-slate">
              <span className="font-medium text-ink">New password</span>
              <PasswordInput name="newPassword" required />
            </label>
            <label className="space-y-2 text-sm text-slate">
              <span className="font-medium text-ink">Confirm new password</span>
              <PasswordInput name="confirmPassword" required />
            </label>
          </div>

          {passwordState.message ? (
            <p
              className={`mt-4 rounded-3xl px-4 py-3 text-sm ${
                passwordState.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-800"
              }`}
            >
              {passwordState.message}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </div>

      {canDeleteAccount ? (
        <form
          action={deleteAction}
          className="rounded-[2rem] border border-rose-200 bg-rose-50/70 p-6 shadow-quiet md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">
            Delete account
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink md:text-3xl">
            Close and anonymize this {profile.role === "DRIVER" ? "driver" : "customer"} account.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
            Personal contact and sign-in details are permanently anonymized. Completed bookings,
            receipts, quotes, and financial audit records are retained for operational and legal
            history. Active rides or open quotes must be resolved first.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate">
            If you only use Google sign-in, set a password first with the password reset link, then
            return here to confirm deletion.
          </p>

          <div className="mt-6 max-w-xl">
            <label className="space-y-2 text-sm text-slate">
              <span className="font-medium text-ink">Confirm with current password</span>
              <PasswordInput name="password" required />
            </label>
          </div>

          {deleteState.message ? (
            <p
              className={`mt-4 rounded-3xl px-4 py-3 text-sm ${
                deleteState.ok ? "bg-emerald-500/10 text-emerald-800" : "bg-amber-500/10 text-amber-800"
              }`}
            >
              {deleteState.message}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              disabled={deletePending}
              className="bg-rose-600 text-white hover:bg-rose-700 hover:shadow-quiet"
            >
              {deletePending ? "Closing account..." : "Close and anonymize account"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
