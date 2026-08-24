"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  CarFront,
  Clock3,
  ShieldCheck,
  TimerReset
} from "lucide-react";

import { createBookingAction } from "@/app/actions";
import { LocationField } from "@/components/location/location-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneField } from "@/components/ui/phone-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { parseCoordinatesString } from "@/lib/pricing";
import type { FleetVehicle, LocationCoordinates, TransferPricingQuote } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BookingWizardProps {
  vehicles: FleetVehicle[];
  initialVehicleSlug?: string;
  initialPickupAddress?: string;
  initialDestinationAddress?: string;
  initialPickupCoordinates?: string;
  initialDestinationCoordinates?: string;
  initialPickupCountryCode?: string;
  initialDestinationCountryCode?: string;
  initialRouteSlug?: string;
  initialReturnTrip?: boolean;
  initialPickupDate?: string;
  initialPickupTime?: string;
  initialOfferToken?: string;
}

type BookingStep = "fare-lock" | "details";

function defaultPickupDate() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

function defaultPickupTime() {
  return new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5);
}

function buildAdminHelpHref(params: {
  pickupAddress: string;
  destinationAddress: string;
  pickupCoordinates: LocationCoordinates | null;
  destinationCoordinates: LocationCoordinates | null;
}) {
  const search = new URLSearchParams({
    pickup: params.pickupAddress,
    destination: params.destinationAddress,
    routeSummary: `${params.pickupAddress} to ${params.destinationAddress}`,
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

function buildRouteSignature(params: {
  pickupAddress: string;
  destinationAddress: string;
  pickupCoordinates: LocationCoordinates | null;
  destinationCoordinates: LocationCoordinates | null;
  pickupCountryCode: string;
  destinationCountryCode: string;
  pickupDate: string;
  pickupTime: string;
  vehicleSlug: string;
  returnTrip: boolean;
}) {
  return JSON.stringify({
    pickupAddress: params.pickupAddress.trim(),
    destinationAddress: params.destinationAddress.trim(),
    pickupCoordinates: params.pickupCoordinates,
    destinationCoordinates: params.destinationCoordinates,
    pickupCountryCode: params.pickupCountryCode,
    destinationCountryCode: params.destinationCountryCode,
    pickupDate: params.pickupDate,
    pickupTime: params.pickupTime,
    vehicleSlug: params.vehicleSlug,
    returnTrip: params.returnTrip
  });
}

export function BookingWizard({
  vehicles,
  initialVehicleSlug,
  initialPickupAddress,
  initialDestinationAddress,
  initialPickupCoordinates,
  initialDestinationCoordinates,
  initialPickupCountryCode,
  initialDestinationCountryCode,
  initialRouteSlug,
  initialReturnTrip,
  initialPickupDate,
  initialPickupTime,
  initialOfferToken
}: BookingWizardProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createBookingAction, initialActionState);
  const initialRouteSignature = buildRouteSignature({
    pickupAddress: initialPickupAddress ?? "",
    destinationAddress: initialDestinationAddress ?? "",
    pickupCoordinates: parseCoordinatesString(initialPickupCoordinates),
    destinationCoordinates: parseCoordinatesString(initialDestinationCoordinates),
    pickupCountryCode: initialPickupCountryCode ?? "",
    destinationCountryCode: initialDestinationCountryCode ?? "",
    pickupDate: initialPickupDate ?? "",
    pickupTime: initialPickupTime ?? "",
    vehicleSlug:
      vehicles.find((vehicle) => vehicle.slug === initialVehicleSlug)?.slug ??
      vehicles[0]?.slug ??
      "",
    returnTrip: initialReturnTrip ?? false
  });
  const [step, setStep] = useState<BookingStep>(initialOfferToken ? "details" : "fare-lock");
  const [vehicleSlug, setVehicleSlug] = useState(
    vehicles.find((vehicle) => vehicle.slug === initialVehicleSlug)?.slug ??
      vehicles[0]?.slug ??
      ""
  );
  const [pickupAddress, setPickupAddress] = useState(initialPickupAddress ?? "");
  const [destinationAddress, setDestinationAddress] = useState(
    initialDestinationAddress ?? ""
  );
  const [pickupCoordinates, setPickupCoordinates] = useState<LocationCoordinates | null>(
    parseCoordinatesString(initialPickupCoordinates)
  );
  const [destinationCoordinates, setDestinationCoordinates] =
    useState<LocationCoordinates | null>(
      parseCoordinatesString(initialDestinationCoordinates)
    );
  const [pickupCountryCode, setPickupCountryCode] = useState(
    initialPickupCountryCode ?? ""
  );
  const [destinationCountryCode, setDestinationCountryCode] = useState(
    initialDestinationCountryCode ?? ""
  );
  const [returnTrip, setReturnTrip] = useState(initialReturnTrip ?? false);
  const [pickupDate, setPickupDate] = useState(initialPickupDate ?? "");
  const [pickupTime, setPickupTime] = useState(initialPickupTime ?? "");
  const [pickupAtIso, setPickupAtIso] = useState("");
  const [priceOfferToken, setPriceOfferToken] = useState(initialOfferToken ?? "");
  const [meetAndGreet, setMeetAndGreet] = useState(false);
  const [pricing, setPricing] = useState<TransferPricingQuote | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState("");
  const [lockedRouteSignature, setLockedRouteSignature] = useState<string | null>(
    initialOfferToken ? initialRouteSignature : null
  );

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.slug === vehicleSlug) ?? vehicles[0] ?? null;

  useEffect(() => {
    if (!initialPickupDate && !pickupDate) {
      setPickupDate(defaultPickupDate());
    }

    if (!initialPickupTime && !pickupTime) {
      setPickupTime(defaultPickupTime());
    }
  }, [initialPickupDate, initialPickupTime, pickupDate, pickupTime]);

  useEffect(() => {
    router.prefetch("/quotes");
  }, [router]);

  const currentRouteSignature = useMemo(
    () =>
      buildRouteSignature({
        pickupAddress,
        destinationAddress,
        pickupCoordinates,
        destinationCoordinates,
        pickupCountryCode,
        destinationCountryCode,
        pickupDate,
        pickupTime,
        vehicleSlug,
        returnTrip
      }),
    [
      destinationAddress,
      destinationCoordinates,
      destinationCountryCode,
      pickupAddress,
      pickupCoordinates,
      pickupCountryCode,
      pickupDate,
      pickupTime,
      returnTrip,
      vehicleSlug
    ]
  );

  useEffect(() => {
    if (!pickupCoordinates || !destinationCoordinates || !pickupDate || !pickupTime) {
      setPricing(null);
      setPickupAtIso("");
      setPriceOfferToken("");
      setPricingError("Choose both locations and pickup time to calculate the locked fare.");
      setPricingLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadPricing() {
      try {
        setPricingLoading(true);
        setPricingError("");

        const nextPickupAt = new Date(`${pickupDate}T${pickupTime}`).toISOString();
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
            pickupAt: nextPickupAt
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Pricing request failed");
        }

        const payload = (await response.json()) as TransferPricingQuote;
        setPricing(payload);
        setPriceOfferToken(payload.offerToken ?? "");
        setPickupAtIso(payload.pickupAt ?? nextPickupAt);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPricing(null);
        setPickupAtIso("");
        setPriceOfferToken("");
        setPricingError(
          error instanceof Error ? error.message : "We could not calculate the live fare."
        );
      } finally {
        if (!controller.signal.aborted) {
          setPricingLoading(false);
        }
      }
    }

    void loadPricing();

    return () => controller.abort();
  }, [
    destinationCoordinates,
    destinationCountryCode,
    pickupCoordinates,
    pickupCountryCode,
    pickupDate,
    pickupTime,
    returnTrip
  ]);

  const adminHelpHref = useMemo(
    () =>
      buildAdminHelpHref({
        pickupAddress,
        destinationAddress,
        pickupCoordinates,
        destinationCoordinates
      }),
    [destinationAddress, destinationCoordinates, pickupAddress, pickupCoordinates]
  );

  const canCreateBooking =
    Boolean(pricing && pricing.pricingMode === "INSTANT" && pricing.total !== null) &&
    Boolean(priceOfferToken) &&
    Boolean(pickupAtIso) &&
    !pricingLoading &&
    !pending;

  const fareReady =
    Boolean(pricing && pricing.pricingMode === "INSTANT" && pricing.total !== null) &&
    Boolean(priceOfferToken) &&
    Boolean(pickupAtIso) &&
    !pricingLoading;
  const fareLocked = fareReady && lockedRouteSignature === currentRouteSignature;

  const contactOnlyReady = Boolean(pricing && pricing.pricingMode === "CONTACT") && !pricingLoading;

  const canAdvanceFromFareLock = fareReady || contactOnlyReady;

  function handleSwapLocations() {
    setPickupAddress(destinationAddress);
    setDestinationAddress(pickupAddress);
    setPickupCoordinates(destinationCoordinates);
    setDestinationCoordinates(pickupCoordinates);
    setPickupCountryCode(destinationCountryCode);
    setDestinationCountryCode(pickupCountryCode);
  }

  function handleFareStepAction() {
    if (contactOnlyReady) {
      router.push(adminHelpHref as Route);
      return;
    }

    if (!fareReady) {
      return;
    }

    if (!fareLocked) {
      setLockedRouteSignature(currentRouteSignature);
      return;
    }

    if (fareLocked) {
      setStep("details");
    }
  }

  const fareStepButtonLabel = pricingLoading
    ? "Locking fare..."
    : pricing?.pricingMode === "CONTACT"
      ? "Contact admin"
      : fareLocked
        ? "Continue booking"
        : "Lock fare";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <form
        action={formAction}
        className="page-card space-y-6 rounded-[2.2rem] p-4 md:p-6"
      >
        <input type="hidden" name="routeSlug" value={initialRouteSlug ?? ""} />
        <input type="hidden" name="priceOfferToken" value={priceOfferToken} />
        <input type="hidden" name="pickupAtIso" value={pickupAtIso} />
        <input type="hidden" name="pickupDate" value={pickupDate} />
        <input type="hidden" name="pickupTime" value={pickupTime} />
        <input type="hidden" name="vehicleSlug" value={vehicleSlug} />
        <input type="hidden" name="pickupAddress" value={pickupAddress} />
        <input type="hidden" name="destinationAddress" value={destinationAddress} />
        <input
          type="hidden"
          name="pickupCoordinates"
          value={pickupCoordinates ? `${pickupCoordinates.lat.toFixed(6)},${pickupCoordinates.lng.toFixed(6)}` : ""}
        />
        <input
          type="hidden"
          name="destinationCoordinates"
          value={
            destinationCoordinates
              ? `${destinationCoordinates.lat.toFixed(6)},${destinationCoordinates.lng.toFixed(6)}`
              : ""
          }
        />
        <input type="hidden" name="pickupCountryCode" value={pickupCountryCode} />
        <input type="hidden" name="destinationCountryCode" value={destinationCountryCode} />
        <input type="hidden" name="returnTrip" value={String(returnTrip)} />

        {step === "fare-lock" ? (
          <section className="page-card-subtle rounded-[2rem] p-4 md:p-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-copper">
                    Fare lock
                  </p>
                  <h2 className="mt-2 font-display text-3xl leading-none text-ink md:text-[2.65rem]">
                    Choose your exact route with less friction.
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate">
                  Search freely, use current location, or drop a map pin. The route stays flexible,
                  but the fare is priced against the active CAD distance slab.
                </p>
              </div>

              <div className="relative z-30 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
                <div className="glass-panel relative z-20 rounded-[1.8rem] px-4 py-3 focus-within:z-[80]">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate/70">
                    Pickup
                  </p>
                  <LocationField
                    value={pickupAddress}
                    onValueChange={setPickupAddress}
                    coordinates={pickupCoordinates}
                    onCoordinatesChange={setPickupCoordinates}
                    countryCode={pickupCountryCode}
                    onCountryCodeChange={setPickupCountryCode}
                    placeholder="From: any address, airport, hotel, or place"
                    enableCurrentLocation
                    compact
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="glass-panel mx-auto flex h-14 w-14 items-center justify-center rounded-full text-slate transition hover:text-ink"
                  aria-label="Swap pickup and drop-off"
                >
                  <ArrowRightLeft className="h-5 w-5" />
                </button>

                <div className="glass-panel relative z-10 rounded-[1.8rem] px-4 py-3 focus-within:z-[80]">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate/70">
                    Drop-off
                  </p>
                  <LocationField
                    value={destinationAddress}
                    onValueChange={setDestinationAddress}
                    coordinates={destinationCoordinates}
                    onCoordinatesChange={setDestinationCoordinates}
                    countryCode={destinationCountryCode}
                    onCountryCodeChange={setDestinationCountryCode}
                    placeholder="To: any address, airport, hotel, or place"
                    compact
                  />
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,0.62fr)_minmax(0,0.92fr)_auto]">
                <label className="glass-panel rounded-[1.65rem] px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate/70">
                    Pickup date
                  </span>
                  <span className="mt-2 flex items-center gap-3">
                    <Input
                      type="date"
                      value={pickupDate}
                      onChange={(event) => setPickupDate(event.target.value)}
                      className="rounded-none border-0 bg-transparent px-0 py-0 text-lg shadow-none focus:ring-0"
                      required
                    />
                    <CalendarDays className="h-5 w-5 shrink-0 text-ink" />
                  </span>
                </label>

                <label className="glass-panel rounded-[1.65rem] px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate/70">
                    Pickup time
                  </span>
                  <span className="mt-2 flex items-center gap-3">
                    <Input
                      type="time"
                      value={pickupTime}
                      onChange={(event) => setPickupTime(event.target.value)}
                      className="rounded-none border-0 bg-transparent px-0 py-0 text-lg shadow-none focus:ring-0"
                      required
                    />
                    <Clock3 className="h-5 w-5 shrink-0 text-ink" />
                  </span>
                </label>

                <label className="glass-panel rounded-[1.65rem] px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate/70">
                    {vehicles.length > 1 ? "Vehicle request" : "Vehicle"}
                  </span>
                  {vehicles.length > 1 ? (
                    <span className="mt-2 flex items-center gap-3">
                      <Select
                        value={vehicleSlug}
                        onChange={(event) => setVehicleSlug(event.target.value)}
                        className="rounded-none border-0 bg-transparent px-0 py-0 text-lg shadow-none focus:ring-0"
                      >
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.slug}>
                            {vehicle.name}
                          </option>
                        ))}
                      </Select>
                      <CarFront className="h-5 w-5 shrink-0 text-ink" />
                    </span>
                  ) : (
                    <>
                      <span className="mt-2 flex items-center gap-3 text-lg text-ink">
                        <span>{selectedVehicle?.name ?? "Transfer Pro vehicle"}</span>
                        <CarFront className="h-5 w-5 shrink-0 text-ink" />
                      </span>
                    </>
                  )}
                </label>

                <Button
                  type="button"
                  disabled={!canAdvanceFromFareLock}
                  onClick={handleFareStepAction}
                  className="min-h-[78px] min-w-[12rem] border-0 bg-[#1f7f62] text-base tracking-[0.14em] text-white shadow-[0_24px_70px_rgba(18,79,63,0.28)] hover:bg-[#17664f]"
                >
                  {fareStepButtonLabel}
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <label className="glass-panel flex items-start gap-4 rounded-[1.7rem] px-5 py-5 text-sm text-slate">
                  <input
                    type="checkbox"
                    checked={returnTrip}
                    onChange={(event) => setReturnTrip(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded-md border-slate/30 text-copper focus:ring-copper"
                  />
                  <span>
                    <span className="block text-lg font-semibold text-ink">Return trip</span>
                    Apply a 10% discount when the one-way ride is above 50 km.
                  </span>
                </label>

                <div className="glass-panel flex items-start gap-4 rounded-[1.7rem] px-5 py-5 text-sm text-slate">
                  <span className="glass-panel flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-copper">
                    <TimerReset className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-ink">
                      Automatic urgent fee
                    </span>
                    Pickup within 35 minutes adds 15% automatically after you choose the time.
                  </span>
                </div>
              </div>

              <div className="border-t border-slate/10 pt-4">
                {fareLocked ? (
                  <p className="rounded-[1.4rem] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
                    Fare locked. Continue to booking to enter passenger details and payment.
                  </p>
                ) : (
                  <p className="text-[11px] uppercase tracking-[0.34em] text-slate/72">
                    Lock the fare first, then continue to passenger and payment details
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="page-card-subtle rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-copper">
                    Locked fare
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    Passenger details, review, and payment.
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate">
                    Your route and price are already locked. If you need to change pickup, drop-off,
                    timing, or vehicle, go back to fare lock first.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="glass-panel rounded-full px-4 py-2 text-sm font-semibold text-ink">
                    {pricing?.total !== null && pricing?.total !== undefined
                      ? formatCurrency(pricing.total)
                      : "Locked fare"}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setStep("fare-lock")}>
                    Back to fare lock
                  </Button>
                </div>
              </div>
            </section>

            <section className="page-card-subtle rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-copper">
                    Passenger details
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    Keep the details simple.
                  </h3>
                </div>
                <p className="max-w-lg text-sm leading-7 text-slate">
                  Guest booking stays first. Accounts are optional, so only ask for what is needed
                  to confirm and fulfill the ride.
                </p>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate">
                  <span className="font-medium text-ink">Passenger name</span>
                  <Input name="name" placeholder="Full name" required />
                </label>
                <label className="space-y-2 text-sm text-slate">
                  <span className="font-medium text-ink">Email</span>
                  <Input type="email" name="email" placeholder="name@example.com" required />
                </label>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate">
                  <span className="font-medium text-ink">Phone</span>
                  <PhoneField required numberPlaceholder="Mobile number" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="space-y-2 text-sm text-slate">
                    <span className="font-medium text-ink">Guests</span>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      name="passengers"
                      defaultValue={2}
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate">
                    <span className="font-medium text-ink">Bags</span>
                    <Input
                      type="number"
                      min={0}
                      max={12}
                      name="luggage"
                      defaultValue={2}
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate">
                    <span className="font-medium text-ink">Seats</span>
                    <Input
                      type="number"
                      min={0}
                      max={6}
                      name="childSeats"
                      defaultValue={0}
                      required
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="page-card-subtle rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-copper">
                    Ride notes
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    Add the operational details.
                  </h3>
                </div>
                <p className="max-w-lg text-sm leading-7 text-slate">
                  Flight numbers, terminal guidance, luggage notes, and payment preferences stay
                  visible for the driver and invoices.
                </p>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                <label className="space-y-2 text-sm text-slate">
                  <span className="font-medium text-ink">Special instructions</span>
                  <Textarea
                    name="notes"
                    placeholder="Flight number, luggage notes, arrival gate instructions, or accessibility requests."
                  />
                </label>

                <div className="grid gap-5">
                  <label className="space-y-2 text-sm text-slate">
                    <span className="font-medium text-ink">Flight number</span>
                    <Input name="flightNumber" placeholder="Optional" />
                  </label>

                  <label className="glass-panel flex items-start gap-3 rounded-[1.5rem] px-4 py-4 text-sm text-slate">
                    <input
                      type="checkbox"
                      name="meetAndGreet"
                      checked={meetAndGreet}
                      onChange={(event) => setMeetAndGreet(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate/30 text-copper focus:ring-copper"
                    />
                    <span>
                      <span className="block font-medium text-ink">Meet-and-greet</span>
                      Airport signboard or terminal pickup help.
                    </span>
                  </label>

                  <label className="space-y-2 text-sm text-slate">
                    <span className="font-medium text-ink">Payment</span>
                    <Select name="paymentMethod" defaultValue="STRIPE">
                      <option value="STRIPE">Pay now by card</option>
                      <option value="PAY_LATER">Pay later</option>
                      <option value="CASH">Cash to driver</option>
                      <option value="BANK_TRANSFER">Bank transfer</option>
                      <option value="INVOICE">Invoice regular customer</option>
                    </Select>
                  </label>
                </div>
              </div>
            </section>

            <div className="page-card-subtle flex flex-col gap-3 rounded-[1.7rem] px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 text-sm text-slate">
                <p className="font-semibold text-ink">Live distance-based checkout</p>
                <p>
                  This locked fare follows the CAD km slab, return discount, and automatic urgent
                  rule.
                </p>
              </div>

              <Button type="submit" disabled={!canCreateBooking}>
                {pending ? "Creating booking..." : "Create booking"}
              </Button>
            </div>
          </>
        )}

        {step === "fare-lock" && pricing?.pricingMode === "CONTACT" ? (
          <div className="page-card-subtle flex flex-col gap-3 rounded-[1.7rem] px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm text-slate">
              <p className="font-semibold text-ink">Direct admin handling required</p>
              <p>
                This route is outside the instant-booking distance range. Use the admin help option
                to request manual confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(adminHelpHref as Route)}
              className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud"
            >
              Contact admin to book
            </button>
          </div>
        ) : null}

        {pricingError || state.message ? (
          <div
            className={`rounded-3xl px-4 py-3 text-sm ${
              state.ok
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-800"
            }`}
          >
            {pricingError ? <p>{pricingError}</p> : null}
            {state.message ? <p>{state.message}</p> : null}
            {state.reference ? (
              <p className="mt-1 font-semibold">Reference: {state.reference}</p>
            ) : null}
            {state.checkoutUrl ? (
              <a
                href={state.checkoutUrl}
                className="mt-3 inline-flex font-semibold text-ink underline"
              >
                Continue to checkout
              </a>
            ) : null}
          </div>
        ) : null}
      </form>

      <aside className="page-card rounded-[2.2rem] p-5 text-ink md:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-copper">
          Fare preview
        </p>
        <div className="mt-6 space-y-6">
          <div>
            <p className="font-display text-4xl leading-none text-ink">
              {pickupAddress ? pickupAddress.split(",")[0] : "Pickup"}{" "}
              <span className="text-copper">to</span>{" "}
              {destinationAddress ? destinationAddress.split(",")[0] : "Drop-off"}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate">
              Enter exact points to calculate the live fare. The selected vehicle stays attached to
              the booking request, but the price follows your distance rules.
            </p>
          </div>

          {pricing ? (
            <div className="glass-panel rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between gap-4 border-b border-slate/8 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate/60">
                    Locked total
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-ink">
                    {pricing.total !== null ? formatCurrency(pricing.total) : "Contact admin"}
                  </p>
                </div>
                <div className="glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
                  {pricing.tierLabel}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="page-card-subtle rounded-[1.4rem] px-4 py-4">
                  <p className="uppercase tracking-[0.16em] text-slate/55">Distance</p>
                  <p className="mt-2 text-xl font-semibold text-ink">{pricing.distanceKm} km</p>
                </div>
                <div className="page-card-subtle rounded-[1.4rem] px-4 py-4">
                  <p className="uppercase tracking-[0.16em] text-slate/55">Vehicle</p>
                  <p className="mt-2 text-xl font-semibold text-ink">
                    {selectedVehicle?.name}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-[1.6rem] p-5 text-sm text-slate">
              Select both locations from search or map pin to unlock the fare breakdown.
            </div>
          )}

          {pricing ? (
            <div className="glass-panel space-y-3 rounded-[1.8rem] p-5 text-sm text-slate">
              <p className="flex items-center justify-between gap-4">
                <span>One-way fare</span>
                <span>
                  {pricing.oneWaySubtotal !== null
                    ? formatCurrency(pricing.oneWaySubtotal)
                    : "Manual"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span>Pickup fee</span>
                <span>
                  {pricing.pickupFee > 0
                    ? formatCurrency(pricing.pickupFee)
                    : "Included"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span>Round-trip discount</span>
                <span>
                  {pricing.roundTripDiscount > 0
                    ? `-${formatCurrency(pricing.roundTripDiscount)}`
                    : "Not applied"}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span>Urgent surcharge</span>
                <span>
                  {pricing.urgentSurcharge > 0
                    ? formatCurrency(pricing.urgentSurcharge)
                    : "Not applied"}
                </span>
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate/55">
                Distance source:{" "}
                {pricing.distanceSource === "routing" ? "Road routing" : "Fallback estimate"}
              </p>
              {pricing.contactReason ? <p className="text-copper">{pricing.contactReason}</p> : null}
            </div>
          ) : null}

          <div className="glass-panel rounded-[1.8rem] p-5 text-sm text-slate">
            <div className="mb-4 flex items-center gap-3">
              <span className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-copper">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">Included with this booking</p>
                <p className="text-sm text-slate">
                  The core service promises stay visible before payment.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedVehicle?.features.map((feature) => (
                <p key={feature} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-copper" />
                  {feature}
                </p>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
