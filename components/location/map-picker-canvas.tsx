"use client";

import { useEffect } from "react";

import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { LocationCoordinates } from "@/lib/types";

const DEFAULT_CENTER: LocationCoordinates = {
  lat: 25.2048,
  lng: 55.2708
};

function Recenter({ coordinates }: { coordinates: LocationCoordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lng], map.getZoom(), {
      animate: true
    });
  }, [coordinates, map]);

  return null;
}

function MapClickCapture({
  onPick
}: {
  onPick: (coordinates: LocationCoordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
    }
  });

  return null;
}

export function MapPickerCanvas({
  coordinates,
  onPick
}: {
  coordinates: LocationCoordinates | null;
  onPick: (coordinates: LocationCoordinates) => void;
}) {
  const center = coordinates ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={coordinates ? 13 : 11}
      className="h-[320px] w-full rounded-[1.75rem]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter coordinates={center} />
      <MapClickCapture onPick={onPick} />
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={10}
        pathOptions={{
          color: "#d68f58",
          fillColor: "#d68f58",
          fillOpacity: 0.9,
          weight: 2
        }}
      />
    </MapContainer>
  );
}
