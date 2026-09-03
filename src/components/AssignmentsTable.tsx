"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DIAS_SEMANA, type DiaSemana, type ShiftAssignment } from "@/lib/types";

const DIA_LABEL: Record<DiaSemana, string> = {
  LUN: "L",
  MAR: "M",
  MIE: "X",
  JUE: "J",
  VIE: "V",
  SAB: "S",
  DOM: "D",
};

function diasResumen(dias: DiaSemana[]): string {
  if (dias.length === 0 || dias.length === 7) return "Todos los días";
  return DIAS_SEMANA.filter((d) => dias.includes(d))
    .map((d) => DIA_LABEL[d])
    .join(" ");
}

export default function AssignmentsTable({
  assignments,
  employeeNames,
  shiftNames,
  today,
}: {
  assignments: ShiftAssignment[];
  employeeNames: Record<string, string>;
  shiftNames: Record<string, string>;
  today: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta asignación de turno?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/asignaciones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Turno</th>
            <th>Tipo</th>
            <th>Días</th>
            <th>Desde</th>
            <th>Hasta</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {assignments.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-slate-400">
                Todavía no hay asignaciones cargadas.
              </td>
            </tr>
          )}
          {assignments.map((a) => {
            const vigente = today >= a.fechaInicio && (a.fechaFin === null || today <= a.fechaFin);
            return (
              <tr key={a.id}>
                <td className="font-medium">{employeeNames[a.employeeId] ?? "—"}</td>
                <td>{shiftNames[a.shiftId] ?? "—"}</td>
                <td>
                  <span
                    className={`badge ${
                      a.esFijo ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {a.esFijo ? "Fijo" : "Rotativo"}
                  </span>
                </td>
                <td className="font-mono text-xs whitespace-nowrap">{diasResumen(a.diasSemana)}</td>
                <td className="font-mono tabular-nums">{a.fechaInicio}</td>
                <td className="font-mono tabular-nums">{a.fechaFin ?? "Indefinido"}</td>
                <td>
                  <span
                    className={`badge ${
                      vigente ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {vigente ? "Vigente" : "No vigente"}
                  </span>
                </td>
                <td>
                  <button
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                    disabled={deletingId === a.id}
                    onClick={() => remove(a.id)}
                  >
                    {deletingId === a.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
