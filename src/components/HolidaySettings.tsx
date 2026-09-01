"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HOLIDAY_TYPES, type HolidayInput, type HolidayType } from "@/lib/types";

export default function HolidaySettings({ year }: { year: number }) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<HolidayType>("Personalizado");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reimporting, setReimporting] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Omit<HolidayInput, "empresaId"> = { nombre, fecha, tipo };
      const res = await fetch("/api/feriados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }
      setNombre("");
      setFecha("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function reimportar() {
    setReimporting(true);
    try {
      const res = await fetch("/api/feriados/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo reimportar");
        return;
      }
      alert(`Se agregaron ${data.creados} feriados nuevos de ${data.total} encontrados.`);
      router.refresh();
    } finally {
      setReimporting(false);
    }
  }

  return (
    <details className="group">
      <summary className="cursor-pointer select-none text-sm text-slate-400 hover:text-slate-600">
        Feriados y días no laborables
      </summary>
      <div className="card mt-2 max-w-sm space-y-3">
        <p className="text-xs text-slate-500">
          Los feriados nacionales de Argentina se cargan solos en el calendario. Acá podés
          agregar un día no laborable propio del negocio (cierre, feriado provincial, etc.).
        </p>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}
        <form onSubmit={agregar} className="space-y-2">
          <input
            className="input"
            required
            placeholder="Nombre (ej. Cierre por balance)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="input"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as HolidayType)}
            >
              {HOLIDAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary w-full" disabled={saving}>
            {saving ? "Guardando..." : "Agregar"}
          </button>
        </form>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={reimportar}
            disabled={reimporting}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {reimporting ? "Reimportando..." : `Reimportar feriados ${year}`}
          </button>
          <Link href="/feriados" className="text-xs font-medium text-slate-500 hover:underline">
            Ver todos →
          </Link>
        </div>
      </div>
    </details>
  );
}
