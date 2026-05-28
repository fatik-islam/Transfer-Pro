import { HomeMarketplace } from "@/components/marketing/home-marketplace";
import { buildMetadata } from "@/lib/seo";
import { brand } from "@/lib/site-data";
import { getFleet, getRouteCatalog } from "@/lib/repository";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Book private transfers with Transfer Pro",
  description:
    "Book direct private transfers with Transfer Pro for Toronto, Montreal, city rides, airport pickups, and Canada to USA trips."
});

export default async function HomePage() {
  const [routes, vehicles] = await Promise.all([getRouteCatalog(), getFleet()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: brand.name,
    description: brand.description,
    areaServed: ["Toronto", "Montreal", "Canada", "United States"],
    serviceType: "Private transfers"
  };

  return (
    <main>
      <HomeMarketplace routes={routes} vehicles={vehicles} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
