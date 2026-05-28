"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { TransferProLogo } from "@/components/branding/transfer-pro-logo";

const publicLinks = [
  { href: "/#destinations", label: "Destinations" },
  { href: "/#offers", label: "Routes" },
  { href: "/fleet", label: "Classes" },
  { href: "/quotes", label: "Request quote" }
] as const;

export function SiteHeaderClient({ hasSession }: { hasSession: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-[#f6f1e9]/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:gap-6 md:px-8 md:py-4">
        <Link href="/" className="text-ink">
          <TransferProLogo compact className="max-w-[15rem]" taglineClassName="hidden sm:block" />
        </Link>

        <nav className="glass-panel hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-slate md:flex">
          {publicLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 transition hover:bg-white/35 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {hasSession ? (
            <Link
              href="/dashboard"
              className="rounded-full border border-[#102133] bg-[#102133] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-[#f4efe7] transition hover:bg-[#183049]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="hidden text-sm font-medium text-slate transition hover:text-ink md:inline-flex">
                Sign in
              </Link>
              <Link
                href="/book"
                className="rounded-full border border-[#102133] bg-[#102133] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-[#f4efe7] transition hover:bg-[#183049]"
              >
                Book now
              </Link>
            </>
          )}
        </div>

        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Close site menu" : "Open site menu"}
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-white/75"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {menuOpen ? (
            <div className="glass-panel-strong absolute right-0 top-full z-50 mt-3 w-[min(88vw,22rem)] overflow-hidden rounded-[1.7rem] p-3 shadow-lift">
              <div className="border-b border-white/35 px-2 pb-3">
                <TransferProLogo compact className="max-w-[15rem]" taglineClassName="text-[9px]" />
              </div>
              <nav className="flex flex-col gap-1 text-sm text-slate">
                {publicLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 transition hover:bg-white/40 hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-3 border-t border-white/35 pt-3">
                {hasSession ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center rounded-full border border-[#102133] bg-[#102133] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-[#f4efe7] transition hover:bg-[#183049]"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/sign-in"
                      onClick={() => setMenuOpen(false)}
                      className="glass-panel flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/70"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/book"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center rounded-full border border-[#102133] bg-[#102133] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-[#f4efe7] transition hover:bg-[#183049]"
                    >
                      Book now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
