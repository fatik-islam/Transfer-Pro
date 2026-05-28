import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { buildMetadata } from "@/lib/seo";
import { destinationGuides } from "@/lib/site-data";

export function generateStaticParams() {
  return destinationGuides.map((guide) => ({
    slug: guide.slug
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = destinationGuides.find((item) => item.slug === slug);

  if (!guide) {
    return {};
  }

  return buildMetadata({
    title: guide.seoTitle,
    description: guide.seoDescription,
    path: `/destinations/${guide.slug}`
  });
}

export default async function DestinationPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = destinationGuides.find((item) => item.slug === slug);

  if (!guide) {
    notFound();
  }

  const actionHref: Route =
    guide.slug === "toronto-to-montreal-private-transfer"
      ? ("/book?pickup=Toronto&destination=Montreal&routeSlug=toronto-to-montreal" as Route)
      : guide.slug === "canada-to-usa-private-transfer"
        ? ("/quotes?pickup=Canada&destination=United%20States&routeSummary=Canada%20to%20United%20States" as Route)
        : "/book";

  const secondaryHref: Route =
    guide.slug === "canada-to-usa-private-transfer"
      ? ("/book?pickup=Toronto&destination=Montreal&routeSlug=toronto-to-montreal" as Route)
      : "/quotes";

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="rounded-[2.5rem] bg-ink p-6 text-cloud shadow-lift md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Destination page</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-none">{guide.headline}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-cloud/72">{guide.intro}</p>
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">SEO content pattern</p>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-slate">
            {guide.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3">
                <span className="mt-3 h-2 w-2 rounded-full bg-copper" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Next actions</p>
          <div className="mt-6 space-y-4">
            <Link
              href={actionHref}
              className="block rounded-full bg-ink px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.16em] text-cloud"
            >
              {guide.slug === "canada-to-usa-private-transfer" ? "Request this route" : "Book a fixed route"}
            </Link>
            <Link
              href={secondaryHref}
              className="block rounded-full border border-slate/10 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.16em] text-ink"
            >
              {guide.slug === "canada-to-usa-private-transfer"
                ? "Book Toronto to Montreal"
                : "Request a bespoke quote"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
