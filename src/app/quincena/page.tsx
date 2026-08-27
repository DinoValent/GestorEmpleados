import Link from "next/link";
import { getMonthRange, getWeekRange } from "@/lib/calendar";
import { listAttendance, listEmployees } from "@/lib/notion";
import { getQuincenaRange, nextQuincenaRef, prevQuincenaRef } from "@/lib/quincena";

export const dynamic = "force-dynamic";

type Tipo = "mes" | "semana" | "quincena";

interface Range {
  from: string;
  to: string;
  label: string;
  prevRef: string;
  nextRef: string;
}

function getRange(tipo: Tipo, ref?: string): Range {
  if (tipo === "mes") {
    const r = getMonthRange(ref);
    return { from: r.from, to: r.to, label: r.label, prevRef: r.prevRef, nextRef: r.nextRef };
  }
  if (tipo === "semana") {
    const r = getWeekRange(ref);
    return { from: r.from, to: r.to, label: r.label, prevRef: r.prevRef, nextRef: r.nextRef };
  }
  const r = getQuincenaRange(ref);
  return { from: r.from, to: r.to, label: r.label, prevRef: prevQuincenaRef(r), nextRef: nextQuincenaRef(r) };
}

export default async function QuincenaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const tipo: Tipo = sp.tipo === "mes" || sp.tipo === "semana" ? sp.tipo : "quincena";
  const range = getRange(tipo, sp.ref);

  const [employees, records] = await Promise.all([
    listEmployees(),
    listAttendance({ dateFrom: range.from, dateTo: range.to }),
  ]);

  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  type Row = { horasTrabajadas: number; horasExtra: number; fichajes: number };
  const totals = new Map<string, Row>();
  for (const emp of activos) totals.set(emp.id, { horasTrabajadas: 0, horasExtra: 0, fichajes: 0 });
  for (const r of records) {
    const row = totals.get(r.employeeId);
    if (!row) continue;
    row.horasTrabajadas += r.horasTrabajadas ?? 0;
    row.horasExtra += r.horasExtra ?? 0;
    row.fichajes += 1;
  }

  const totalGeneral = activos.reduce(
    (acc, e) => acc + (totals.get(e.id)?.horasTrabajadas ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Horas por período</h1>
          <p className="mt-1 text-slate-500">{range.label}</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select name="tipo" defaultValue={tipo} className="input w-auto">
            <option value="semana">Semana</option>
            <option value="quincena">Quincena</option>
            <option value="mes">Mes</option>
          </select>
          <button type="submit" className="btn-secondary">
            Ver
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/quincena?tipo=${tipo}&ref=${range.prevRef}`} className="btn-secondary">
          ← Anterior
        </Link>
        <Link href={`/quincena?tipo=${tipo}`} className="btn-secondary">
          Actual
        </Link>
        <Link href={`/quincena?tipo=${tipo}&ref=${range.nextRef}`} className="btn-secondary">
          Siguiente →
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Fichajes</th>
              <th>Horas trabajadas</th>
              <th>Horas extra</th>
            </tr>
          </thead>
          <tbody>
            {activos.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No hay empleados activos.
                </td>
              </tr>
            )}
            {activos.map((e) => {
              const row = totals.get(e.id)!;
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.nombre}</td>
                  <td className="font-mono tabular-nums">{row.fichajes}</td>
                  <td className="font-mono tabular-nums">{row.horasTrabajadas.toFixed(2)}</td>
                  <td className="font-mono tabular-nums">{row.horasExtra.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          {activos.length > 0 && (
            <tfoot>
              <tr>
                <td className="font-semibold">Total</td>
                <td></td>
                <td className="font-semibold font-mono tabular-nums">{totalGeneral.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
