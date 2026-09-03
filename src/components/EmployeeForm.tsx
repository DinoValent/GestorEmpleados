"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { shiftHours } from "@/lib/shiftHours";
import {
  DIAS_SEMANA,
  type DiaSemana,
  type Employee,
  type EmployeeInput,
  type ShiftAssignmentInput,
  type ShiftTemplate,
} from "@/lib/types";

const AREAS = ["Administracion", "Ventas", "Produccion", "Sistemas", "RRHH", "Otro"];

const DIA_LABEL: Record<DiaSemana, string> = {
  LUN: "L",
  MAR: "M",
  MIE: "X",
  JUE: "J",
  VIE: "V",
  SAB: "S",
  DOM: "D",
};

const DIA_NOMBRE: Record<DiaSemana, string> = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
  DOM: "Domingo",
};

interface ExtraTurno {
  shiftId: string;
  diasSemana: DiaSemana[];
}

type EmployeeFormData = Omit<EmployeeInput, "empresaId">;

function emptyForm(shifts: ShiftTemplate[]): EmployeeFormData {
  return {
    nombre: "",
    legajo: "",
    dni: "",
    puesto: "",
    area: "",
    email: "",
    telefono: "",
    fechaIngreso: null,
    shiftId: shifts[0]?.id ?? null,
    estado: "Activo",
    salarioBase: null,
  };
}

function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EmployeeForm({
  employee,
  shifts,
}: {
  employee?: Employee;
  shifts: ShiftTemplate[];
}) {
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
          shiftId: employee.shiftId,
          estado: employee.estado,
          salarioBase: employee.salarioBase,
        }
      : emptyForm(shifts)
  );
  const [extraTurnos, setExtraTurnos] = useState<ExtraTurno[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addExtraTurno() {
    setExtraTurnos((prev) => [...prev, { shiftId: shifts[0]?.id ?? "", diasSemana: [] }]);
  }

  function removeExtraTurno(index: number) {
    setExtraTurnos((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExtraTurno(index: number, patch: Partial<ExtraTurno>) {
    setExtraTurnos((prev) => prev.map((et, i) => (i === index ? { ...et, ...patch } : et)));
  }

  function toggleExtraDia(index: number, dia: DiaSemana) {
    setExtraTurnos((prev) =>
      prev.map((et, i) =>
        i === index
          ? {
              ...et,
              diasSemana: et.diasSemana.includes(dia)
                ? et.diasSemana.filter((d) => d !== dia)
                : [...et.diasSemana, dia],
            }
          : et
      )
    );
  }

  const shiftById = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

  const horasSemana = useMemo(() => {
    const dayShift = new Map<DiaSemana, string>();
    if (form.shiftId) {
      for (const d of DIAS_SEMANA) dayShift.set(d, form.shiftId);
    }
    for (const et of extraTurnos) {
      if (!et.shiftId) continue;
      for (const d of et.diasSemana) dayShift.set(d, et.shiftId);
    }
    let total = 0;
    for (const shiftId of dayShift.values()) {
      const s = shiftById.get(shiftId);
      if (s) total += shiftHours(s.horaEntrada, s.horaSalida);
    }
    return total;
  }, [form.shiftId, extraTurnos, shiftById]);

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
      const savedEmployee = (await res.json()) as { id: string };

      for (const et of extraTurnos) {
        if (!et.shiftId || et.diasSemana.length === 0) continue;
        const body: Omit<ShiftAssignmentInput, "empresaId"> = {
          employeeId: savedEmployee.id,
          shiftId: et.shiftId,
          fechaInicio: localTodayISO(),
          fechaFin: null,
          diasSemana: et.diasSemana,
          esFijo: true,
        };
        await fetch("/api/asignaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
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
        <div className="sm:col-span-2 space-y-3">
          <label className="label">Turno *</label>
          {shifts.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Todavía no creaste ningún turno. Andá a{" "}
              <Link href="/turnos" className="font-medium underline">
                Turnos rotativos
              </Link>{" "}
              y creá al menos uno (por ejemplo &quot;Horario fijo&quot;, 9:00 a 18:00) para poder
              asignárselo a este empleado.
            </p>
          ) : (
            <>
              <select
                className="input"
                required
                value={form.shiftId ?? ""}
                onChange={(e) => set("shiftId", e.target.value || null)}
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.horaEntrada}–{s.horaSalida})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Rige todos los días, salvo los que cubras con un turno adicional abajo.
              </p>

              {extraTurnos.map((et, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Turno adicional</span>
                    <button
                      type="button"
                      onClick={() => removeExtraTurno(i)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                  <select
                    className="input"
                    value={et.shiftId}
                    onChange={(e) => updateExtraTurno(i, { shiftId: e.target.value })}
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.horaEntrada}–{s.horaSalida})
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        title={DIA_NOMBRE[dia]}
                        onClick={() => toggleExtraDia(i, dia)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                          et.diasSemana.includes(dia)
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {DIA_LABEL[dia]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addExtraTurno}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Agregar otro turno
              </button>

              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                Horas estimadas por semana: {horasSemana.toFixed(1)} hs
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving || shifts.length === 0}>
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
