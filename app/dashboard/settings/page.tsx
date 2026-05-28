import { AccountSettings } from "@/components/dashboard/account-settings";
import { getAccountProfile, requireSession } from "@/lib/auth";

function resolveNotice(notice?: string) {
  switch (notice) {
    case "email-change-verified":
      return "Your new email address is now active on this account.";
    default:
      return undefined;
  }
}

export default async function DashboardSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const session = await requireSession();
  const profile = await getAccountProfile(session.id);

  if (!profile) {
    throw new Error("Account profile could not be loaded.");
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Settings</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Account details, password, recovery, and deletion.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate">
          Keep the operator record current so booking notifications, invoices, and driver dispatch use the right contact details.
        </p>
      </div>

      <AccountSettings profile={profile} notice={resolveNotice(notice)} />
    </section>
  );
}
