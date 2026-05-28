import { redirect } from "next/navigation";

import { QuotesTable } from "@/components/dashboard/quotes-table";
import { requireSession } from "@/lib/auth";
import { getQuotesForRole } from "@/lib/repository";

export default async function DashboardQuotesPage() {
  const session = await requireSession();

  if (session.role === "DRIVER") {
    redirect("/dashboard");
  }

  const quotes = await getQuotesForRole(session);

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Quotes</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Review bespoke ride requests and send offers.
        </h1>
      </div>
      <QuotesTable quotes={quotes} />
    </section>
  );
}
