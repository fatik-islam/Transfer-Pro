import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { getFleet, getRouteCatalog } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

function routeVehiclePrice(
  routePrice: number | undefined,
  vehiclePrice: number,
  exactPrice?: number
) {
  if (typeof exactPrice === "number") {
    return exactPrice;
  }

  if (!routePrice) {
    return null;
  }

  return routePrice + Math.max(vehiclePrice - 88, 0);
}

export default async function DashboardRoutesPage() {
  const session = await requireSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [routes, vehicles] = await Promise.all([getRouteCatalog(), getFleet()]);

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Route control</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Manage fixed corridors, quote routes, and pricing logic.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate">
          Route control is where ops decides if a journey gets instant pricing or goes to quote review. Deposit rules, markup, and allowed vehicles sit on this layer.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] bg-white shadow-quiet">
        <div className="space-y-4 p-4 lg:hidden">
          {routes.map((route) => (
            <article key={route.id} className="rounded-[1.6rem] border border-slate/10 bg-[#fcfbf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">{route.mode}</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">
                {route.origin} to {route.destination}
              </h2>
              <p className="mt-2 text-sm text-slate">
                {route.distance} · {route.duration}
              </p>
              <div className="mt-4 space-y-2 rounded-[1.2rem] bg-white p-4 shadow-sm">
                {vehicles.map((vehicle) => (
                  <div key={`${route.id}-${vehicle.id}-mobile`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate">{vehicle.name}</span>
                    <span className="font-semibold text-ink">
                      {route.mode === "FIXED" && route.fromPrice
                        ? formatCurrency(
                            routeVehiclePrice(
                              route.fromPrice,
                              vehicle.priceFrom,
                              route.pricingByVehicle?.[vehicle.slug]
                            ) ?? route.fromPrice
                          )
                        : "Quote"}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate/10 text-xs uppercase tracking-[0.2em] text-slate">
              <tr>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Mode</th>
                {vehicles.map((vehicle) => (
                  <th key={vehicle.id} className="px-6 py-4">
                    {vehicle.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b border-slate/6 last:border-b-0">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-ink">
                      {route.origin} to {route.destination}
                    </p>
                    <p className="mt-1 text-slate">
                      {route.distance} · {route.duration}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-slate">{route.mode}</td>
                  {vehicles.map((vehicle) => (
                    <td key={`${route.id}-${vehicle.id}`} className="px-6 py-5 text-slate">
                      {route.mode === "FIXED" && route.fromPrice
                        ? formatCurrency(
                            routeVehiclePrice(
                              route.fromPrice,
                              vehicle.priceFrom,
                              route.pricingByVehicle?.[vehicle.slug]
                            ) ?? route.fromPrice
                          )
                        : "Quote"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
