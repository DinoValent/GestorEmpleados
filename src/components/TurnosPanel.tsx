"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Employee, ShiftAssignmentInput, ShiftTemplate, ShiftTemplateInput } from "@/lib/types";

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
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

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
      const body: Omit<ShiftAssignmentInput, "empresaId"> = {
        employeeId,
        shiftId,
        fechaInicio,
        fechaFin: fechaFin || null,
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
          Mientras dure el rango de fechas, ese empleado va a usar el horario de este turno en
          vez de su horario fijo. Dejá la fecha de fin vacía si es indefinido.
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
            <button type="submit" className="btn-secondary" disabled={savingAssignment}>
              {savingAssignment ? "Guardando..." : "Asignar"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
