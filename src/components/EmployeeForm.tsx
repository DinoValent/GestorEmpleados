"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Employee, EmployeeInput } from "@/lib/types";

const AREAS = ["Administracion", "Ventas", "Produccion", "Sistemas", "RRHH", "Otro"];

type EmployeeFormData = Omit<EmployeeInput, "empresaId">;

const emptyForm: EmployeeFormData = {
  nombre: "",
  legajo: "",
  dni: "",
  puesto: "",
  area: "",
  email: "",
  telefono: "",
  fechaIngreso: null,
  horarioEntrada: "09:00",
  horarioSalida: "18:00",
  estado: "Activo",
  salarioBase: null,
};

export default function EmployeeForm({ employee }: { employee?: Employee }) {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeFormData>(
    employee
      ? {
          nombre: employee.nombre,
          legajo: employee.legajo,
          dni: employee.dni,
          puesto: employee.puesto,
          area: employee.area,
          email: employee.email,
          telefono: employee.telefono,
          fechaIngreso: employee.fechaIngreso,
          horarioEntrada: employee.horarioEntrada,
          horarioSalida: employee.horarioSalida,
          estado: employee.estado,
          salarioBase: employee.salarioBase,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = employee ? `/api/employees/${employee.id}` : "/api/employees";
      const method = employee ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      router.push("/empleados");
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
        <div>
          <label className="label">Nombre completo *</label>
          <input
            className="input"
            required
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Legajo</label>
          <input
            className="input"
            value={form.legajo}
            onChange={(e) => set("legajo", e.target.value)}
          />
        </div>
        <div>
          <label className="label">DNI</label>
          <input
            className="input"
            value={form.dni}
            onChange={(e) => set("dni", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Puesto</label>
          <input
            className="input"
            value={form.puesto}
            onChange={(e) => set("puesto", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Área</label>
          <select
            className="input"
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
          >
            <option value="">Sin especificar</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="input"
            value={form.estado}
            onChange={(e) => set("estado", e.target.value as EmployeeInput["estado"])}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input
            className="input"
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Fecha de ingreso</label>
          <input
            type="date"
            className="input"
            value={form.fechaIngreso ?? ""}
            onChange={(e) => set("fechaIngreso", e.target.value || null)}
          />
        </div>
        <div>
          <label className="label">Salario base</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.salarioBase ?? ""}
            onChange={(e) =>
              set("salarioBase", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </div>
        <div>
          <label className="label">Horario de entrada habitual</label>
          <input
            type="time"
            className="input"
            value={form.horarioEntrada}
            onChange={(e) => set("horarioEntrada", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Horario de salida habitual</label>
          <input
            type="time"
            className="input"
            value={form.horarioSalida}
            onChange={(e) => set("horarioSalida", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : employee ? "Guardar cambios" : "Crear empleado"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/empleados")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
