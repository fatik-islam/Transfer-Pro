import Link from "next/link";
import type { Route } from "next";

import { SectionHeading } from "@/components/marketing/section-heading";
import { buildMetadata } from "@/lib/seo";
import { getRouteCatalog } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Route catalog",
  description: "SEO-friendly route catalog with fixed-price and quote-based transfer options.",
  path: "/routes"
});

function buildRouteHref(route: {
  mode: "FIXED" | "QUOTE";
  slug: string;
  origin: string;
  destination: string;
}): Route {
  const search = new URLSearchParams({
    pickup: route.origin,
    destination: route.destination
  });

  if (route.mode === "FIXED") {
    search.set("routeSlug", route.slug);
    return `/book?${search.toString()}` as Route;
  }

  search.set("routeSummary", `${route.origin} to ${route.destination}`);
  return `/quotes?${search.toString()}` as Route;
}

export default async function RoutesPage() {
  const routes = await getRouteCatalog();

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <SectionHeading
        eyebrow="Routes"
        title="Price the repeatable corridors. Quote the special journeys."
        body="Each route page can be indexed, merchandised by vehicle class, and mapped to either instant pricing or concierge-style quoting."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {routes.map((route) => (
          <article key={route.id} className="rounded-[2rem] bg-white p-6 shadow-quiet">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">
                  {route.mode === "FIXED" ? "Fixed-price" : "Quote-based"}
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-ink">
                  {route.origin} to {route.destination}
                </h2>
              </div>
              <p className="text-sm text-slate">{route.duration}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate">{route.copy}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {route.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sand/35 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-slate/10 pt-6">
              <div>
                <p className="text-sm text-slate">{route.distance}</p>
                <p className="text-2xl font-semibold text-ink">
                  {route.fromPrice ? formatCurrency(route.fromPrice) : "Custom pricing"}
                </p>
              </div>
              <Link
                href={buildRouteHref(route)}
                className="text-sm font-semibold uppercase tracking-[0.16em] text-ink underline"
              >
                {route.mode === "FIXED" ? "Book route" : "Request quote"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
