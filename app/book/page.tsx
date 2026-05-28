import { BookingWizard } from "@/components/booking/booking-wizard";
import { SectionHeading } from "@/components/marketing/section-heading";
import { buildMetadata } from "@/lib/seo";
import { getFleet } from "@/lib/repository";

export const metadata = buildMetadata({
  title: "Book a private transfer",
  description: "Cleaner direct-booking page with dynamic location search, map pin selection, and locked fare pricing.",
  path: "/book"
});

export default async function BookPage({
  searchParams
}: {
  searchParams: Promise<{
    vehicle?: string;
    pickup?: string;
    destination?: string;
    pickupCoordinates?: string;
    destinationCoordinates?: string;
    pickupCountryCode?: string;
    destinationCountryCode?: string;
    routeSlug?: string;
    returnTrip?: string;
    pickupDate?: string;
    pickupTime?: string;
    offer?: string;
  }>;
}) {
  const params = await searchParams;
  const vehicles = await getFleet();
  const initialVehicleSlug = vehicles.find((vehicle) => vehicle.slug === params.vehicle)?.slug;

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <SectionHeading
        eyebrow="Book direct"
        title="Choose your route, lock the fare, and confirm in minutes."
        body="Search any address, use current location, or drop a map pin. Pricing stays dynamic, but the booking experience should still feel calm, clear, and premium."
      />

      <div className="mt-10">
        <BookingWizard
          vehicles={vehicles}
          initialVehicleSlug={initialVehicleSlug}
          initialPickupAddress={params.pickup}
          initialDestinationAddress={params.destination}
          initialPickupCoordinates={params.pickupCoordinates}
          initialDestinationCoordinates={params.destinationCoordinates}
          initialPickupCountryCode={params.pickupCountryCode}
          initialDestinationCountryCode={params.destinationCountryCode}
          initialRouteSlug={params.routeSlug}
          initialReturnTrip={params.returnTrip === "true"}
          initialPickupDate={params.pickupDate}
          initialPickupTime={params.pickupTime}
          initialOfferToken={params.offer}
        />
      </div>
    </main>
  );
}
