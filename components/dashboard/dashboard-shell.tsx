"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

const navByRole = {
  ADMIN: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/bookings", label: "Bookings" },
    { href: "/dashboard/quotes", label: "Quotes" },
    { href: "/dashboard/routes", label: "Routes" },
    { href: "/dashboard/fleet", label: "Fleet" },
    { href: "/dashboard/drivers", label: "Drivers" },
    { href: "/dashboard/customers", label: "Customers" },
    { href: "/dashboard/invoices", label: "Invoices" },
    { href: "/dashboard/settings", label: "Settings" }
  ],
  DRIVER: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/bookings", label: "Trips" },
    { href: "/dashboard/settings", label: "Settings" }
  ],
  CUSTOMER: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/bookings", label: "Bookings" },
    { href: "/dashboard/quotes", label: "Quotes" },
    { href: "/dashboard/invoices", label: "Receipts" },
    { href: "/dashboard/settings", label: "Settings" }
  ]
} as const;

export function DashboardShell({
  user,
  children
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navByRole[user.role];

  function renderNavLinks(compact = false) {
    return items.map((item) => {
      const active =
        item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={cn(
            "block rounded-2xl px-4 py-3 text-sm transition",
            compact
              ? active
                ? "bg-white text-ink"
                : "bg-white/16 text-cloud hover:bg-white/24 hover:text-cloud"
              : active
                ? "bg-white text-ink shadow-sm"
                : "text-cloud hover:bg-white/14 hover:text-cloud"
          )}
        >
          {item.label}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="border-b border-white/20 bg-[#f4efe7]/70 px-4 py-4 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-copper">Transfer Pro Ops</p>
            <p className="truncate text-sm text-slate">
              {user.name} · {user.role.toLowerCase()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="glass-panel inline-flex h-11 w-11 items-center justify-center rounded-full text-ink"
            aria-label={menuOpen ? "Close dashboard menu" : "Open dashboard menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="glass-panel-dark mx-auto mt-4 max-w-7xl rounded-[1.8rem] p-4 text-cloud shadow-lift">
            <nav className="grid gap-2 sm:grid-cols-2">{renderNavLinks(true)}</nav>
            <form action={signOutAction} className="mt-4">
              <Button
                type="submit"
                variant="secondary"
                className="w-full border-white/20 bg-white/16 text-cloud hover:bg-white/24"
              >
                Sign out
              </Button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-4 md:px-6 md:py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="glass-panel-dark sticky top-6 hidden h-fit rounded-[2rem] p-6 text-cloud shadow-lift lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Workspace</p>
            <h1 className="mt-3 font-display text-4xl leading-none">Transfer Pro Ops</h1>
            <p className="mt-3 text-sm leading-7 text-cloud/70">
              Signed in as {user.name}. Role: {user.role.toLowerCase()}.
            </p>
          </div>

          <nav className="mt-8 space-y-2">{renderNavLinks()}</nav>

          <form action={signOutAction} className="mt-8">
            <Button type="submit" variant="secondary" className="w-full border-white/20 bg-white/16 text-cloud hover:bg-white/24">
              Sign out
            </Button>
          </form>
        </aside>

        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
