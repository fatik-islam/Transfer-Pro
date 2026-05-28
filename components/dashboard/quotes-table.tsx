import { StatusPill } from "@/components/ui/status-pill";
import type { QuoteRecord } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function QuotesTable({ quotes }: { quotes: QuoteRecord[] }) {
  return (
    <div className="page-card rounded-[2rem]">
      <div className="space-y-4 p-4 lg:hidden">
        {quotes.map((quote) => (
          <article key={quote.id} className="page-card-subtle rounded-[1.6rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  {quote.reference}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink">{quote.customerName}</h3>
                <p className="text-sm text-slate">{quote.route}</p>
              </div>
              <StatusPill value={quote.status} />
            </div>
            <div className="glass-panel mt-4 rounded-[1.3rem] p-4 text-sm">
              <p className="text-slate">Pickup {formatDateTime(quote.pickupAt)}</p>
              <p className="mt-2 font-semibold text-ink">
                {quote.offer ? formatCurrency(quote.offer) : "Pending pricing"}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate/10 text-xs uppercase tracking-[0.2em] text-slate">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Route</th>
              <th className="px-6 py-4">Pickup</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Offer</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-b border-slate/6 last:border-b-0">
                <td className="px-6 py-5 font-semibold text-ink">{quote.reference}</td>
                <td className="px-6 py-5 text-slate">{quote.customerName}</td>
                <td className="px-6 py-5 text-slate">{quote.route}</td>
                <td className="px-6 py-5 text-slate">{formatDateTime(quote.pickupAt)}</td>
                <td className="px-6 py-5">
                  <StatusPill value={quote.status} />
                </td>
                <td className="px-6 py-5 font-semibold text-ink">
                  {quote.offer ? formatCurrency(quote.offer) : "Pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
