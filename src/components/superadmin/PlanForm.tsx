"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Company, Estado } from "@/lib/types";

export default function PlanForm({ empresa }: { empresa: Company }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>(empresa.estado);
  const [plan, setPlan] = useState(empresa.plan ?? "");
  const [maxEmpleados, setMaxEmpleados] = useState(empresa.maxEmpleados);
  const [maxAdmins, setMaxAdmins] = useState(empresa.maxAdmins);
  const [fechaVencimiento, setFechaVencimiento] = useState(empresa.fechaVencimiento ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/superadmin/empresas/${empresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          plan: plan || null,
          maxEmpleados,
          maxAdmins,
          fechaVencimiento: fechaVencimiento || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-semibold">Plan y suscripción</h2>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && !error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          Guardado.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Estado</label>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <div>
          <label className="label">Plan (etiqueta)</label>
          <input
            className="input"
            placeholder="Inicial, Premium, A medida..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Máximo de empleados</label>
          <input
            type="number"
            min={0}
            className="input"
            value={maxEmpleados}
            onChange={(e) => setMaxEmpleados(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Máximo de administradores</label>
          <input
            type="number"
            min={0}
            className="input"
            value={maxAdmins}
            onChange={(e) => setMaxAdmins(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Vencimiento de la suscripción</label>
          <input
            type="date"
            className="input"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            Vencida la fecha, la empresa pasa a modo solo lectura hasta que la renueves.
          </p>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
