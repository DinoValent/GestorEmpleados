"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { distanciaMetros } from "@/lib/geo";
import type { AttendanceRecord } from "@/lib/types";

interface SucursalUbicacion {
  latitud: number;
  longitud: number;
  radioMetros: number;
}

function getLocation(): Promise<{ lat: number; lon: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

function locationMessage(coords: { accuracy: number }): string {
  if (coords.accuracy > 500) {
    return `Ubicación registrada, pero con poca precisión (±${coords.accuracy} m). Si fichaste desde una compu, es normal — desde el celular suele ser mucho más exacta.`;
  }
  return `Ubicación registrada (±${coords.accuracy} m).`;
}

const LOCATION_BLOCKED_MESSAGE =
  "No pudimos obtener tu ubicación. Activá el permiso de ubicación en el navegador e intentá de nuevo — sin ubicación no se puede fichar.";

export default function CheckInWidget({
  employeeName,
  records,
  sucursalUbicacion,
}: {
  employeeName: string;
  records: AttendanceRecord[];
  sucursalUbicacion: SucursalUbicacion | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  // null = todavía no sabemos (esperando el primer fix de GPS); solo se usa si
  // la sucursal tiene ubicación configurada — si no, el fichaje queda libre.
  const [distancia, setDistancia] = useState<number | null>(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    if (!sucursalUbicacion || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(false);
        setDistancia(
          distanciaMetros(
            pos.coords.latitude,
            pos.coords.longitude,
            sucursalUbicacion.latitud,
            sucursalUbicacion.longitud
          )
        );
      },
      () => setGeoError(true),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [sucursalUbicacion]);

  const fueraDeRango =
    !!sucursalUbicacion && (geoError || distancia === null || distancia > sucursalUbicacion.radioMetros);

  const openRecord = records.find((r) => !r.horaSalida);
  const sorted = [...records].sort((a, b) => b.horaEntrada.localeCompare(a.horaEntrada));
  const last = openRecord ?? sorted[0];

  async function fichar(kind: "checkin" | "checkout") {
    setPending(true);
    setLocationNote(null);
    setLocationError(null);
    try {
      const coords = await getLocation();
      if (!coords) {
        setLocationError(LOCATION_BLOCKED_MESSAGE);
        return;
      }
      setLocationNote(locationMessage(coords));

      let body: Record<string, unknown> = coords;
      if (kind === "checkout") {
        if (!openRecord) return;
        body = { ...coords, recordId: openRecord.id };
      }
      const res = await fetch(`/api/mi-fichaje/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocationError(data.error || LOCATION_BLOCKED_MESSAGE);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <p className="text-sm text-slate-500">Hola,</p>
        <h1 className="text-2xl font-semibold tracking-tight">{employeeName}</h1>

        <div className="mt-6">
          {openRecord ? (
            <>
              <p className="mb-4 text-sm text-slate-500">
                En jornada desde <span className="font-mono font-medium">{openRecord.horaEntrada}</span>
              </p>
              <button
                className="btn-secondary w-full py-3 text-base"
                disabled={pending || fueraDeRango}
                onClick={() => fichar("checkout")}
              >
                {pending ? "Registrando..." : "Fichar salida"}
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {last ? `Última jornada: ${last.horaEntrada} – ${last.horaSalida}` : "Todavía no fichaste hoy"}
              </p>
              <button
                className="btn-primary w-full py-3 text-base"
                disabled={pending || fueraDeRango}
                onClick={() => fichar("checkin")}
              >
                {pending ? "Registrando..." : "Fichar entrada"}
              </button>
            </>
          )}
          {sucursalUbicacion && (
            <p className="mt-3 text-xs text-slate-400">
              {geoError
                ? "No pudimos obtener tu ubicación. Activá el permiso de ubicación para poder fichar."
                : distancia === null
                  ? "Verificando tu ubicación..."
                  : distancia > sucursalUbicacion.radioMetros
                    ? `Estás a ${Math.round(distancia)} m del local — necesitás estar a menos de ${sucursalUbicacion.radioMetros} m para fichar.`
                    : `Estás a ${Math.round(distancia)} m del local.`}
            </p>
          )}
          {locationError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {locationError}
            </p>
          )}
          {locationNote && <p className="mt-3 text-xs text-slate-400">{locationNote}</p>}
        </div>
      </div>

      {records.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Fichajes de hoy</h2>
          <div className="card space-y-2 p-4">
            {sorted.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">
                  {r.horaEntrada} – {r.horaSalida ?? "en curso"}
                </span>
                <span className="text-slate-400">
                  {r.horasTrabajadas !== null ? `${r.horasTrabajadas} hs` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
