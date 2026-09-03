import CheckInWidget from "@/components/CheckInWidget";
import TutorialHint from "@/components/TutorialHint";
import StackedHoursChart from "@/components/charts/StackedHoursChart";
import HoursRangePicker, { type RangoTipo } from "@/components/HoursRangePicker";
import { auth } from "@/lib/auth";
import { formatRangeLabel, getMonthRange, getWeekRange } from "@/lib/calendar";
import { dailyHoursChart } from "@/lib/chartData";
import { getEmployee, listAttendance, todayISO } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function MiFichajePage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; from?: string; to?: string }>;
}) {
  const session = await auth();
  const employeeId = session?.user?.employeeId;
  const empresaId = session?.user?.empresaId;

  if (!employeeId || !empresaId) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <p className="text-slate-600">
            Tu cuenta no está vinculada a un empleado. Pedile al administrador que la
            asocie desde la sección Usuarios.
          </p>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const rango: RangoTipo =
    sp.rango === "mes" || sp.rango === "custom" ? sp.rango : "semana";

  let dateFrom: string;
  let dateTo: string;
  let rangeLabel: string;
  if (rango === "mes") {
    const r = getMonthRange();
    dateFrom = r.from;
    dateTo = r.to;
    rangeLabel = r.label;
  } else if (rango === "custom") {
    dateFrom = sp.from || todayISO();
    dateTo = sp.to || todayISO();
    rangeLabel = formatRangeLabel(dateFrom, dateTo);
  } else {
    const r = getWeekRange();
    dateFrom = r.from;
    dateTo = r.to;
    rangeLabel = r.label;
  }

  const today = todayISO();
  const [employee, todayRecords, rangeRecords] = await Promise.all([
    getEmployee(employeeId, empresaId),
    listAttendance(empresaId, { employeeId, dateFrom: today, dateTo: today }),
    listAttendance(empresaId, { employeeId, dateFrom, dateTo }),
  ]);

  const chartData = dailyHoursChart(rangeRecords, dateFrom, dateTo);
  const totalHoras = rangeRecords.reduce((acc, r) => acc + (r.horasTrabajadas ?? 0), 0);
  const totalExtra = rangeRecords.reduce((acc, r) => acc + (r.horasExtra ?? 0), 0);

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-md">
        <CheckInWidget employeeName={employee.nombre} records={todayRecords} />
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            Mis horas
            <TutorialHint
              title="Mis horas"
              short="Tus fichajes y horas trabajadas."
              long="Arriba fichás tu entrada y salida — necesitamos tu ubicación en ese momento para que el fichaje sea válido, así que asegurate de tener el permiso de ubicación activado. Acá abajo podés ver cuántas horas trabajaste y cuántas fueron extra, elegir semana, mes o un rango de fechas particular, y ver el detalle día por día en el gráfico."
            />
          </h2>
          <p className="text-sm text-slate-500">{rangeLabel}</p>
        </div>

        <HoursRangePicker rango={rango} from={dateFrom} to={dateTo} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="card">
            <p className="text-sm text-slate-500">Horas trabajadas</p>
            <p className="mt-1 text-2xl font-semibold">{totalHoras.toFixed(1)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Horas extra</p>
            <p className="mt-1 text-2xl font-semibold">{totalExtra.toFixed(1)}</p>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <StackedHoursChart
            data={chartData}
            emptyLabel="No tenés fichajes en este período."
          />
        </div>
      </div>
    </div>
  );
}
