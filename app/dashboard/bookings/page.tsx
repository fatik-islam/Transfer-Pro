import { BookingsTable } from "@/components/dashboard/bookings-table";
import { requireSession } from "@/lib/auth";
import { getBookingsForRole, getDrivers } from "@/lib/repository";

export default async function DashboardBookingsPage() {
  const session = await requireSession();
  const [bookings, drivers] = await Promise.all([getBookingsForRole(session), getDrivers()]);

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Bookings</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Manage the live trip board, first-accept queue, and status flow.
        </h1>
      </div>
      <BookingsTable bookings={bookings} userRole={session.role} drivers={drivers} />
    </section>
  );
}
