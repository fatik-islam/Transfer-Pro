"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRightLeft,
  CarFront,
  Clock3,
  LoaderCircle,
  MapPinned,
  MessageCircleMore,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LocationField } from "@/components/location/location-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  brand,
  locationCollections,
  marketplaceAdvantages,
  offerHighlights,
  travelerReviews,
  trustStats
} from "@/lib/site-data";
import type { FleetVehicle, LocationCoordinates, RouteCard, TransferPricingQuote } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type MarketMode = "ride" | "airport" | "intercity" | "hourly";

const hourlyPackages = [
  {
    id: "hourly-3",
    label: "3-hour chauffeur",
    summary: "Short meetings, hotel loops, and airport wait windows."
  },
  {
    id: "hourly-6",
    label: "6-hour chauffeur",
    summary: "Half-day roadshows and executive visits."
  },
  {
    id: "hourly-12",
    label: "12-hour chauffeur",
    summary: "Full-day disposal with flexible stops and return coverage."
  }
] as const;

function routeMatches(route: RouteCard, matchers: string[]) {
  const haystack = `${route.origin} ${route.destination} ${route.tags.join(" ")}`.toLowerCase();
  return matchers.some((matcher) => haystack.includes(matcher));
}

function defaultPickupDate() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

function defaultPickupTime() {
  return new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5);
}

function formatHeroPickupDate(value: string) {
  if (!value) {
    return "Select date";
  }

  const parsed = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(parsed)
    .replace(/ /g, "-");
}

function formatHeroPickupTime(value: string) {
  if (!value) {
    return "Select time";
  }

  const parsed = new Date(`1970-01-01T${value}`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(parsed);
}

function buildDirectionsUrl(
  pickupLabel: string,
  destinationLabel: string,
  pickupCoordinates: LocationCoordinates | null,
  destinationCoordinates: LocationCoordinates | null
) {
  const params = new URLSearchParams({
    api: "1",
    origin:
      pickupCoordinates
        ? `${pickupCoordinates.lat},${pickupCoordinates.lng}`
        : pickupLabel,
    destination:
      destinationCoordinates
        ? `${destinationCoordinates.lat},${destinationCoordinates.lng}`
        : destinationLabel
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildBookingUrl(params: {
  pickupLabel: string;
  destinationLabel: string;
  pickupCoordinates: LocationCoordinates | null;
  destinationCoordinates: LocationCoordinates | null;
  pickupCountryCode: string;
  destinationCountryCode: string;
  vehicleSlug: string;
  returnTrip: boolean;
  pickupDate: string;
  pickupTime: string;
  offerToken?: string;
}) {
  const search = new URLSearchParams({
    pickup: params.pickupLabel,
    destination: params.destinationLabel,
    vehicle: params.vehicleSlug,
    pickupCountryCode: params.pickupCountryCode,
    destinationCountryCode: params.destinationCountryCode,
    returnTrip: String(params.returnTrip),
    pickupDate: params.pickupDate,
    pickupTime: params.pickupTime
  });

  if (params.offerToken) {
    search.set("offer", params.offerToken);
  }

  if (params.pickupCoordinates) {
    search.set(
      "pickupCoordinates",
      `${params.pickupCoordinates.lat.toFixed(6)},${params.pickupCoordinates.lng.toFixed(6)}`
    );
  }

  if (params.destinationCoordinates) {
    search.set(
      "destinationCoordinates",
      `${params.destinationCoordinates.lat.toFixed(6)},${params.destinationCoordinates.lng.toFixed(6)}`
    );
  }

  return `/book?${search.toString()}`;
}

function buildAdminHelpUrl(params: {
  pickupLabel: string;
  destinationLabel: string;
  pickupCoordinates: LocationCoordinates | null;
  destinationCoordinates: LocationCoordinates | null;
}) {
  const search = new URLSearchParams({
    pickup: params.pickupLabel,
    destination: params.destinationLabel,
    routeSummary: `${params.pickupLabel} to ${params.destinationLabel}`,
    notes: "Ride exceeds 1000 km. Admin help required before booking."
  });

  if (params.pickupCoordinates) {
    search.set(
      "pickupCoordinates",
      `${params.pickupCoordinates.lat.toFixed(6)},${params.pickupCoordinates.lng.toFixed(6)}`
    );
  }

  if (params.destinationCoordinates) {
    search.set(
      "destinationCoordinates",
      `${params.destinationCoordinates.lat.toFixed(6)},${params.destinationCoordinates.lng.toFixed(6)}`
    );
  }

  return `/quotes?${search.toString()}`;
}

const modeCopy: Record<
  MarketMode,
  {
    label: string;
    title: string;
    pickupPlaceholder: string;
    destinationPlaceholder: string;
  }
> = {
  ride: {
    label: "Ride",
    title: "A private car, a clear fare, and a journey arranged around you.",
    pickupPlaceholder: "From: any address, airport, hotel, or place",
    destinationPlaceholder: "To: any address, airport, hotel, or place"
  },
  airport: {
    label: "Airport",
    title: "Flight-aware airport pickup with direct driver communication.",
    pickupPlaceholder: "From: airport, terminal, hotel, or place",
    destinationPlaceholder: "To: hotel, villa, office, or place"
  },
  intercity: {
    label: "Intercity",
    title: "Quiet, door-to-door intercity travel without the handoffs.",
    pickupPlaceholder: "From: city, address, airport, or place",
    destinationPlaceholder: "To: city, address, airport, or place"
  },
  hourly: {
    label: "Per hour",
    title: "A chauffeur on your schedule, with room for plans to change.",
    pickupPlaceholder: "Start point: address, hotel, airport, or place",
    destinationPlaceholder: "End point or final area"
  }
};

export function HomeMarketplace({
  routes,
  vehicles
}: {
  routes: RouteCard[];
  vehicles: FleetVehicle[];
}) {
  const router = useRouter();
  const fixedRoutes = routes.filter((route) => route.mode === "FIXED");
  const airportRoutes = fixedRoutes.filter((route) => routeMatches(route, ["airport"]));
  const intercityRoutes = routes.filter((route) => route.mode === "QUOTE");

  const [mode, setMode] = useState<MarketMode>("ride");
  const [pickupLabel, setPickupLabel] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState<LocationCoordinates | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<LocationCoordinates | null>(null);
  const [pickupCountryCode, setPickupCountryCode] = useState("");
  const [destinationCountryCode, setDestinationCountryCode] = useState("");
  const [selectedVehicleSlug, setSelectedVehicleSlug] = useState(vehicles[0]?.slug ?? "");
  const [selectedHourlyPackage, setSelectedHourlyPackage] = useState<string>(hourlyPackages[0].id);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationCollections[0].id);
  const [returnTrip, setReturnTrip] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [offerQuote, setOfferQuote] = useState<TransferPricingQuote | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [heroMessage, setHeroMessage] = useState("");

  const activeVehicle = vehicles.find((vehicle) => vehicle.slug === selectedVehicleSlug) ?? vehicles[0] ?? null;
  const selectedLocationPanel =
    locationCollections.find((collection) => collection.id === selectedLocation) ?? locationCollections[0];

  const quickRoutes =
    mode === "airport"
      ? airportRoutes.slice(0, 3)
      : mode === "intercity"
        ? intercityRoutes.slice(0, 3)
        : fixedRoutes.slice(0, 3);

  const directionsUrl =
    pickupLabel.trim() && destinationLabel.trim()
      ? buildDirectionsUrl(pickupLabel, destinationLabel, pickupCoordinates, destinationCoordinates)
      : null;

  useEffect(() => {
    if (!pickupDate) {
      setPickupDate(defaultPickupDate());
    }

    if (!pickupTime) {
      setPickupTime(defaultPickupTime());
    }
  }, [pickupDate, pickupTime]);

  useEffect(() => {
    router.prefetch("/book");
    router.prefetch("/quotes");
  }, [router]);

  function setRouteShortcut(route: RouteCard) {
    setHeroMessage("");
    setOfferQuote(null);
    setPickupLabel(route.origin);
    setDestinationLabel(route.destination);
    setPickupCoordinates(null);
    setDestinationCoordinates(null);
    setPickupCountryCode("");
    setDestinationCountryCode("");
  }

  function swapLocations() {
    setPickupLabel(destinationLabel);
    setDestinationLabel(pickupLabel);
    setPickupCoordinates(destinationCoordinates);
    setDestinationCoordinates(pickupCoordinates);
    setPickupCountryCode(destinationCountryCode);
    setDestinationCountryCode(pickupCountryCode);
    setOfferQuote(null);
    setHeroMessage("");
  }

  async function navigateFromHero() {
    if (!pickupLabel.trim() || !destinationLabel.trim()) {
      setHeroMessage("Choose both pickup and drop-off points before continuing.");
      return;
    }

    setHeroMessage("");

    if (mode === "hourly") {
      const packageLabel =
        hourlyPackages.find((item) => item.id === selectedHourlyPackage)?.label ?? hourlyPackages[0].label;
      const params = new URLSearchParams({
        pickup: pickupLabel,
        destination: destinationLabel,
        routeSummary: `${pickupLabel} to ${destinationLabel} | ${packageLabel}`,
        requestedVehicle: activeVehicle?.name ?? "Preferred vehicle"
      });

      if (pickupCoordinates) {
        params.set("pickupCoordinates", `${pickupCoordinates.lat.toFixed(6)},${pickupCoordinates.lng.toFixed(6)}`);
      }

      if (destinationCoordinates) {
        params.set(
          "destinationCoordinates",
          `${destinationCoordinates.lat.toFixed(6)},${destinationCoordinates.lng.toFixed(6)}`
        );
      }

      router.push(`/quotes?${params.toString()}` as Route);
      return;
    }

    if (!pickupCoordinates || !destinationCoordinates || !pickupDate || !pickupTime) {
      setHeroMessage("Pick both points and a pickup time before booking.");
      return;
    }

    setOfferBusy(true);
    setOfferQuote(null);

    try {
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pickupCoordinates,
          destinationCoordinates,
          pickupCountryCode,
          destinationCountryCode,
          returnTrip,
          pickupAt: new Date(`${pickupDate}T${pickupTime}`).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("We could not lock a fare for this route.");
      }

      const payload = (await response.json()) as TransferPricingQuote;
      setOfferQuote(payload);
    } catch (error) {
      setHeroMessage(error instanceof Error ? error.message : "We could not lock a fare for this route.");
    } finally {
      setOfferBusy(false);
    }
  }

  return (
    <>
      <section className="hero-map premium-hero relative isolate overflow-hidden border-b border-white/10 text-cloud">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_110%,rgba(0,0,0,0.55),transparent_38%)]" />
        <div className="premium-route-line" aria-hidden="true" />
        <div className="premium-glow premium-glow-left" aria-hidden="true" />
        <div className="premium-glow premium-glow-right" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8 md:pb-20 md:pt-10">
          <div className="premium-reveal flex justify-center">
            <div className="glass-panel-dark liquid-outline grid w-full max-w-[22rem] grid-cols-2 gap-2 rounded-[2rem] p-2 md:inline-flex md:w-auto md:max-w-none md:flex-wrap md:items-center md:justify-center md:gap-2 md:rounded-full md:p-1.5">
              {[
                { id: "ride", label: "Ride", icon: CarFront },
                { id: "airport", label: "Airport", icon: PlaneTakeoff },
                { id: "intercity", label: "Intercity", icon: MapPinned },
                { id: "hourly", label: "Per hour", icon: Clock3 }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setHeroMessage("");
                      setOfferQuote(null);
                      startTransition(() => setMode(item.id as MarketMode));
                    }}
                    className={cn(
                      "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition md:min-h-[3.15rem] md:px-5",
                      mode === item.id
                        ? "border-white/80 bg-[#f7f2ea] text-[#102133] shadow-[0_14px_30px_rgba(8,20,38,0.24)]"
                        : "border-transparent text-[#f6efe4] hover:border-white/12 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="premium-reveal premium-delay-1 mx-auto mt-7 max-w-3xl text-center md:mt-12 md:max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-copper md:text-sm md:tracking-[0.34em]">
              Book directly with {brand.name}
            </p>
            <h1 className="text-balance mx-auto mt-4 max-w-[12ch] font-display text-[2.65rem] leading-[0.94] sm:text-[3.35rem] md:mt-6 md:max-w-none md:text-[5.45rem] md:leading-[0.9]">
              Private journeys, personally driven.
            </h1>
            <p className="mx-auto mt-4 max-w-[38rem] text-[1rem] leading-7 text-cloud/74 md:mt-6 md:max-w-3xl md:text-lg md:leading-8">
              {modeCopy[mode].title} Choose any pickup and destination, then lock the fare before you travel.
            </p>
            <div className="mt-5 hidden items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-cloud/82 sm:flex">
              <span className="premium-trust-pill"><ShieldCheck className="h-4 w-4 text-copper" /> Locked fares</span>
              <span className="premium-trust-pill"><MessageCircleMore className="h-4 w-4 text-copper" /> Direct contact</span>
              <span className="premium-trust-pill"><Sparkles className="h-4 w-4 text-copper" /> Personal service</span>
            </div>
          </div>

          <div className="premium-reveal premium-delay-2 mx-auto mt-7 max-w-5xl md:mt-9">
            <div className="premium-booking-shell glass-panel-strong liquid-outline rounded-[1.8rem] p-3 text-ink md:rounded-[2rem] md:p-4">
              <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr] md:gap-3 md:items-center">
                <div className="min-w-0 pb-3 md:pb-0">
                  <LocationField
                    value={pickupLabel}
                    onValueChange={(value) => {
                      setPickupLabel(value);
                      setOfferQuote(null);
                    }}
                    coordinates={pickupCoordinates}
                    onCoordinatesChange={(value) => {
                      setPickupCoordinates(value);
                      setOfferQuote(null);
                    }}
                    countryCode={pickupCountryCode}
                    onCountryCodeChange={setPickupCountryCode}
                    placeholder={modeCopy[mode].pickupPlaceholder}
                    enableCurrentLocation
                    compact
                  />
                </div>

                <button
                  type="button"
                  onClick={swapLocations}
                  className="glass-panel relative z-10 -my-1 mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-slate transition hover:text-ink md:my-0 md:h-11 md:w-11"
                  aria-label="Swap pickup and destination"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0 border-t border-slate/10 pt-4 md:border-t-0 md:pt-0">
                  <LocationField
                    value={destinationLabel}
                    onValueChange={(value) => {
                      setDestinationLabel(value);
                      setOfferQuote(null);
                    }}
                    coordinates={destinationCoordinates}
                    onCoordinatesChange={(value) => {
                      setDestinationCoordinates(value);
                      setOfferQuote(null);
                    }}
                    countryCode={destinationCountryCode}
                    onCountryCodeChange={setDestinationCountryCode}
                    placeholder={modeCopy[mode].destinationPlaceholder}
                    compact
                  />
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 grid gap-2 border-t border-slate/10 pt-3 md:gap-3 md:items-center",
                  mode === "hourly" || vehicles.length > 1
                    ? "md:grid-cols-[150px_130px_180px_auto]"
                    : "md:grid-cols-[150px_130px_auto]"
                )}
              >
                <div className="min-w-0">
                  <label className="glass-panel relative flex h-12 min-w-0 items-center justify-center overflow-hidden rounded-[1.15rem] px-4 text-sm text-ink md:hidden">
                    <span className="pointer-events-none truncate text-center">
                      {formatHeroPickupDate(pickupDate)}
                    </span>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(event) => {
                        setPickupDate(event.target.value);
                        setOfferQuote(null);
                      }}
                      aria-label="Pickup date"
                      className="absolute inset-0 h-full w-full min-w-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(event) => {
                      setPickupDate(event.target.value);
                      setOfferQuote(null);
                    }}
                    aria-label="Pickup date"
                    className="hidden h-12 min-w-0 max-w-full rounded-[1.15rem] px-4 text-sm md:block md:h-auto md:rounded-[1.3rem]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="glass-panel relative flex h-12 min-w-0 items-center justify-center overflow-hidden rounded-[1.15rem] px-4 text-sm text-ink md:hidden">
                    <span className="pointer-events-none truncate text-center">
                      {formatHeroPickupTime(pickupTime)}
                    </span>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(event) => {
                        setPickupTime(event.target.value);
                        setOfferQuote(null);
                      }}
                      aria-label="Pickup time"
                      className="absolute inset-0 h-full w-full min-w-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <Input
                    type="time"
                    value={pickupTime}
                    onChange={(event) => {
                      setPickupTime(event.target.value);
                      setOfferQuote(null);
                    }}
                    aria-label="Pickup time"
                    className="hidden h-12 min-w-0 max-w-full rounded-[1.15rem] px-4 text-sm md:block md:h-auto md:rounded-[1.3rem]"
                  />
                </div>

                {mode === "hourly" || vehicles.length > 1 ? (
                  <div className="grid gap-2 md:gap-3 md:grid-cols-1">
                    {mode === "hourly" ? (
                      <Select
                        value={selectedHourlyPackage}
                        onChange={(event) => setSelectedHourlyPackage(event.target.value)}
                        className="h-12 rounded-[1.15rem] px-4 text-sm md:h-auto md:rounded-[1.3rem]"
                      >
                        {hourlyPackages.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    ) : null}

                    {vehicles.length > 1 ? (
                      <Select
                        value={selectedVehicleSlug}
                        onChange={(event) => {
                          setSelectedVehicleSlug(event.target.value);
                          setOfferQuote(null);
                        }}
                        className="h-12 rounded-[1.15rem] px-4 text-sm md:h-auto md:rounded-[1.3rem]"
                      >
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.slug}>
                            {vehicle.name}
                          </option>
                        ))}
                      </Select>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  type="button"
                  onClick={() => startTransition(() => void navigateFromHero())}
                  className="premium-cta h-12 w-full border-0 bg-[#1f7f62] px-6 text-white shadow-[0_24px_70px_rgba(18,79,63,0.32)] hover:bg-[#17664f] md:h-11 md:w-fit md:min-w-[11rem] md:justify-center"
                >
                  {offerBusy ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Locking fare
                    </>
                  ) : mode === "hourly" ? (
                    "Request hourly quote"
                  ) : (
                    "Lock fare"
                  )}
                </Button>
              </div>

              {mode !== "hourly" ? (
                <div className="mt-3 grid gap-2 border-t border-slate/10 pt-3 md:grid-cols-2 md:gap-3">
                  <label className="glass-panel flex items-start gap-3 rounded-[1.2rem] px-4 py-3 text-sm text-slate md:rounded-[1.4rem]">
                    <input
                      type="checkbox"
                      checked={returnTrip}
                      onChange={(event) => {
                        setReturnTrip(event.target.checked);
                        setOfferQuote(null);
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate/30 text-copper focus:ring-copper"
                    />
                    <span>
                      <span className="block font-medium text-ink">Return trip</span>
                      Apply a 10% discount when the one-way ride is above 50 km.
                    </span>
                  </label>

                  <div className="glass-panel flex items-start gap-3 rounded-[1.2rem] px-4 py-3 text-sm text-slate md:rounded-[1.4rem]">
                    <Clock3 className="mt-1 h-4 w-4 text-copper" />
                    <span>
                      <span className="block font-medium text-ink">Automatic urgent fee</span>
                      Pickup within 35 minutes adds 15% automatically after you choose the time.
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex flex-col gap-2 border-t border-slate/10 pt-3 text-[11px] uppercase tracking-[0.16em] text-slate md:flex-row md:flex-wrap md:items-center md:gap-3 md:text-xs">
                <span>
                  {offerQuote && offerQuote.total !== null
                    ? `Locked fare ready from ${formatCurrency(offerQuote.total)}`
                    : mode === "hourly"
                      ? hourlyPackages.find((item) => item.id === selectedHourlyPackage)?.summary
                      : "Tap Lock fare to price this route against the active km slab"}
                </span>
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-ink underline"
                  >
                    Preview in maps
                  </a>
                ) : null}
              </div>

              {offerQuote && mode !== "hourly" ? (
                <div className="glass-panel mt-3 rounded-[1.5rem] p-4 md:mt-4 md:rounded-[1.7rem] md:p-5">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate">Distance</p>
                      <p className="mt-2 text-xl font-semibold text-ink md:text-2xl">{offerQuote.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate">Tier</p>
                      <p className="mt-2 text-xl font-semibold text-ink md:text-2xl">{offerQuote.tierLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate">Rule set</p>
                      <p className="mt-2 text-xl font-semibold text-ink md:text-2xl">{offerQuote.region}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate">Total</p>
                      <p className="mt-2 text-xl font-semibold text-ink md:text-2xl">
                        {offerQuote.total !== null ? formatCurrency(offerQuote.total) : "Contact admin"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate md:grid-cols-2">
                    <p className="glass-panel flex items-center justify-between gap-4 rounded-[1rem] px-4 py-3 md:rounded-full md:py-2">
                      <span>One-way fare</span>
                      <span>{offerQuote.oneWaySubtotal !== null ? formatCurrency(offerQuote.oneWaySubtotal) : "Manual"}</span>
                    </p>
                    <p className="glass-panel flex items-center justify-between gap-4 rounded-[1rem] px-4 py-3 md:rounded-full md:py-2">
                      <span>Round-trip discount</span>
                      <span>
                        {offerQuote.roundTripDiscount > 0
                          ? `-${formatCurrency(offerQuote.roundTripDiscount)}`
                          : "Not applied"}
                      </span>
                    </p>
                    <p className="glass-panel flex items-center justify-between gap-4 rounded-[1rem] px-4 py-3 md:rounded-full md:py-2">
                      <span>Urgent surcharge</span>
                      <span>
                        {offerQuote.urgentSurcharge > 0
                          ? formatCurrency(offerQuote.urgentSurcharge)
                          : "Not applied"}
                      </span>
                    </p>
                    <p className="glass-panel flex items-center justify-between gap-4 rounded-[1rem] px-4 py-3 md:rounded-full md:py-2">
                      <span>Distance source</span>
                      <span>{offerQuote.distanceSource === "routing" ? "Road route" : "Estimated"}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate">
                      {offerQuote.contactReason ??
                        "This fare is locked for checkout and follows the CAD km slab, return-trip discount, and automatic urgent rule."}
                    </p>
                    {offerQuote.pricingMode === "CONTACT" ? (
                      <Button
                        type="button"
                        onClick={() =>
                          router.push(
                            buildAdminHelpUrl({
                              pickupLabel,
                              destinationLabel,
                              pickupCoordinates,
                              destinationCoordinates
                            }) as Route
                          )
                        }
                      >
                        Contact admin
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() =>
                          router.push(
                            buildBookingUrl({
                              pickupLabel,
                              destinationLabel,
                              pickupCoordinates,
                              destinationCoordinates,
                              pickupCountryCode,
                              destinationCountryCode,
                              vehicleSlug: activeVehicle?.slug ?? vehicles[0]?.slug ?? "",
                              returnTrip,
                              pickupDate,
                              pickupTime,
                              offerToken: offerQuote.offerToken
                            }) as Route
                          )
                        }
                      >
                        Continue booking
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}

              {heroMessage ? <p className="mt-3 text-sm text-amber-700">{heroMessage}</p> : null}
            </div>

              <div className="mt-4 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:items-center md:justify-center md:overflow-visible">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-cloud/62 md:text-xs md:tracking-[0.26em]">
                  Popular shortcuts
                </span>
              {quickRoutes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setRouteShortcut(route)}
                  className="glass-panel-dark whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-cloud transition hover:bg-white/16"
                >
                  {route.origin} to {route.destination}
                </button>
              ))}
            </div>
          </div>

          <p className="premium-reveal premium-delay-3 mx-auto mt-6 max-w-3xl text-center text-base leading-7 text-cloud/84 md:mt-8 md:max-w-4xl md:text-xl md:leading-relaxed md:text-cloud/86">
            No marketplace handoffs. One accountable service from pickup planning to arrival.
          </p>

          <div className="mx-auto mt-5 grid max-w-5xl gap-2 sm:grid-cols-2 md:mt-6 md:flex md:flex-wrap md:items-center md:justify-center md:gap-3">
            {marketplaceAdvantages.map((advantage) => (
              <div key={advantage} className="premium-mini-card glass-panel whitespace-nowrap rounded-full px-4 py-2 text-center text-sm text-ink">
                {advantage}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="offers" className="premium-section deferred-section mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Served routes</p>
            <h2 className="mt-3 font-display text-[2.35rem] leading-[0.98] text-ink md:text-5xl md:leading-none">
              Signature routes, delivered with local care.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {trustStats.map((item) => (
              <div key={item.label} className="glass-panel rounded-[1.4rem] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-ink md:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {offerHighlights.map((offer) => (
            <Link
              key={offer.title}
              href={offer.href}
              className="premium-card glass-panel flex flex-col rounded-[1.7rem] p-5 md:rounded-[2rem] md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">{offer.eyebrow}</p>
                <span className="glass-panel rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                  {offer.priceFrom > 0 ? `From ${formatCurrency(offer.priceFrom)}` : "Admin quote"}
                </span>
              </div>
              <h3 className="mt-4 text-[1.85rem] font-semibold leading-tight text-ink md:text-3xl">{offer.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate">{offer.copy}</p>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate/10 pt-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate">Base fare</p>
                  <p className="mt-2 text-xl font-semibold text-ink md:text-2xl">
                    {offer.priceFrom > 0 ? formatCurrency(offer.priceFrom) : "Admin quote"}
                  </p>
                </div>
                <span className="glass-panel rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                  View route
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="destinations" className="premium-section deferred-section mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="section-surface px-5 py-7 md:px-10 md:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Popular locations</p>
              <h2 className="mt-3 font-display text-[2.2rem] leading-[0.98] text-ink md:text-5xl md:leading-none">
                Begin with where you are going.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate">
                Explore popular journeys, or enter any address for a route planned around you.
              </p>
            </div>
            <Link href="/routes" className="text-sm font-semibold uppercase tracking-[0.18em] text-ink underline">
              Open all routes
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-8">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-3">
              {locationCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => startTransition(() => setSelectedLocation(collection.id))}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] transition lg:px-5 lg:py-3 lg:text-left lg:tracking-[0.14em] ${
                    selectedLocation === collection.id
                      ? "glass-panel-dark text-cloud"
                      : "glass-panel text-slate hover:text-ink"
                  }`}
                >
                  {collection.label}
                </button>
              ))}
            </div>

            <div className="glass-panel rounded-[1.7rem] p-5 md:rounded-[2rem] md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">
                {selectedLocationPanel.headline}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate">
                {selectedLocationPanel.description}
              </p>

              <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2">
                {selectedLocationPanel.routes.map((route) => (
                  <Link
                    key={`${route.origin}-${route.destination}`}
                    href={route.href}
                    className="premium-card glass-panel rounded-[1.45rem] p-4 md:rounded-[1.7rem] md:p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate">From</p>
                    <p className="mt-1 text-lg font-semibold text-ink md:text-xl">{route.origin}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate">To</p>
                    <p className="mt-1 text-lg font-semibold text-ink md:text-xl">{route.destination}</p>
                    <p className="mt-4 text-sm leading-7 text-slate">{route.note}</p>
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate/10 pt-4">
                      <span className="text-sm font-semibold text-ink">
                        {route.priceFrom > 0 ? formatCurrency(route.priceFrom) : "Request quote"}
                      </span>
                      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink underline">
                        Open
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="classes" className="premium-section deferred-section mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Vehicle classes</p>
            <h2 className="mt-3 font-display text-[2.2rem] leading-[0.98] text-ink md:text-5xl md:leading-none">
              A calm cabin for every kind of journey.
            </h2>
          </div>
          <Link href="/fleet" className="text-sm font-semibold uppercase tracking-[0.18em] text-ink underline">
            View fleet
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="premium-card glass-panel rounded-[1.65rem] p-5 md:rounded-[2rem] md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">{vehicle.classLabel}</p>
              <h3 className="mt-4 text-[1.9rem] font-semibold leading-tight text-ink md:text-3xl">{vehicle.name}</h3>
              <p className="mt-4 text-sm leading-7 text-slate">{vehicle.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate">
                <span>{vehicle.seats} seats</span>
                <span>{vehicle.luggage} bags</span>
                <span>From {formatCurrency(vehicle.priceFrom)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section deferred-section mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="section-surface px-5 py-7 md:px-10 md:py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-copper">Traveler reviews</p>
            <h2 className="mt-3 font-display text-[2.2rem] leading-[0.98] text-ink md:text-5xl md:leading-none">
              Service remembered for the right reasons.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:mt-10 md:gap-5 lg:grid-cols-3">
            {travelerReviews.map((review) => (
              <article key={review.name} className="premium-card glass-panel rounded-[1.65rem] p-5 md:rounded-[2rem] md:p-6">
                <p className="text-sm leading-8 text-ink">“{review.quote}”</p>
                <div className="mt-6 border-t border-slate/10 pt-4">
                  <p className="font-semibold text-ink">{review.name}</p>
                  <p className="mt-1 text-sm text-slate">{review.trip}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
