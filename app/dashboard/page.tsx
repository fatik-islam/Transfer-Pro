import Link from "next/link";

import { BookingsTable } from "@/components/dashboard/bookings-table";
import { QuotesTable } from "@/components/dashboard/quotes-table";
import { SummaryStrip } from "@/components/dashboard/summary-strip";
import { requireSession } from "@/lib/auth";
import { getBookingsForRole, getDashboardSummary, getDrivers, getQuotesForRole } from "@/lib/repository";

export default async function DashboardHomePage() {
  const session = await requireSession();
  const [bookings, quotes, summary, drivers] = await Promise.all([
    getBookingsForRole(session),
    getQuotesForRole(session),
    getDashboardSummary(session),
    getDrivers()
  ]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const tomorrowKey = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const todayRides = bookings.filter((booking) => booking.pickupAt.slice(0, 10) === todayKey);
  const tomorrowRides = bookings.filter((booking) => booking.pickupAt.slice(0, 10) === tomorrowKey);
  const unpaidRides = bookings.filter((booking) => booking.paymentStatus !== "PAID");
  const favoriteAddresses = Array.from(
    new Set(bookings.flatMap((booking) => [booking.origin, booking.destination]))
  ).slice(0, 6);

  return (
    <>
      <section className="page-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Overview</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Today, tomorrow, unpaid rides, and quote requests.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate">
          Built for a solo driver first: fast customer messaging, one-tap status updates, backup-driver assignment when needed, and manual payment handling for regular customers.
        </p>
      </section>

      <SummaryStrip items={summary} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Today", todayRides.length],
          ["Tomorrow", tomorrowRides.length],
          ["Unpaid", unpaidRides.length],
          ["Quote requests", quotes.filter((quote) => quote.status === "PENDING").length]
        ].map(([label, value]) => (
          <div key={label} className="page-card-subtle rounded-[1.5rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      {session.role === "CUSTOMER" && favoriteAddresses.length ? (
        <section className="page-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Saved addresses</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {favoriteAddresses.map((address) => (
              <span key={address} className="glass-panel rounded-full px-4 py-2 text-sm text-slate">
                {address}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Calendar view</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[todayKey, tomorrowKey].map((day) => (
            <div key={day} className="page-card-subtle rounded-[1.4rem] p-4">
              <p className="font-semibold text-ink">{day}</p>
              <div className="mt-3 space-y-2 text-sm text-slate">
                {bookings.filter((booking) => booking.pickupAt.slice(0, 10) === day).map((booking) => (
                  <p key={booking.id}>{booking.reference}: {booking.origin} to {booking.destination}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Upcoming bookings</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">Live trip board</h2>
          </div>
          <Link href="/dashboard/bookings" className="text-sm font-semibold uppercase tracking-[0.16em] text-ink underline">
            Open booking queue
          </Link>
        </div>
        <BookingsTable bookings={bookings} userRole={session.role} drivers={drivers} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Quote queue</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">Bespoke rides awaiting action</h2>
          </div>
          <Link href="/dashboard/quotes" className="text-sm font-semibold uppercase tracking-[0.16em] text-ink underline">
            Open quotes
          </Link>
        </div>
        <QuotesTable quotes={quotes} />
      </section>
    </>
  );
}
