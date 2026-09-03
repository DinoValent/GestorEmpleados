"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DIAS_SEMANA,
  type DiaSemana,
  type Employee,
  type ShiftAssignmentInput,
  type ShiftTemplate,
  type ShiftTemplateInput,
} from "@/lib/types";

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

function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TurnosPanel({
  employees,
  shifts,
}: {
  employees: Employee[];
  shifts: ShiftTemplate[];
}) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [horaEntrada, setHoraEntrada] = useState("09:00");
  const [horaSalida, setHoraSalida] = useState("18:00");
  const [savingShift, setSavingShift] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [shiftId, setShiftId] = useState(shifts[0]?.id ?? "");
  const [turnoFijo, setTurnoFijo] = useState(true);
  const [diasSemana, setDiasSemana] = useState<DiaSemana[]>([...DIAS_SEMANA]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  function toggleDia(dia: DiaSemana) {
    setDiasSemana((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  async function crearTurno(e: React.FormEvent) {
    e.preventDefault();
    setSavingShift(true);
    setShiftError(null);
    try {
      const body: Omit<ShiftTemplateInput, "empresaId"> = { nombre, horaEntrada, horaSalida };
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar el turno");
      }
      setNombre("");
      router.refresh();
    } catch (err) {
      setShiftError(err instanceof Error ? err.message : "Error al guardar el turno");
    } finally {
      setSavingShift(false);
    }
  }

  async function crearAsignacion(e: React.FormEvent) {
    e.preventDefault();
    setSavingAssignment(true);
    setAssignmentError(null);
    try {
      if (!employeeId || !shiftId) {
        throw new Error("Elegí un empleado y un turno");
      }
      if (diasSemana.length === 0) {
        throw new Error("Elegí al menos un día de la semana");
      }
      if (!turnoFijo && !fechaInicio) {
        throw new Error("Elegí una fecha de inicio");
      }
      const body: Omit<ShiftAssignmentInput, "empresaId"> = turnoFijo
        ? {
            employeeId,
            shiftId,
            fechaInicio: localTodayISO(),
            fechaFin: null,
            diasSemana,
            esFijo: true,
          }
        : {
            employeeId,
            shiftId,
            fechaInicio,
            fechaFin: fechaFin || null,
            diasSemana,
            esFijo: false,
          };
      const res = await fetch("/api/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al asignar el turno");
      }
      setFechaInicio("");
      setFechaFin("");
      setDiasSemana([...DIAS_SEMANA]);
      router.refresh();
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Error al asignar el turno");
    } finally {
      setSavingAssignment(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <form onSubmit={crearTurno} className="card space-y-3">
        <h2 className="font-semibold">Crear turno</h2>
        {shiftError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{shiftError}</p>
        )}
        <div>
          <label className="label">Nombre *</label>
          <input
            className="input"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Mañana, Tarde, Noche"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Hora entrada *</label>
            <input
              type="time"
              className="input"
              required
              value={horaEntrada}
              onChange={(e) => setHoraEntrada(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hora salida *</label>
            <input
              type="time"
              className="input"
              required
              value={horaSalida}
              onChange={(e) => setHoraSalida(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={savingShift}>
          {savingShift ? "Guardando..." : "Crear turno"}
        </button>
      </form>

      <form onSubmit={crearAsignacion} className="card space-y-3">
        <h2 className="font-semibold">Asignar turno a un empleado</h2>
        <p className="text-sm text-slate-500">
          {turnoFijo
            ? "Se repite todas las semanas en los días que marques, sin fecha de fin."
            : "Rige solo durante el rango de fechas que elijas, en los días que marques."}
        </p>
        {assignmentError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{assignmentError}</p>
        )}
        {employees.length === 0 || shifts.length === 0 ? (
          <p className="text-sm text-slate-400">
            {employees.length === 0
              ? "No hay empleados activos cargados."
              : "Primero creá al menos un turno."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Empleado *</label>
                <select
                  className="input"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Turno *</label>
                <select className="input" value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.horaEntrada}–{s.horaSalida})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={turnoFijo}
                onChange={(e) => setTurnoFijo(e.target.checked)}
              />
              Turno fijo (se repite todas las semanas)
            </label>

            <div>
              <label className="label">Días *</label>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((dia) => (
                  <button
                    key={dia}
                    type="button"
                    title={DIA_NOMBRE[dia]}
                    onClick={() => toggleDia(dia)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      diasSemana.includes(dia)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {DIA_LABEL[dia]}
                  </button>
                ))}
              </div>
            </div>

            {!turnoFijo && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fecha inicio *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Fecha fin</label>
                  <input
                    type="date"
                    className="input"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
            )}
            <button type="submit" className="btn-secondary" disabled={savingAssignment}>
              {savingAssignment ? "Guardando..." : "Asignar"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
