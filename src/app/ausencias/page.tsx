import Link from "next/link";
import { listAbsences, listEmployees } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { AbsenceType } from "@/lib/types";

export const revalidate = 30;

const TIPO_STYLE: Record<AbsenceType, string> = {
  Vacaciones: "bg-sky-100 text-sky-800",
  "Licencia medica": "bg-red-100 text-red-800",
  "Licencia personal": "bg-purple-100 text-purple-800",
  "Falta justificada": "bg-amber-100 text-amber-800",
  "Falta injustificada": "bg-slate-200 text-slate-800",
};

export default async function AusenciasPage() {
  const empresaId = (await getEmpresaId())!;
  const [absences, employees] = await Promise.all([
    listAbsences(empresaId),
    listEmployees(empresaId),
  ]);
  const employeeName = new Map(employees.map((e) => [e.id, e.nombre]));

  const sorted = [...absences].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ausencias</h1>
          <p className="mt-1 text-slate-500">
            Vacaciones, licencias y faltas cargadas por empleado.
          </p>
        </div>
        <Link href="/ausencias/nueva" className="btn-primary">
          Nueva ausencia
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Tipo</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Todavía no hay ausencias cargadas.
                </td>
              </tr>
            )}
            {sorted.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{employeeName.get(a.employeeId) ?? "—"}</td>
                <td>
                  <span className={`badge ${TIPO_STYLE[a.tipo]}`}>{a.tipo}</span>
                </td>
                <td>{a.fechaInicio}</td>
                <td>{a.fechaFin}</td>
                <td>{a.observaciones || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
