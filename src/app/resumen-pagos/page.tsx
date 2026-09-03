import Link from "next/link";
import TutorialHint from "@/components/TutorialHint";
import { formatRangeLabel, getMonthRange, getWeekRange } from "@/lib/calendar";
import { listAttendance, listEmployees, listShiftAssignments, listShiftTemplates } from "@/lib/notion";
import { getQuincenaRange, nextQuincenaRef, prevQuincenaRef } from "@/lib/quincena";
import { getEmpresaId } from "@/lib/session";

export const dynamic = "force-dynamic";

type Tipo = "mes" | "semana" | "quincena";

interface Range {
  from: string;
  to: string;
  label: string;
  sublabel?: string;
  prevRef: string;
  nextRef: string;
}

const TIPO_INFO: Record<Tipo, { titulo: string; explicacion: string }> = {
  semana: {
    titulo: "Horas por semana",
    explicacion:
      "Total de horas trabajadas y horas extra de cada empleado en la semana seleccionada.",
  },
  quincena: {
    titulo: "Horas por quincena",
    explicacion:
      "Total de horas trabajadas y horas extra de cada empleado en la quincena seleccionada — pensado para el momento de liquidar sueldos.",
  },
  mes: {
    titulo: "Horas por mes",
    explicacion:
      "Total de horas trabajadas y horas extra de cada empleado en el mes seleccionado — un cierre mensual completo.",
  },
};

function getRange(tipo: Tipo, ref?: string): Range {
  if (tipo === "mes") {
    const r = getMonthRange(ref);
    return { from: r.from, to: r.to, label: formatRangeLabel(r.from, r.to), prevRef: r.prevRef, nextRef: r.nextRef };
  }
  if (tipo === "semana") {
    const r = getWeekRange(ref);
    return { from: r.from, to: r.to, label: r.label, prevRef: r.prevRef, nextRef: r.nextRef };
  }
  const r = getQuincenaRange(ref);
  return {
    from: r.from,
    to: r.to,
    label: formatRangeLabel(r.from, r.to),
    sublabel: `${r.num}.ª quincena`,
    prevRef: prevQuincenaRef(r),
    nextRef: nextQuincenaRef(r),
  };
}

export default async function ResumenPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; ref?: string }>;
}) {
  const empresaId = (await getEmpresaId())!;
  const sp = await searchParams;
  const tipo: Tipo = sp.tipo === "mes" || sp.tipo === "semana" ? sp.tipo : "quincena";
  const range = getRange(tipo, sp.ref);
  const info = TIPO_INFO[tipo];

  const [employees, records, shifts] = await Promise.all([
    listEmployees(empresaId),
    listAttendance(empresaId, { dateFrom: range.from, dateTo: range.to }),
    listShiftTemplates(empresaId),
  ]);
  const shiftById = new Map(shifts.map((s) => [s.id, s]));

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

  const scheduleStatusEntries = await Promise.all(
    activos.map(async (e) => {
      const assignments = await listShiftAssignments(empresaId, e.id);
      const overlapping = assignments.filter(
        (a) => a.fechaInicio <= range.to && (a.fechaFin === null || a.fechaFin >= range.from)
      );
      return [
        e.id,
        {
          rotativo: overlapping.some((a) => !a.esFijo),
          turnoFijoVariable: overlapping.some((a) => a.esFijo),
        },
      ] as const;
    })
  );
  const scheduleStatusByEmployee = new Map(scheduleStatusEntries);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            Resumen de pagos
            <TutorialHint
              title="Resumen de pagos"
              short="Horas totales por empleado, listas para liquidar."
              long="Elegí si querés ver el resumen por semana, quincena o mes con el selector de arriba, y navegá entre períodos con los botones de anterior/siguiente. Para cada empleado ves cuántas veces fichó, sus horas trabajadas y sus horas extra en ese período — pensado para el momento de calcular sueldos. Si un empleado tiene turno rotativo, en vez del horario fijo vas a ver la etiqueta 'Rotativo'."
            />
          </h1>
          <p className="mt-1 text-sm text-slate-500">{info.explicacion}</p>
          <p className="mt-2 flex items-center gap-2 text-slate-700">
            <span className="font-medium">{range.label}</span>
            {range.sublabel && <span className="badge-gray">{range.sublabel}</span>}
          </p>
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
        <Link href={`/resumen-pagos?tipo=${tipo}&ref=${range.prevRef}`} className="btn-secondary">
          ← Anterior
        </Link>
        <Link href={`/resumen-pagos?tipo=${tipo}`} className="btn-secondary">
          Actual
        </Link>
        <Link href={`/resumen-pagos?tipo=${tipo}&ref=${range.nextRef}`} className="btn-secondary">
          Siguiente →
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Horario habitual</th>
              <th>Fichajes</th>
              <th>Horas trabajadas</th>
              <th>Horas extra</th>
            </tr>
          </thead>
          <tbody>
            {activos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No hay empleados activos.
                </td>
              </tr>
            )}
            {activos.map((e) => {
              const row = totals.get(e.id)!;
              const shift = e.shiftId ? shiftById.get(e.shiftId) : undefined;
              const status = scheduleStatusByEmployee.get(e.id);
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.nombre}</td>
                  <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {status?.rotativo ? (
                      <span className="badge bg-indigo-100 text-indigo-700">Rotativo</span>
                    ) : status?.turnoFijoVariable ? (
                      <span className="badge bg-emerald-100 text-emerald-800">Turno fijo</span>
                    ) : shift ? (
                      <>
                        {shift.horaEntrada} a {shift.horaSalida}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
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
