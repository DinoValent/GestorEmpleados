"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AttendanceRecord } from "@/lib/types";

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

function locationMessage(coords: { accuracy: number } | null): string {
  if (!coords) return "No se pudo obtener tu ubicación, se fichó igual.";
  if (coords.accuracy > 500) {
    return `Ubicación registrada, pero con poca precisión (±${coords.accuracy} m). Si fichaste desde una compu, es normal — desde el celular suele ser mucho más exacta.`;
  }
  return `Ubicación registrada (±${coords.accuracy} m).`;
}

export default function CheckInWidget({
  employeeName,
  records,
}: {
  employeeName: string;
  records: AttendanceRecord[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const openRecord = records.find((r) => !r.horaSalida);
  const sorted = [...records].sort((a, b) => b.horaEntrada.localeCompare(a.horaEntrada));
  const last = openRecord ?? sorted[0];

  async function fichar(kind: "checkin" | "checkout") {
    setPending(true);
    setLocationNote(null);
    try {
      let body: Record<string, unknown> = {};
      if (kind === "checkin") {
        const coords = await getLocation();
        body = coords ?? {};
        setLocationNote(locationMessage(coords));
      } else if (openRecord) {
        body = { recordId: openRecord.id };
      }
      const res = await fetch(`/api/mi-fichaje/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No se pudo registrar el fichaje");
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
                disabled={pending}
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
                disabled={pending}
                onClick={() => fichar("checkin")}
              >
                {pending ? "Registrando..." : "Fichar entrada"}
              </button>
            </>
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
