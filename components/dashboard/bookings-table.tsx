import {
  acceptBookingAction,
  assignBookingDriverAction,
  markBookingPaidAction,
  updateBookingStatusAction
} from "@/app/actions";
import { StatusPill } from "@/components/ui/status-pill";
import type { BookingRecord, DriverCard, UserRole } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function DriverAssignmentControl({
  bookingId,
  drivers
}: {
  bookingId: string;
  drivers: DriverCard[];
}) {
  if (!drivers.length) {
    return null;
  }

  return (
    <form action={assignBookingDriverAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        name="driverProfileId"
        className="glass-panel rounded-full px-3 py-2 text-xs text-ink"
      >
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name}
          </option>
        ))}
      </select>
      <button className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink">
        Assign
      </button>
    </form>
  );
}

function OperatorActions({
  booking,
  userRole,
  backupDrivers
}: {
  booking: BookingRecord;
  userRole: UserRole;
  backupDrivers: DriverCard[];
}) {
  const canOperate = userRole === "ADMIN" || (userRole === "DRIVER" && booking.assignedToCurrentUser);

  if (!canOperate) {
    return null;
  }

  return (
    <>
      <form action={updateBookingStatusAction}>
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="status" value="CONFIRMED" />
        <button className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink">
          Confirm
        </button>
      </form>
      <form action={updateBookingStatusAction}>
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="status" value="IN_PROGRESS" />
        <button className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink">
          En route
        </button>
      </form>
      <form action={updateBookingStatusAction}>
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="status" value="ARRIVED" />
        <button className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink">
          Arrived
        </button>
      </form>
      <form action={updateBookingStatusAction}>
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="status" value="COMPLETED" />
        <button className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink">
          Complete
        </button>
      </form>
      <form action={updateBookingStatusAction}>
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="status" value="CANCELLED" />
        <button className="rounded-full border border-red-200/70 bg-red-50/60 px-3 py-2 text-xs font-semibold text-red-700 backdrop-blur-xl">
          Cancel
        </button>
      </form>
      {booking.paymentStatus !== "PAID" ? (
        <form action={markBookingPaidAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="provider" value={booking.paymentMethod ?? "MANUAL"} />
          <button className="rounded-full border-0 bg-[#1f7f62] px-3 py-2 text-xs font-semibold text-white shadow-[0_18px_44px_rgba(18,79,63,0.24)]">
            Mark paid
          </button>
        </form>
      ) : null}
      {userRole === "ADMIN" ? (
        <DriverAssignmentControl bookingId={booking.id} drivers={backupDrivers} />
      ) : null}
    </>
  );
}

function BookingActionGroup({
  booking,
  userRole,
  backupDrivers
}: {
  booking: BookingRecord;
  userRole: UserRole;
  backupDrivers: DriverCard[];
}) {
  const customerPaymentCta =
    userRole === "CUSTOMER" && booking.paymentActionHref
      ? booking.paymentStatus === "PAID" && booking.tipPaymentStatus !== "PAID"
        ? "Tip driver"
        : booking.tipPaymentStatus === "PAID"
          ? "Payment details"
          : "Payment & tip"
      : null;

  return (
    <div className="flex flex-wrap gap-2">
      {booking.whatsappHref ? (
        <a
          href={booking.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
        >
          WhatsApp
        </a>
      ) : null}
      {booking.callHref ? (
        <a href={booking.callHref} className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink">
          Call
        </a>
      ) : null}
      {booking.repeatHref && userRole === "CUSTOMER" ? (
        <a href={booking.repeatHref} className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-cloud shadow-[0_18px_44px_rgba(8,20,38,0.18)]">
          Repeat
        </a>
      ) : null}
      {booking.paymentActionHref && customerPaymentCta ? (
        <a
          href={booking.paymentActionHref}
          className={
            customerPaymentCta === "Tip driver"
              ? "rounded-full bg-ink px-3 py-2 text-xs font-semibold text-cloud"
              : "glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
          }
        >
          {customerPaymentCta}
        </a>
      ) : null}
      {booking.invoiceDownloadHref ? (
        <a
          href={booking.invoiceDownloadHref}
          className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
        >
          Invoice
        </a>
      ) : null}
      {booking.receiptDownloadHref ? (
        <a
          href={booking.receiptDownloadHref}
          className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
        >
          Receipt
        </a>
      ) : null}
      {userRole === "DRIVER" && booking.openToAccept ? (
        <form action={acceptBookingAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <button className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-cloud shadow-[0_18px_44px_rgba(8,20,38,0.18)]">
            Accept ride
          </button>
        </form>
      ) : null}
      <OperatorActions booking={booking} userRole={userRole} backupDrivers={backupDrivers} />
    </div>
  );
}

export function BookingsTable({
  bookings,
  userRole = "CUSTOMER",
  drivers = []
}: {
  bookings: BookingRecord[];
  userRole?: UserRole;
  drivers?: DriverCard[];
}) {
  const backupDrivers = drivers.length > 1 ? drivers : [];

  return (
    <div className="page-card rounded-[2rem]">
      <div className="space-y-4 p-4 lg:hidden">
        {bookings.map((booking) => (
          <article key={booking.id} className="page-card-subtle rounded-[1.6rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  {booking.reference}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink">{booking.customerName}</h3>
                <p className="text-sm text-slate">{booking.customerEmail}</p>
              </div>
              <StatusPill value={booking.status} />
            </div>

            <div className="glass-panel mt-4 grid gap-3 rounded-[1.3rem] p-4 text-sm text-slate">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Journey</p>
                <p className="mt-1 font-medium text-ink">{booking.origin}</p>
                <p>{booking.destination}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Pickup</p>
                  <p className="mt-1 text-ink">{formatDateTime(booking.pickupAt)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Driver</p>
                  <p className="mt-1 text-ink">
                    {booking.driver ?? (booking.openToAccept ? "Open driver queue" : "Awaiting assignment")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Payment</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <StatusPill value={booking.paymentStatus} />
                    {booking.tipAmount ? <StatusPill value={`TIP ${booking.tipAmount}`} /> : null}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Total</p>
                  <p className="mt-1 font-semibold text-ink">{formatCurrency(booking.total)}</p>
                </div>
              </div>
              <p className="text-xs text-slate">
                {booking.paymentMethodLabel}
                {booking.tipAmount ? ` · Tip ${formatCurrency(booking.tipAmount)}` : ""}
              </p>
            </div>

            <div className="mt-4">
              <BookingActionGroup booking={booking} userRole={userRole} backupDrivers={backupDrivers} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-slate">
              {(booking.timeline ?? []).map((step) => (
                <span key={step.label} className={step.completed ? "text-ink" : "text-slate/60"}>
                  {step.label}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate/10 text-xs uppercase tracking-[0.2em] text-slate">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Passenger</th>
              <th className="px-6 py-4">Journey</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-slate/6 align-top last:border-b-0">
                <td className="px-6 py-5 font-semibold text-ink">{booking.reference}</td>
                <td className="px-6 py-5 text-slate">
                  <p className="font-medium text-ink">{booking.customerName}</p>
                  <p>{booking.customerEmail}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em]">{formatDateTime(booking.pickupAt)}</p>
                </td>
                <td className="px-6 py-5 text-slate">
                  <p className="font-medium text-ink">{booking.origin}</p>
                  <p>{booking.destination}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em]">{booking.vehicle}</p>
                </td>
                <td className="px-6 py-5 text-slate">
                  {booking.driver ?? (booking.openToAccept ? "Open driver queue" : "Awaiting assignment")}
                </td>
                <td className="px-6 py-5">
                  <StatusPill value={booking.status} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill value={booking.paymentStatus} />
                    {booking.tipAmount ? (
                      <span className="inline-flex rounded-full bg-sky-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                        Tip {formatCurrency(booking.tipAmount)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate/60">
                    {booking.paymentMethodLabel}
                  </p>
                </td>
                <td className="px-6 py-5 font-semibold text-ink">{formatCurrency(booking.total)}</td>
                <td className="min-w-[360px] px-6 py-5">
                  <BookingActionGroup booking={booking} userRole={userRole} backupDrivers={backupDrivers} />
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-slate">
                    {(booking.timeline ?? []).map((step) => (
                      <span key={step.label} className={step.completed ? "text-ink" : "text-slate/60"}>
                        {step.label}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
