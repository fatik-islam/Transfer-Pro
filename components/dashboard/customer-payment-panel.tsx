"use client";
import { useState } from "react";
import { useActionState } from "react";

import { addTipCheckoutAction, payOutstandingBookingByCardAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import type { PaymentStatus } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface CustomerPaymentPanelProps {
  booking: {
    id: string;
    reference: string;
    status: string;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    paymentMethodLabel: string;
    pickupAt: string;
    origin: string;
    destination: string;
    total: number;
    tipAmount: number;
    tipPaymentStatus: PaymentStatus;
    customerEmail: string;
    driverName: string | null;
    vehicleName: string;
    invoiceDownloadHref?: string;
    receiptDownloadHref?: string;
    whatsappHref?: string;
    callHref?: string;
  };
}

export function CustomerPaymentPanel({ booking }: CustomerPaymentPanelProps) {
  const [tipAmount, setTipAmount] = useState(
    booking.tipAmount > 0 ? String(Math.round(booking.tipAmount)) : "20"
  );
  const [fareState, fareAction, farePending] = useActionState(
    payOutstandingBookingByCardAction,
    initialActionState
  );
  const [tipState, tipAction, tipPending] = useActionState(addTipCheckoutAction, initialActionState);

  const canPayNowByCard =
    booking.status === "COMPLETED" && booking.paymentStatus !== "PAID" && booking.paymentStatus !== "AUTHORIZED";
  const hasCardHold = booking.paymentMethod === "STRIPE" && booking.paymentStatus === "AUTHORIZED";
  const canAddTip = booking.status === "COMPLETED" && booking.tipPaymentStatus !== "PAID";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Journey summary</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink md:text-3xl">{booking.reference}</h2>

        <div className="mt-6 grid gap-4 rounded-[1.8rem] bg-[#fcfbf8] p-5 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Route</p>
            <p className="mt-2 font-medium text-ink">{booking.origin}</p>
            <p className="text-slate">{booking.destination}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Pickup</p>
            <p className="mt-2 text-ink">{formatDateTime(booking.pickupAt)}</p>
            <p className="text-slate">{booking.vehicleName}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Driver</p>
            <p className="mt-2 text-ink">{booking.driverName ?? "Assigned closer to pickup"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate/60">Fare</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{formatCurrency(booking.total)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-[1.7rem] border border-slate/10 bg-[#fcfbf8] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">Payment status</p>
            <h3 className="mt-2 text-xl font-semibold text-ink">{booking.paymentMethodLabel}</h3>
            <p className="mt-2 text-sm leading-7 text-slate">
              {hasCardHold
                ? "Your card hold is active. Funds stay reserved and are captured only after the ride is completed. If the ride is canceled or not fulfilled, the authorization is released."
                : booking.paymentStatus === "PAID"
                  ? "This ride is settled."
                  : booking.status === "COMPLETED"
                    ? "You can settle directly with the driver using the selected payment method, or switch to card payment now."
                    : "Payment options stay visible here, but final settlement opens after the ride is completed."}
            </p>
          </div>

          {booking.status === "COMPLETED" && booking.paymentStatus !== "PAID" ? (
            <div className="rounded-[1.7rem] border border-slate/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-ink">Pay after the ride</p>
              <p className="mt-2 text-sm leading-7 text-slate">
                Chosen method: {booking.paymentMethodLabel}. You can settle with the driver directly after the ride, or switch to card payment now.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {booking.callHref ? (
                  <a href={booking.callHref} className="rounded-full border border-slate/10 px-4 py-2 text-sm font-semibold text-ink">
                    Call driver
                  </a>
                ) : null}
                {booking.whatsappHref ? (
                  <a
                    href={booking.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate/10 px-4 py-2 text-sm font-semibold text-ink"
                  >
                    WhatsApp driver
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {booking.invoiceDownloadHref || booking.receiptDownloadHref ? (
            <div className="rounded-[1.7rem] border border-slate/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-ink">Documents</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {booking.invoiceDownloadHref ? (
                  <a href={booking.invoiceDownloadHref} className="rounded-full border border-slate/10 px-4 py-2 text-sm font-semibold text-ink">
                    Download invoice
                  </a>
                ) : null}
                {booking.receiptDownloadHref ? (
                  <a href={booking.receiptDownloadHref} className="rounded-full border border-slate/10 px-4 py-2 text-sm font-semibold text-ink">
                    Download receipt
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="space-y-6">
        <form action={fareAction} className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="customerEmail" value={booking.customerEmail} />

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Card settlement</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink md:text-3xl">Pay by card now.</h2>
          <p className="mt-3 text-sm leading-7 text-slate">
            Use this if you want to settle the completed ride with card from the dashboard instead of paying the driver directly.
          </p>

          {fareState.message ? (
            <p className="mt-4 rounded-3xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
              {fareState.message}
            </p>
          ) : null}

          <div className="mt-5">
            <Button type="submit" disabled={!canPayNowByCard || farePending} className="w-full">
              {farePending ? "Opening checkout..." : "Pay fare by card"}
            </Button>
          </div>
        </form>

        <form action={tipAction} className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="customerEmail" value={booking.customerEmail} />

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Driver tip</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink md:text-3xl">Add a tip.</h2>
          <p className="mt-3 text-sm leading-7 text-slate">
            Tips are optional and processed separately from the fare.
            {booking.driverName ? ` Tip ${booking.driverName} directly here after the ride.` : ""}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[10, 20, 30, 50].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setTipAmount(String(amount))}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  tipAmount === String(amount)
                    ? "bg-ink text-cloud"
                    : "border border-slate/10 text-ink"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          <label className="mt-5 block space-y-2 text-sm text-slate">
            <span className="font-medium text-ink">Tip amount (CAD)</span>
            <Input
              type="number"
              name="tipAmount"
              min={1}
              max={500}
              step={1}
              value={tipAmount}
              onChange={(event) => setTipAmount(event.target.value)}
              required
            />
          </label>

          {booking.tipAmount > 0 ? (
            <p className="mt-4 text-sm text-slate">
              Current tip: {formatCurrency(booking.tipAmount)}
            </p>
          ) : null}

          {booking.tipPaymentStatus === "PAID" ? (
            <p className="mt-4 rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
              Driver tip already received.
            </p>
          ) : null}

          {tipState.message ? (
            <p className="mt-4 rounded-3xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
              {tipState.message}
            </p>
          ) : null}

          <div className="mt-5">
            <Button type="submit" disabled={!canAddTip || tipPending} className="w-full">
              {tipPending ? "Opening checkout..." : "Add tip by card"}
            </Button>
          </div>

          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate/60">
            Cash tips can still be given directly to the driver.
          </p>
        </form>
      </div>
    </div>
  );
}
