"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

// Los íconos default de Leaflet referencian rutas relativas que no resuelven
// bien empaquetadas con Next.js — se apuntan al CDN en vez de pelear con el
// bundler por unos pngs.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapaSucursalInner({
  posicion,
  radioMetros,
  onPick,
}: {
  posicion: [number, number];
  radioMetros: number;
  onPick: (lat: number, lon: number) => void;
}) {
  const icon = useMemo(() => new L.Icon.Default(), []);

  return (
    <MapContainer
      center={posicion}
      zoom={17}
      className="h-72 w-full rounded-lg"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Marker
        position={posicion}
        icon={icon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const m = e.target as L.Marker;
            const { lat, lng } = m.getLatLng();
            onPick(lat, lng);
          },
        }}
      />
      <Circle center={posicion} radius={radioMetros} pathOptions={{ color: "#1c02ab", fillOpacity: 0.1 }} />
    </MapContainer>
  );
}
