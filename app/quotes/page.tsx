import { QuoteRequestForm } from "@/components/booking/quote-request-form";
import { SectionHeading } from "@/components/marketing/section-heading";
import { buildMetadata } from "@/lib/seo";
import { getFleet } from "@/lib/repository";

export const metadata = buildMetadata({
  title: "Request a transfer quote",
  description: "Quote intake page for long-distance, event, hourly, and multi-stop transfer journeys.",
  path: "/quotes"
});

export default async function QuotesPage({
  searchParams
}: {
  searchParams: Promise<{
    routeSummary?: string;
    requestedVehicle?: string;
    pickup?: string;
    destination?: string;
    pickupCoordinates?: string;
    destinationCoordinates?: string;
    notes?: string;
  }>;
}) {
  const params = await searchParams;
  const vehicles = await getFleet();

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <SectionHeading
        eyebrow="Quote-based rides"
        title="Send custom journeys into an ops review queue."
        body="Use this flow for long-distance, hourly, event, or complex multi-stop rides where pricing depends on timing, wait rules, and margin."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <QuoteRequestForm
          vehicles={vehicles}
          initialRouteSummary={params.routeSummary}
          initialVehicleName={params.requestedVehicle}
          initialPickup={params.pickup}
          initialDestination={params.destination}
          initialPickupCoordinates={params.pickupCoordinates}
          initialDestinationCoordinates={params.destinationCoordinates}
          initialNotes={params.notes}
        />
        <aside className="rounded-[2rem] bg-ink p-6 text-cloud shadow-lift md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Best used for</p>
          <div className="mt-6 space-y-5 text-sm leading-7 text-cloud/72">
            <p>Long-distance city-to-city transfers with different dayparts and stop logic.</p>
            <p>Hotel, cruise, and event work where waiting windows and luggage volumes change the margin.</p>
            <p>Return rides, hourly disposals, and premium moves requiring named drivers or special handling.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
