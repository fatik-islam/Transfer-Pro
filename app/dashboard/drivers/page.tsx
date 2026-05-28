import { redirect } from "next/navigation";

import { DriverCreateForm } from "@/components/dashboard/driver-create-form";
import { DriversGrid } from "@/components/dashboard/drivers-grid";
import { requireSession } from "@/lib/auth";
import { getDrivers } from "@/lib/repository";

export default async function DashboardDriversPage() {
  const session = await requireSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const drivers = await getDrivers();

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Drivers</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Add drivers, remove drivers, and keep dispatch reachable.
        </h1>
      </div>
      <DriverCreateForm />
      <DriversGrid drivers={drivers} />
    </section>
  );
}
