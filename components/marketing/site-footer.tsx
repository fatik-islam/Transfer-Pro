import Link from "next/link";

import { TransferProLogo } from "@/components/branding/transfer-pro-logo";
import { brand } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="premium-footer mt-12 border-t border-white/25">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div className="space-y-4 p-2">
          <TransferProLogo />
          <p className="max-w-md text-sm leading-7 text-slate">{brand.description}</p>
        </div>

        <div className="space-y-3 p-2 text-sm text-slate">
          <p className="font-semibold uppercase tracking-[0.18em] text-ink">Explore</p>
          <Link href="/quotes" className="block transition hover:text-ink">
            Request quote
          </Link>
          <Link href="/book" className="block transition hover:text-ink">
            Book direct
          </Link>
          <Link href="/#destinations" className="block transition hover:text-ink">
            Served routes
          </Link>
        </div>

        <div className="space-y-3 p-2 text-sm text-slate">
          <p className="font-semibold uppercase tracking-[0.18em] text-ink">Direct service</p>
          <p>Guest booking, locked fares, repeat rides, and direct driver contact for regular customers.</p>
          <p>Accounts are optional and useful only when customers want history, invoices, and saved repeat trips.</p>
        </div>
      </div>
    </footer>
  );
}
