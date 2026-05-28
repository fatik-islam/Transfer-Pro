import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { getFleet } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardFleetPage() {
  const session = await requireSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const vehicles = await getFleet();

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Fleet</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Vehicle inventory, positioning, and minimum pricing.
        </h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="rounded-[2rem] bg-white p-6 shadow-quiet">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">{vehicle.classLabel}</p>
            <h2 className="mt-4 text-2xl font-semibold text-ink md:text-3xl">{vehicle.name}</h2>
            <p className="mt-4 text-sm leading-7 text-slate">{vehicle.summary}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate">
              <span>{vehicle.seats} seats</span>
              <span>{vehicle.luggage} bags</span>
              <span>Base from {formatCurrency(vehicle.priceFrom)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
