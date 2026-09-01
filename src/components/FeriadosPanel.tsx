"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HOLIDAY_TYPES, type HolidayInput, type HolidayType } from "@/lib/types";

export default function FeriadosPanel() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [importing, setImporting] = useState(false);

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<HolidayType>("Personalizado");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function importar() {
    setImporting(true);
    try {
      const res = await fetch("/api/feriados/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo importar");
        return;
      }
      alert(`Se agregaron ${data.creados} feriados nuevos de ${data.total} encontrados.`);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: HolidayInput = { nombre, fecha, tipo };
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="card space-y-3">
        <h2 className="font-semibold">Importar feriados nacionales</h2>
        <p className="text-sm text-slate-500">
          Trae los feriados nacionales de Argentina del año que elijas (podés revisarlos
          y borrarlos después si hace falta). No duplica fechas ya cargadas.
        </p>
        <div className="flex items-end gap-2">
          <div>
            <label className="label">Año</label>
            <input
              type="number"
              className="input w-28"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <button className="btn-primary" disabled={importing} onClick={importar}>
            {importing ? "Importando..." : "Importar"}
          </button>
        </div>
      </div>

      <form onSubmit={agregar} className="card space-y-3">
        <h2 className="font-semibold">Agregar un día no laborable</h2>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label className="label">Nombre *</label>
          <input
            className="input"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Cierre por balance"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha *</label>
            <input
              type="date"
              className="input"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Tipo</label>
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
        </div>
        <button type="submit" className="btn-secondary" disabled={saving}>
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </form>
    </div>
  );
}
