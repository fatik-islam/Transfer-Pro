import { deleteDriverAction } from "@/app/actions";
import { StatusPill } from "@/components/ui/status-pill";
import type { DriverCard } from "@/lib/types";

export function DriversGrid({ drivers }: { drivers: DriverCard[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {drivers.map((driver) => (
        <article key={driver.id} className="rounded-[2rem] bg-white p-6 shadow-quiet">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">{driver.baseCity}</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{driver.name}</h3>
            </div>
            <StatusPill value={driver.status} />
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate">
            <p>Email: <span className="font-medium text-ink">{driver.email}</span></p>
            <p>Phone: <span className="font-medium text-ink">{driver.phone ?? "Not set"}</span></p>
            <p>Assigned vehicle: <span className="font-medium text-ink">{driver.assignedVehicle}</span></p>
            <p>Rating: <span className="font-medium text-ink">{driver.rating.toFixed(1)}</span></p>
            <p>Jobs today: <span className="font-medium text-ink">{driver.jobsToday}</span></p>
          </div>
          <form action={deleteDriverAction} className="mt-6">
            <input type="hidden" name="driverProfileId" value={driver.id} />
            <button className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
              Remove driver
            </button>
          </form>
        </article>
      ))}
    </section>
  );
}
