"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan } from "@/lib/types";

export default function PlanCatalogoForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(plan?.nombre ?? "");
  const [precio, setPrecio] = useState(plan?.precio ?? "");
  const [precioOriginal, setPrecioOriginal] = useState(plan?.precioOriginal ?? "");
  const [maxEmpleados, setMaxEmpleados] = useState(plan?.maxEmpleados ?? 4);
  const [maxAdmins, setMaxAdmins] = useState(plan?.maxAdmins ?? 1);
  const [diasGracia, setDiasGracia] = useState(plan?.diasGracia ?? 5);
  const [detalle, setDetalle] = useState((plan?.detalle ?? []).join("\n"));
  const [destacado, setDestacado] = useState(plan?.destacado ?? false);
  const [esCorporativo, setEsCorporativo] = useState(plan?.esCorporativo ?? false);
  const [activo, setActivo] = useState(plan?.activo ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        nombre,
        precio,
        precioOriginal: precioOriginal || null,
        maxEmpleados,
        maxAdmins,
        diasGracia,
        detalle: detalle
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
        destacado,
        esCorporativo,
        activo,
        orden: plan?.orden ?? 0,
      };
      const res = await fetch(plan ? `/api/superadmin/planes/${plan.id}` : "/api/superadmin/planes", {
        method: plan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar el plan");
      }
      router.push("/superadmin/planes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el plan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!plan) return;
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"? Las empresas que ya lo tienen asignado no se ven afectadas.`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/planes/${plan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar el plan");
      }
      router.push("/superadmin/planes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el plan");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombre *</label>
          <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
            Destacado (&quot;Más elegido&quot;)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Visible en /planes
          </label>
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            <input
              type="checkbox"
              checked={esCorporativo}
              onChange={(e) => setEsCorporativo(e.target.checked)}
            />
            Corporativo (multi-sucursal)
          </label>
        </div>
        {esCorporativo && (
          <p className="text-xs text-slate-400 sm:col-span-2">
            Al crear una empresa con este plan, el SuperAdmin va a poder cargar varias sucursales
            (nombre y dirección) bajo un mismo login de administrador. Cada sucursal arranca con
            los límites de empleados/admins de este plan.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Precio actual *</label>
          <input required className="input" placeholder="$50.000" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          <p className="mt-1 text-xs text-slate-400">Se cobra mensualmente — el precio se muestra siempre como &quot;/mes&quot;.</p>
        </div>
        <div>
          <label className="label">Precio de lista (tachado)</label>
          <input
            className="input"
            placeholder="$90.000 — dejar vacío si no hay descuento"
            value={precioOriginal}
            onChange={(e) => setPrecioOriginal(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Máximo de empleados *</label>
          <input
            type="number"
            min={0}
            required
            className="input"
            value={maxEmpleados}
            onChange={(e) => setMaxEmpleados(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Máximo de administradores *</label>
          <input
            type="number"
            min={0}
            required
            className="input"
            value={maxAdmins}
            onChange={(e) => setMaxAdmins(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Días de gracia *</label>
          <input
            type="number"
            min={5}
            required
            className="input"
            value={diasGracia}
            onChange={(e) => setDiasGracia(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-400">
            Mínimo 5. Días de tolerancia después del vencimiento antes de pasar a solo lectura.
          </p>
        </div>
      </div>

      <div>
        <label className="label">Funciones incluidas (una por línea)</label>
        <textarea
          className="input"
          rows={5}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder={"Fichaje con ubicación\nCálculo de horas extra y llegadas tarde"}
        />
      </div>

      <div className="flex items-center justify-between">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : plan ? "Guardar cambios" : "Crear plan"}
        </button>
        {plan && (
          <button type="button" className="btn-danger" disabled={saving} onClick={handleDelete}>
            Eliminar plan
          </button>
        )}
      </div>
    </form>
  );
}
