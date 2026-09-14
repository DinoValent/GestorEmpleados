"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Company, Estado, Plan } from "@/lib/types";

const A_MEDIDA = "a-medida";

export default function PlanForm({ empresa, planes }: { empresa: Company; planes: Plan[] }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>(empresa.estado);
  const [planId, setPlanId] = useState(empresa.planId ?? A_MEDIDA);
  const [planLabel, setPlanLabel] = useState(empresa.planLabel ?? empresa.planNombre ?? "A medida");
  const [maxEmpleados, setMaxEmpleados] = useState(empresa.maxEmpleados);
  const [maxAdmins, setMaxAdmins] = useState(empresa.maxAdmins);
  const [diasGracia, setDiasGracia] = useState(empresa.diasGracia);
  const [fechaVencimiento, setFechaVencimiento] = useState(empresa.fechaVencimiento ?? "");
  const [direccion, setDireccion] = useState(empresa.direccion ?? "");
  const [color, setColor] = useState(empresa.color ?? "#1c02ab");
  const [telefono, setTelefono] = useState(empresa.telefono ?? "");
  const [notas, setNotas] = useState(empresa.notas ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const planSeleccionado = planes.find((p) => p.id === planId);

  const hoy = new Date();
  const desde = new Date(empresa.createdAt);
  const mesesComoCliente = Math.max(
    0,
    Math.floor((hoy.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  );
  const diasParaCobro = empresa.fechaVencimiento
    ? Math.ceil((new Date(empresa.fechaVencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  function handlePlanChange(id: string) {
    setPlanId(id);
    const plan = planes.find((p) => p.id === id);
    if (plan) {
      setMaxEmpleados(plan.maxEmpleados);
      setMaxAdmins(plan.maxAdmins);
      setDiasGracia(plan.diasGracia);
    }
  }

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
          planId: planSeleccionado ? planSeleccionado.id : null,
          planLabel: planSeleccionado ? null : planLabel || "A medida",
          maxEmpleados,
          maxAdmins,
          diasGracia,
          fechaVencimiento: fechaVencimiento || null,
          direccion: direccion || null,
          color: color || null,
          telefono: telefono || null,
          notas: notas || null,
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

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: "var(--foreground-secondary)" }}>
        <span>
          Cliente desde {new Date(empresa.createdAt).toLocaleDateString("es-AR")} · {mesesComoCliente}{" "}
          {mesesComoCliente === 1 ? "mes" : "meses"}
        </span>
        <span>
          {diasParaCobro === null
            ? "Sin fecha de próximo cobro"
            : diasParaCobro >= 0
              ? `Próximo cobro en ${diasParaCobro} ${diasParaCobro === 1 ? "día" : "días"}`
              : `Cobro vencido hace ${Math.abs(diasParaCobro)} ${Math.abs(diasParaCobro) === 1 ? "día" : "días"}`}
        </span>
      </div>

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
          <label className="label">Plan</label>
          <select className="input" value={planId} onChange={(e) => handlePlanChange(e.target.value)}>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {p.precio}/mes
              </option>
            ))}
            <option value={A_MEDIDA}>A medida (personalizado)</option>
          </select>
          {!planSeleccionado && (
            <input
              className="input mt-2"
              placeholder="Etiqueta del plan"
              value={planLabel}
              onChange={(e) => setPlanLabel(e.target.value)}
            />
          )}
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
        {empresa.grupoId && (
          <div>
            <label className="label">Dirección de la sucursal</label>
            <input
              className="input"
              placeholder="Ej. Av. Siempreviva 742"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">Esta empresa es una sucursal de un grupo corporativo.</p>
          </div>
        )}
        {empresa.grupoId && (
          <div>
            <label className="label">Color de la sucursal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border p-1"
                style={{ borderColor: "var(--border)" }}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span className="text-sm text-slate-500">{color}</span>
            </div>
          </div>
        )}
        <div>
          <label className="label">Días de gracia</label>
          <input
            type="number"
            min={5}
            className="input"
            value={diasGracia}
            onChange={(e) => setDiasGracia(Number(e.target.value))}
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
            Vencida la fecha (más los días de gracia), la empresa pasa a modo solo lectura.
          </p>
        </div>
        <div>
          <label className="label">Teléfono de contacto</label>
          <input
            type="tel"
            className="input"
            placeholder="Ej. 11 2345-6789"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">No es el login — es para retomar contacto si se da de baja.</p>
        </div>
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea
          className="input min-h-24 resize-y"
          placeholder="Seguimiento comercial, motivo de baja, por qué recontactarlo, etc."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
