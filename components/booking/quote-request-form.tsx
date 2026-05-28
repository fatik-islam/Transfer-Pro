"use client";

import { useActionState, useMemo, useState } from "react";

import { requestQuoteAction } from "@/app/actions";
import { LocationField } from "@/components/location/location-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneField } from "@/components/ui/phone-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import type { FleetVehicle, LocationCoordinates } from "@/lib/types";

function parseRouteSummary(routeSummary?: string) {
  if (!routeSummary) {
    return {
      pickup: "",
      destination: ""
    };
  }

  const [pickup, ...rest] = routeSummary.split(/\s+to\s+/i);

  return {
    pickup: pickup?.trim() ?? "",
    destination: rest.join(" to ").trim()
  };
}

function parseCoordinates(value?: string): LocationCoordinates | null {
  if (!value) {
    return null;
  }

  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    lat,
    lng
  };
}

export function QuoteRequestForm({
  vehicles,
  initialRouteSummary,
  initialVehicleName,
  initialPickup,
  initialDestination,
  initialPickupCoordinates,
  initialDestinationCoordinates,
  initialNotes
}: {
  vehicles: FleetVehicle[];
  initialRouteSummary?: string;
  initialVehicleName?: string;
  initialPickup?: string;
  initialDestination?: string;
  initialPickupCoordinates?: string;
  initialDestinationCoordinates?: string;
  initialNotes?: string;
}) {
  const [state, formAction, pending] = useActionState(requestQuoteAction, initialActionState);
  const parsedRoute = useMemo(() => parseRouteSummary(initialRouteSummary), [initialRouteSummary]);
  const [pickupLabel, setPickupLabel] = useState(initialPickup ?? parsedRoute.pickup);
  const [destinationLabel, setDestinationLabel] = useState(initialDestination ?? parsedRoute.destination);
  const [pickupCoordinates, setPickupCoordinates] = useState<LocationCoordinates | null>(
    parseCoordinates(initialPickupCoordinates)
  );
  const [destinationCoordinates, setDestinationCoordinates] = useState<LocationCoordinates | null>(
    parseCoordinates(initialDestinationCoordinates)
  );

  const routeSummary =
    pickupLabel && destinationLabel
      ? `${pickupLabel} to ${destinationLabel}`
      : initialRouteSummary ?? "";

  return (
    <form action={formAction} className="grid gap-6 rounded-[2rem] bg-white p-6 shadow-quiet md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Passenger name</span>
          <Input name="name" required placeholder="Full name" />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Email</span>
          <Input type="email" name="email" required placeholder="name@example.com" />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Phone</span>
          <PhoneField required numberPlaceholder="Mobile number" />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Preferred vehicle</span>
          <Select
            name="requestedVehicle"
            defaultValue={
              vehicles.find((vehicle) => vehicle.name === initialVehicleName)?.name ??
              initialVehicleName ??
              vehicles[0]?.name
            }
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.name}>
                {vehicle.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="rounded-[1.75rem] bg-[#f8f5ef] px-4 py-4 text-sm leading-7 text-slate">
        Search any address, airport, hotel, or landmark. You can use current location for pickup or place exact pins for both points on the map.
      </div>

      <input type="hidden" name="routeSummary" value={routeSummary} />

      <div className="grid gap-5 md:grid-cols-2">
        <LocationField
          label="Pickup point"
          value={pickupLabel}
          onValueChange={setPickupLabel}
          coordinates={pickupCoordinates}
          onCoordinatesChange={setPickupCoordinates}
          inputName="pickupLabel"
          coordinatesName="pickupCoordinates"
          placeholder="Search any pickup point"
          description="Use current location, free search, or pin the pickup directly on the map."
          enableCurrentLocation
        />
        <LocationField
          label="Drop-off point"
          value={destinationLabel}
          onValueChange={setDestinationLabel}
          coordinates={destinationCoordinates}
          onCoordinatesChange={setDestinationCoordinates}
          inputName="destinationLabel"
          coordinatesName="destinationCoordinates"
          placeholder="Search any destination"
          description="Search by place name or pin the destination manually."
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Pickup date</span>
          <Input type="date" name="pickupDate" required />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Pickup time</span>
          <Input type="time" name="pickupTime" required />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Guests</span>
          <Input type="number" min={1} max={12} name="passengers" defaultValue={4} required />
        </label>
        <label className="space-y-2 text-sm text-slate">
          <span className="font-medium text-ink">Bags</span>
          <Input type="number" min={0} max={12} name="luggage" defaultValue={4} required />
        </label>
      </div>

      <label className="space-y-2 text-sm text-slate">
        <span className="font-medium text-ink">Operations notes</span>
        <Textarea
          name="notes"
          placeholder="Any wait time, signage, child-seat, or event timing constraints."
          defaultValue={initialNotes}
        />
      </label>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-7 text-slate">
          Quote requests are suited for long-distance, event, hourly, or multi-stop journeys.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending request..." : "Request quote"}
        </Button>
      </div>

      {state.message ? (
        <div
          className={`rounded-3xl px-4 py-3 text-sm ${
            state.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"
          }`}
        >
          <p>{state.message}</p>
          {state.reference ? <p className="mt-1 font-semibold">Reference: {state.reference}</p> : null}
        </div>
      ) : null}
    </form>
  );
}
