"use client";

import dynamic from "next/dynamic";
import { LocateFixed, LoaderCircle, MapPinned, MapPin, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LocationCoordinates } from "@/lib/types";
import { cn } from "@/lib/utils";

const MapPickerCanvas = dynamic(
  () => import("./map-picker-canvas").then((module) => module.MapPickerCanvas),
  {
    ssr: false,
    loading: () => <div className="h-[320px] w-full animate-pulse rounded-[1.75rem] bg-[#eef1f6]" />
  }
);

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country_code?: string;
  };
};

type ResolvedLocation = {
  displayName: string;
  countryCode: string;
};

const searchResultsCache = new Map<string, SearchResult[]>();
const reverseLookupCache = new Map<string, ResolvedLocation>();

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase();
}

function coordinateCacheKey(coordinates: LocationCoordinates) {
  return `${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}`;
}

async function reverseLookup(coordinates: LocationCoordinates): Promise<ResolvedLocation> {
  const cacheKey = coordinateCacheKey(coordinates);
  const cached = reverseLookupCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const search = new URLSearchParams({
    format: "jsonv2",
    lat: String(coordinates.lat),
    lon: String(coordinates.lng)
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${search.toString()}`);

  if (!response.ok) {
    throw new Error("Reverse lookup failed");
  }

  const result = (await response.json()) as {
    display_name?: string;
    address?: {
      country_code?: string;
    };
  };

  const resolved = {
    displayName:
      result.display_name ??
      `Pinned location ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`,
    countryCode: result.address?.country_code?.toUpperCase() ?? ""
  };

  reverseLookupCache.set(cacheKey, resolved);
  return resolved;
}

export function LocationField({
  label,
  value,
  onValueChange,
  coordinates,
  onCoordinatesChange,
  countryCode,
  onCountryCodeChange,
  placeholder,
  inputName,
  coordinatesName,
  countryCodeName,
  description,
  enableCurrentLocation = false,
  compact = false
}: {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  coordinates: LocationCoordinates | null;
  onCoordinatesChange: (coordinates: LocationCoordinates | null) => void;
  countryCode?: string;
  onCountryCodeChange?: (countryCode: string) => void;
  placeholder: string;
  inputName?: string;
  coordinatesName?: string;
  countryCodeName?: string;
  description?: string;
  enableCurrentLocation?: boolean;
  compact?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);
  const deferredValue = useDeferredValue(value);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapBusy, setMapBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<LocationCoordinates | null>(coordinates);

  useEffect(() => {
    setMapCoordinates(coordinates);
  }, [coordinates]);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setResults([]);
      }
    }

    window.addEventListener("mousedown", handlePointer);
    return () => window.removeEventListener("mousedown", handlePointer);
  }, []);

  useEffect(() => {
    const query = deferredValue.trim();
    const normalizedQuery = normalizeSearchQuery(deferredValue);

    if (!query || query.length < 3 || skipNextSearch.current) {
      skipNextSearch.current = false;
      setResults([]);
      setSearching(false);
      return;
    }

    const cachedResults = searchResultsCache.get(normalizedQuery);

    if (cachedResults) {
      setResults(cachedResults);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearching(true);
        const search = new URLSearchParams({
          format: "jsonv2",
          q: query,
          limit: "5",
          addressdetails: "1"
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${search.toString()}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const matches = (await response.json()) as SearchResult[];
        searchResultsCache.set(normalizedQuery, matches);
        setResults(matches);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredValue]);

  function applySelection(
    locationLabel: string,
    nextCoordinates: LocationCoordinates | null,
    nextCountryCode?: string,
    nextStatus?: string
  ) {
    skipNextSearch.current = true;
    onValueChange(locationLabel);
    onCoordinatesChange(nextCoordinates);
    onCountryCodeChange?.(nextCountryCode ?? "");
    setResults([]);
    setStatus(nextStatus ?? "");
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Current location is not available in this browser.");
      return;
    }

    setLocating(true);
    setStatus("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          const location = await reverseLookup(nextCoordinates);
          applySelection(
            location.displayName,
            nextCoordinates,
            location.countryCode,
            "Current location added."
          );
        } catch {
          applySelection(
            `Current location (${nextCoordinates.lat.toFixed(5)}, ${nextCoordinates.lng.toFixed(5)})`,
            nextCoordinates,
            "",
            "Current coordinates added."
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setStatus("We could not read the current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  async function confirmMapPin() {
    if (!mapCoordinates) {
      return;
    }

    setMapBusy(true);

    try {
      const location = await reverseLookup(mapCoordinates);
      applySelection(
        location.displayName,
        mapCoordinates,
        location.countryCode,
        "Pinned map location added."
      );
      setMapOpen(false);
    } catch {
      applySelection(
        `Pinned location (${mapCoordinates.lat.toFixed(5)}, ${mapCoordinates.lng.toFixed(5)})`,
        mapCoordinates,
        "",
        "Pinned map coordinates added."
      );
      setMapOpen(false);
    } finally {
      setMapBusy(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {inputName ? <input type="hidden" name={inputName} value={value} /> : null}
      {coordinatesName ? (
        <input
          type="hidden"
          name={coordinatesName}
          value={coordinates ? `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}` : ""}
        />
      ) : null}
      {countryCodeName ? <input type="hidden" name={countryCodeName} value={countryCode ?? ""} /> : null}

      {label ? <p className="mb-2 text-sm font-medium text-ink">{label}</p> : null}

      <div className={cn(compact ? "relative rounded-none" : "glass-panel relative rounded-[1.7rem]")}>
        <div className={cn("flex items-center gap-2 px-3 py-3", compact && "gap-3 px-0 py-0")}>
          <MapPin className={cn("h-4 w-4 shrink-0 text-slate", compact && "h-5 w-5 text-slate/80")} />
          <Input
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              onCoordinatesChange(null);
              onCountryCodeChange?.("");
              setStatus("");
            }}
            placeholder={placeholder}
            className={cn(
              "border-0 bg-transparent py-0 pl-2 pr-0 shadow-none focus:border-0 focus:ring-0",
              compact && "text-base placeholder:text-slate/55"
            )}
          />

          {value ? (
            <button
              type="button"
              onClick={() => {
                onValueChange("");
                onCoordinatesChange(null);
                onCountryCodeChange?.("");
                setStatus("");
                setResults([]);
              }}
              className="rounded-full p-1 text-slate transition hover:bg-slate/5 hover:text-ink"
              aria-label="Clear location"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {enableCurrentLocation ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleUseCurrentLocation}
              className={cn(
                "gap-2 rounded-full px-3 py-2 text-xs tracking-[0.02em]",
                compact &&
                  "h-10 w-10 border border-white/58 bg-white/86 px-0 text-ink/80 shadow-[0_14px_34px_rgba(8,20,38,0.08)] backdrop-blur-xl hover:bg-white hover:text-ink"
              )}
            >
              {locating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {!compact ? "Current" : null}
            </Button>
          ) : null}

          <Button
            type="button"
            variant={compact ? "ghost" : "secondary"}
            onClick={() => setMapOpen(true)}
            className={cn(
              "gap-2 rounded-full px-3 py-2 text-xs tracking-[0.02em]",
              compact &&
                "h-10 w-10 border border-white/58 bg-white/86 px-0 text-ink/80 shadow-[0_14px_34px_rgba(8,20,38,0.08)] backdrop-blur-xl hover:bg-white hover:text-ink"
            )}
          >
            <MapPinned className="h-4 w-4" />
            {!compact ? "Pin" : null}
          </Button>
        </div>

        {searching ? (
          <div className="glass-panel-strong absolute inset-x-0 top-full z-30 mt-2 rounded-[1.5rem] px-4 py-3 text-sm text-slate">
            Searching places...
          </div>
        ) : null}

        {!searching && results.length > 0 ? (
          <div className="glass-panel-strong absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[1.5rem]">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() =>
                  applySelection(
                    result.display_name,
                    {
                      lat: Number(result.lat),
                      lng: Number(result.lon)
                    },
                    result.address?.country_code?.toUpperCase() ?? "",
                    "Location selected."
                  )
                }
                className="flex w-full items-start gap-3 border-b border-slate/8 px-4 py-3 text-left text-sm text-slate transition last:border-b-0 hover:bg-white/40"
              >
                <Search className="mt-1 h-4 w-4 shrink-0 text-copper" />
                <span>{result.display_name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!compact && (description || status || coordinates) ? (
        <div className="mt-2 space-y-1 text-xs text-slate">
          {description ? <p>{description}</p> : null}
          {coordinates ? <p>Coordinates: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</p> : null}
          {status ? <p className="text-copper">{status}</p> : null}
        </div>
      ) : null}

      {compact && status ? <p className="mt-2 text-xs text-cloud/58">{status}</p> : null}

      {mapOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 px-3 py-3 md:items-center md:px-4 md:py-8">
          <div className="page-card max-h-[92svh] w-full max-w-3xl overflow-y-auto p-5 md:p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Map pin</p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">Choose the exact point on the map.</h3>
                <p className="mt-2 text-sm leading-7 text-slate">
                  Click anywhere on the map, then confirm the pin to use it as this location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="rounded-full p-2 text-slate transition hover:bg-slate/5 hover:text-ink"
                aria-label="Close map"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <MapPickerCanvas coordinates={mapCoordinates} onPick={setMapCoordinates} />
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate">
                {mapCoordinates
                  ? `Pin: ${mapCoordinates.lat.toFixed(5)}, ${mapCoordinates.lng.toFixed(5)}`
                  : "Select a point to continue."}
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setMapOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={confirmMapPin} disabled={!mapCoordinates || mapBusy}>
                  {mapBusy ? "Saving pin..." : "Use this pin"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
