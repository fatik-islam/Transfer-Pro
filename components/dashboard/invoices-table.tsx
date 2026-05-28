import { StatusPill } from "@/components/ui/status-pill";
import type { InvoiceRecord } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function InvoicesTable({ invoices }: { invoices: InvoiceRecord[] }) {
  return (
    <div className="page-card rounded-[2rem]">
      <div className="space-y-4 p-4 lg:hidden">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="page-card-subtle rounded-[1.6rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  {invoice.number}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink">{invoice.bookingReference}</h3>
                <p className="text-sm text-slate">{invoice.customerName}</p>
              </div>
              <StatusPill value={invoice.status} />
            </div>

            <div className="glass-panel mt-4 rounded-[1.3rem] p-4 text-sm">
              <p className="text-slate">Issued {formatDateTime(invoice.issuedAt)}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{formatCurrency(invoice.total)}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {invoice.paymentHref ? (
                <a
                  href={invoice.paymentHref}
                  className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-cloud shadow-[0_18px_44px_rgba(8,20,38,0.18)]"
                >
                  Tip driver
                </a>
              ) : null}
              {invoice.downloadHref ? (
                <a
                  href={invoice.downloadHref}
                  className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
                >
                  Download invoice
                </a>
              ) : null}
              {invoice.receiptHref ? (
                <a
                  href={invoice.receiptHref}
                  className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
                >
                  Download receipt
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate/10 text-xs uppercase tracking-[0.2em] text-slate">
            <tr>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Booking</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Issued</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Documents</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-slate/6 last:border-b-0">
                <td className="px-6 py-5 font-semibold text-ink">{invoice.number}</td>
                <td className="px-6 py-5 text-slate">{invoice.bookingReference}</td>
                <td className="px-6 py-5 text-slate">{invoice.customerName}</td>
                <td className="px-6 py-5 text-slate">{formatDateTime(invoice.issuedAt)}</td>
                <td className="px-6 py-5">
                  <StatusPill value={invoice.status} />
                </td>
                <td className="px-6 py-5 font-semibold text-ink">{formatCurrency(invoice.total)}</td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    {invoice.paymentHref ? (
                      <a
                        href={invoice.paymentHref}
                        className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-cloud shadow-[0_18px_44px_rgba(8,20,38,0.18)]"
                      >
                        Tip driver
                      </a>
                    ) : null}
                    {invoice.downloadHref ? (
                      <a
                        href={invoice.downloadHref}
                        className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
                      >
                        Invoice
                      </a>
                    ) : null}
                    {invoice.receiptHref ? (
                      <a
                        href={invoice.receiptHref}
                        className="glass-panel rounded-full px-3 py-2 text-xs font-semibold text-ink"
                      >
                        Receipt
                      </a>
                    ) : null}
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
