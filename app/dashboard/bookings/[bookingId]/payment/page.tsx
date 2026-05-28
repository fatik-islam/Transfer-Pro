import { redirect } from "next/navigation";

import { CustomerPaymentPanel } from "@/components/dashboard/customer-payment-panel";
import { requireSession } from "@/lib/auth";
import { getBookingPaymentDetails } from "@/lib/repository";

export default async function CustomerBookingPaymentPage({
  params
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const session = await requireSession();

  if (session.role !== "CUSTOMER") {
    redirect("/dashboard/bookings");
  }

  const { bookingId } = await params;
  const booking = await getBookingPaymentDetails(bookingId, session);

  if (!booking) {
    redirect("/dashboard/bookings");
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Payments</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Fare settlement, tip, and receipt.
        </h1>
      </div>

      <CustomerPaymentPanel booking={booking} />
    </section>
  );
}
