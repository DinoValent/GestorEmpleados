"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ABSENCE_TYPES, type AbsenceInput, type AbsenceType } from "@/lib/types";

export default function AbsenceForm({
  employees,
}: {
  employees: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<AbsenceInput>({
    employeeId: employees[0]?.id ?? "",
    fechaInicio: "",
    fechaFin: "",
    tipo: "Vacaciones",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AbsenceInput>(key: K, value: AbsenceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      router.push("/ausencias");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Empleado *</label>
          <select
            className="input"
            required
            value={form.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
          >
            {employees.length === 0 && <option value="">No hay empleados</option>}
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select
            className="input"
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value as AbsenceType)}
          >
            {ABSENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div />
        <div>
          <label className="label">Desde *</label>
          <input
            type="date"
            className="input"
            required
            value={form.fechaInicio}
            onChange={(e) => set("fechaInicio", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Hasta *</label>
          <input
            type="date"
            className="input"
            required
            value={form.fechaFin}
            onChange={(e) => set("fechaFin", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Observaciones</label>
          <input
            className="input"
            value={form.observaciones}
            onChange={(e) => set("observaciones", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving || employees.length === 0}>
          {saving ? "Guardando..." : "Cargar ausencia"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/ausencias")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
