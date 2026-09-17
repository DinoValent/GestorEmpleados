"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MapaSucursalInner = dynamic(() => import("./MapaSucursalInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-lg" style={{ background: "var(--surface-hover)" }}>
      <p className="text-sm text-slate-400">Cargando mapa...</p>
    </div>
  ),
});

// Plaza de Mayo, Buenos Aires — solo un punto de partida razonable para el mapa
// cuando la sucursal todavía no tiene ninguna ubicación cargada.
const DEFAULT_CENTER: [number, number] = [-34.6083, -58.3712];

export default function UbicacionSucursalForm({
  latitud,
  longitud,
  radioMetros,
}: {
  latitud: number | null;
  longitud: number | null;
  radioMetros: number | null;
}) {
  const router = useRouter();
  const [posicion, setPosicion] = useState<[number, number] | null>(
    latitud !== null && longitud !== null ? [latitud, longitud] : null
  );
  const [radio, setRadio] = useState(radioMetros ?? 10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  async function guardar(body: { latitud: number | null; longitud: number | null; radioMetros: number | null }) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/mi-empresa/ubicacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar la ubicación");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la ubicación");
    } finally {
      setSaving(false);
    }
  }

  function usarMiUbicacion() {
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosicion([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setError("No pudimos obtener tu ubicación. Activá el permiso de ubicación en el navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">Ubicación del local</h2>
        <p className="mt-1 text-sm text-slate-500">
          Marcá dónde está tu local en el mapa (clic o arrastrá el marcador). Los empleados solo
          van a poder fichar si están a menos de la distancia elegida.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && !error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          Guardado.
        </p>
      )}

      <MapaSucursalInner
        posicion={posicion ?? DEFAULT_CENTER}
        radioMetros={radio}
        onPick={(lat, lon) => setPosicion([lat, lon])}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Radio permitido (metros)</label>
          <input
            type="number"
            min={5}
            className="input w-32"
            value={radio}
            onChange={(e) => setRadio(Math.max(5, Number(e.target.value)))}
          />
        </div>
        <button type="button" className="btn-secondary" onClick={usarMiUbicacion} disabled={locating}>
          {locating ? "Ubicando..." : "Usar mi ubicación actual"}
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={saving || !posicion}
          onClick={() => posicion && guardar({ latitud: posicion[0], longitud: posicion[1], radioMetros: radio })}
        >
          {saving ? "Guardando..." : "Guardar ubicación"}
        </button>
        {latitud !== null && (
          <button
            type="button"
            className="text-sm font-medium text-red-600 hover:underline"
            disabled={saving}
            onClick={() => {
              setPosicion(null);
              guardar({ latitud: null, longitud: null, radioMetros: null });
            }}
          >
            Quitar ubicación
          </button>
        )}
      </div>
      {!posicion && (
        <p className="text-xs text-slate-400">
          Todavía no hay ubicación cargada — los empleados pueden fichar desde cualquier lado hasta
          que marques el local acá.
        </p>
      )}
    </div>
  );
}
