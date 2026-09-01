import SendSummaryButton from "@/components/SendSummaryButton";
import WeeklySummaryPanel from "@/components/WeeklySummaryPanel";
import StackedHoursChart, { type HoursBar } from "@/components/charts/StackedHoursChart";
import { dailyHoursChart } from "@/lib/chartData";
import { DEFAULT_COST_PARAMS, estimateCost } from "@/lib/cost";
import { listAttendance, listEmployees, listHolidays, todayISO } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const dynamic = "force-dynamic";

function firstDayOfMonth(): string {
  const [y, m] = todayISO().split("-");
  return `${y}-${m}-01`;
}

function todayLocal(): string {
  return todayISO();
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    employeeId?: string;
    horasBase?: string;
    multiplicador?: string;
    multiplicadorFeriado?: string;
  }>;
}) {
  const empresaId = (await getEmpresaId())!;
  const sp = await searchParams;
  const dateFrom = sp.dateFrom || firstDayOfMonth();
  const dateTo = sp.dateTo || todayLocal();
  const employeeId = sp.employeeId || "";
  const costParams = {
    horasBase: Number(sp.horasBase) || DEFAULT_COST_PARAMS.horasBase,
    multiplicador: Number(sp.multiplicador) || DEFAULT_COST_PARAMS.multiplicador,
    multiplicadorFeriado:
      Number(sp.multiplicadorFeriado) || DEFAULT_COST_PARAMS.multiplicadorFeriado,
  };

  const [employees, records, holidays] = await Promise.all([
    listEmployees(empresaId),
    listAttendance(empresaId, { dateFrom, dateTo, employeeId: employeeId || undefined }),
    listHolidays(empresaId, dateFrom, dateTo),
  ]);
  const holidayDates = new Set(holidays.map((h) => h.fecha));
  const recordsByEmployee = new Map<string, typeof records>();
  for (const r of records) {
    const list = recordsByEmployee.get(r.employeeId) ?? [];
    list.push(r);
    recordsByEmployee.set(r.employeeId, list);
  }

  const employeeName = new Map(employees.map((e) => [e.id, e.nombre]));
  const employeeEmail = new Map(employees.map((e) => [e.id, e.email]));
  const employeeSalario = new Map(employees.map((e) => [e.id, e.salarioBase]));

  type Summary = {
    employeeId: string;
    nombre: string;
    horasTrabajadas: number;
    horasExtra: number;
    tardanzas: number;
    minutosTardanza: number;
  };

  const summaryMap = new Map<string, Summary>();
  for (const r of records) {
    const nombre = employeeName.get(r.employeeId) ?? r.registro;
    const s = summaryMap.get(r.employeeId) ?? {
      employeeId: r.employeeId,
      nombre,
      horasTrabajadas: 0,
      horasExtra: 0,
      tardanzas: 0,
      minutosTardanza: 0,
    };
    s.horasTrabajadas += r.horasTrabajadas ?? 0;
    s.horasExtra += r.horasExtra ?? 0;
    if (r.llegadaTarde) {
      s.tardanzas += 1;
      s.minutosTardanza += r.minutosTardanza ?? 0;
    }
    summaryMap.set(r.employeeId, s);
  }
  const summary = Array.from(summaryMap.values()).sort(
    (a, b) => b.horasExtra - a.horasExtra
  );
  const costos = new Map<string, number | null>(
    summary.map((s) => [
      s.employeeId,
      estimateCost(
        employeeSalario.get(s.employeeId) ?? null,
        recordsByEmployee.get(s.employeeId) ?? [],
        holidayDates,
        costParams
      ),
    ])
  );
  const totalCosto = Array.from(costos.values()).reduce(
    (acc: number, c) => acc + (c ?? 0),
    0
  );
  const exportUrl = `/api/reportes/export?dateFrom=${dateFrom}&dateTo=${dateTo}${
    employeeId ? `&employeeId=${employeeId}` : ""
  }&horasBase=${costParams.horasBase}&multiplicador=${costParams.multiplicador}&multiplicadorFeriado=${costParams.multiplicadorFeriado}`;

  const llegadasTarde = records
    .filter((r) => r.llegadaTarde)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  let chartData: HoursBar[];
  let chartTitle: string;
  if (employeeId) {
    chartData = dailyHoursChart(records, dateFrom, dateTo);
    chartTitle = `Horas por día — ${employeeName.get(employeeId) ?? ""}`;
  } else {
    chartData = summary.map((s) => ({
      key: s.employeeId,
      label: s.nombre.split(" ")[0],
      regular: Math.max(0, s.horasTrabajadas - s.horasExtra),
      extra: s.horasExtra,
    }));
    chartTitle = "Horas por empleado";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="mt-1 text-slate-500">
            Horas extra y llegadas tarde por período y empleado.
          </p>
        </div>
        <WeeklySummaryPanel
          employees={employees.map((e) => ({ id: e.id, nombre: e.nombre }))}
          defaultDateFrom={dateFrom}
          defaultDateTo={dateTo}
        />
      </div>

      <form className="card flex flex-wrap items-end gap-4" method="GET">
        <div>
          <label className="label">Desde</label>
          <input type="date" name="dateFrom" defaultValue={dateFrom} className="input" />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" name="dateTo" defaultValue={dateTo} className="input" />
        </div>
        <div>
          <label className="label">Empleado</label>
          <select name="employeeId" defaultValue={employeeId} className="input">
            <option value="">Todos</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Hs. base mensuales</label>
          <input
            type="number"
            name="horasBase"
            defaultValue={costParams.horasBase}
            className="input w-28"
          />
        </div>
        <div>
          <label className="label">Multiplicador extra</label>
          <input
            type="number"
            step="0.1"
            name="multiplicador"
            defaultValue={costParams.multiplicador}
            className="input w-28"
          />
        </div>
        <div>
          <label className="label">Multiplicador feriado</label>
          <input
            type="number"
            step="0.1"
            name="multiplicadorFeriado"
            defaultValue={costParams.multiplicadorFeriado}
            className="input w-28"
          />
        </div>
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
        <a href={exportUrl} className="btn-secondary">
          Exportar CSV
        </a>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{chartTitle}</h2>
        <div className="card">
          <StackedHoursChart data={chartData} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Horas por empleado</h2>
        <p className="mb-3 text-xs text-slate-400">
          El costo estimado es una aproximación: sueldo base ÷ {costParams.horasBase} hs
          + horas extra × {costParams.multiplicador}, y en los feriados todas las horas
          se pagan × {costParams.multiplicadorFeriado}. No reemplaza el cálculo real de
          nómina.
          {holidays.length > 0 && (
            <>
              {" "}
              Feriados en este período: {holidays.map((h) => `${h.fecha} (${h.nombre})`).join(", ")}.
            </>
          )}
        </p>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Horas trabajadas</th>
                <th>Horas extra</th>
                <th>Llegadas tarde</th>
                <th>Minutos de tardanza</th>
                <th>Costo estimado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hay fichajes en el período seleccionado.
                  </td>
                </tr>
              )}
              {summary.map((s) => {
                const costo = costos.get(s.employeeId) ?? null;
                return (
                  <tr key={s.employeeId}>
                    <td className="font-medium">{s.nombre}</td>
                    <td>{s.horasTrabajadas.toFixed(2)}</td>
                    <td>{s.horasExtra.toFixed(2)}</td>
                    <td>{s.tardanzas}</td>
                    <td>{s.minutosTardanza}</td>
                    <td>
                      {costo === null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        `$${costo.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
                      )}
                    </td>
                    <td>
                      <SendSummaryButton
                        employeeId={s.employeeId}
                        hasEmail={!!employeeEmail.get(s.employeeId)}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {summary.length > 0 && (
              <tfoot>
                <tr>
                  <td className="font-semibold">Total</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="font-semibold">
                    ${totalCosto.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Detalle de llegadas tarde</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Empleado</th>
                <th>Hora entrada</th>
                <th>Minutos de tardanza</th>
              </tr>
            </thead>
            <tbody>
              {llegadasTarde.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Sin llegadas tarde en el período seleccionado.
                  </td>
                </tr>
              )}
              {llegadasTarde.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha}</td>
                  <td className="font-medium">
                    {employeeName.get(r.employeeId) ?? r.registro}
                  </td>
                  <td>{r.horaEntrada}</td>
                  <td>{r.minutosTardanza ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
