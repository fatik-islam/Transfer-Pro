import { SectionHeading } from "@/components/marketing/section-heading";
import { buildMetadata } from "@/lib/seo";
import { getFleet } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Fleet",
  description: "Vehicle page for the real Transfer Pro private car and any future backup vehicles.",
  path: "/fleet"
});

export default async function FleetPage() {
  const vehicles = await getFleet();

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <SectionHeading
        eyebrow="Vehicle"
        title={vehicles.length > 1 ? "Available Transfer Pro vehicles." : "The car customers will actually ride in."}
        body={vehicles.length > 1 ? "Only active vehicles are shown publicly." : "No fake fleet: the public site shows the real active vehicle, with backup vehicles kept internal until they are available."}
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="rounded-[2rem] bg-white p-6 shadow-quiet">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">{vehicle.classLabel}</p>
                <h2 className="mt-4 text-3xl font-semibold text-ink">{vehicle.name}</h2>
              </div>
              <p className="text-sm text-slate">From {formatCurrency(vehicle.priceFrom)}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate">{vehicle.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate">
              <span>{vehicle.seats} seats</span>
              <span>{vehicle.luggage} bags</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate">
              {vehicle.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-copper" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
