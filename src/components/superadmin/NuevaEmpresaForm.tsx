"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan } from "@/lib/types";

const A_MEDIDA = "a-medida";

interface SucursalDraft {
  nombre: string;
  direccion: string;
  color: string;
}

/** Colores por defecto que van rotando al agregar sucursales, para que cada una
 * arranque con un color distinto sin obligar a elegirlo a mano. */
const COLORES_DEFAULT = ["#1c02ab", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NuevaEmpresaForm({ planes }: { planes: Plan[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [planId, setPlanId] = useState(planes[0]?.id ?? A_MEDIDA);
  const [planLabel, setPlanLabel] = useState("A medida");
  const [maxEmpleados, setMaxEmpleados] = useState(planes[0]?.maxEmpleados ?? 4);
  const [maxAdmins, setMaxAdmins] = useState(planes[0]?.maxAdmins ?? 1);
  const [diasGracia, setDiasGracia] = useState(planes[0]?.diasGracia ?? 5);
  const [fechaVencimiento, setFechaVencimiento] = useState(planes[0] ? addDays(30) : "");
  const [sucursales, setSucursales] = useState<SucursalDraft[]>([
    { nombre: "", direccion: "", color: COLORES_DEFAULT[0] },
  ]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planSeleccionado = planes.find((p) => p.id === planId);
  const esCorporativo = planSeleccionado?.esCorporativo ?? false;

  function handlePlanChange(id: string) {
    setPlanId(id);
    const plan = planes.find((p) => p.id === id);
    if (plan) {
      setMaxEmpleados(plan.maxEmpleados);
      setMaxAdmins(plan.maxAdmins);
      setDiasGracia(plan.diasGracia);
      if (!fechaVencimiento) setFechaVencimiento(addDays(30));
    }
  }

  function updateSucursal(index: number, patch: Partial<SucursalDraft>) {
    setSucursales((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addSucursal() {
    setSucursales((rows) => [
      ...rows,
      { nombre: "", direccion: "", color: COLORES_DEFAULT[rows.length % COLORES_DEFAULT.length] },
    ]);
  }

  function removeSucursal(index: number) {
    setSucursales((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          planId: planSeleccionado ? planSeleccionado.id : null,
          planLabel: planSeleccionado ? null : planLabel || "A medida",
          maxEmpleados,
          maxAdmins,
          diasGracia,
          fechaVencimiento: fechaVencimiento || null,
          adminEmail,
          adminPassword,
          ...(esCorporativo
            ? {
                sucursales: sucursales
                  .filter((s) => s.nombre.trim())
                  .map((s) => ({ nombre: s.nombre, direccion: s.direccion || null, color: s.color || null })),
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear la empresa");
      }
      router.push("/superadmin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la empresa");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="label">{esCorporativo ? "Nombre de la empresa / grupo *" : "Nombre de la empresa *"}</label>
        <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>

      <div>
        <label className="label">Plan *</label>
        <select className="input" value={planId} onChange={(e) => handlePlanChange(e.target.value)}>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {p.precio}/mes{p.esCorporativo ? " (corporativo)" : ""}
            </option>
          ))}
          <option value={A_MEDIDA}>A medida (personalizado)</option>
        </select>
        {planSeleccionado ? (
          <p className="mt-1.5 text-xs text-slate-500">
            {planSeleccionado.maxEmpleados} empleados · {planSeleccionado.maxAdmins} admins ·{" "}
            {planSeleccionado.diasGracia} días de gracia
            {esCorporativo ? " por sucursal" : ""}. Podés ajustar estos números abajo si este
            cliente necesita algo distinto.
          </p>
        ) : (
          <input
            className="input mt-2"
            placeholder="Etiqueta del plan (ej. A medida, Enterprise...)"
            value={planLabel}
            onChange={(e) => setPlanLabel(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Vencimiento de la suscripción</label>
          <input
            type="date"
            className="input"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
        </div>
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
          <label className="label">Máximo de empleados{esCorporativo ? " (por sucursal)" : ""}</label>
          <input
            type="number"
            min={0}
            className="input"
            value={maxEmpleados}
            onChange={(e) => setMaxEmpleados(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Máximo de administradores{esCorporativo ? " (por sucursal)" : ""}</label>
          <input
            type="number"
            min={0}
            className="input"
            value={maxAdmins}
            onChange={(e) => setMaxAdmins(Number(e.target.value))}
          />
        </div>
      </div>

      {esCorporativo && (
        <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <p className="mb-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Sucursales *
          </p>
          <p className="mb-3 text-xs text-slate-500">
            El administrador va a poder elegir entre estas sucursales una vez logueado. Cada una
            queda con sus propios empleados, fichajes y datos, totalmente separados.
          </p>
          <div className="space-y-3">
            {sucursales.map((s, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="color"
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border p-1"
                  style={{ borderColor: "var(--border)" }}
                  value={s.color}
                  onChange={(e) => updateSucursal(i, { color: e.target.value })}
                  title="Color para identificar esta sucursal"
                />
                <input
                  className="input"
                  placeholder={`Nombre de la sucursal ${i + 1} (ej. Sucursal Centro)`}
                  value={s.nombre}
                  onChange={(e) => updateSucursal(i, { nombre: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Dirección (opcional)"
                  value={s.direccion}
                  onChange={(e) => updateSucursal(i, { direccion: e.target.value })}
                />
                {sucursales.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    onClick={() => removeSucursal(i)}
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-3" onClick={addSucursal}>
            + Agregar sucursal
          </button>
        </div>
      )}

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <p className="mb-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Primer administrador {esCorporativo ? "(entra a todas las sucursales)" : "de la empresa"}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              required
              className="input"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Creando..." : "Crear empresa"}
      </button>
    </form>
  );
}
