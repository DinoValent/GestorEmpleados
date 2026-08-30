import Link from "next/link";
import AttendanceBoard from "@/components/AttendanceBoard";
import { formatRangeLabel } from "@/lib/calendar";
import { listAttendance, listEmployees, todayISO } from "@/lib/notion";

export const revalidate = 30;

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const today = todayISO();
  const date = sp.date || today;
  const isToday = date === today;

  const [employees, records] = await Promise.all([
    listEmployees(),
    listAttendance({ dateFrom: date, dateTo: date }),
  ]);

  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Asistencia</h1>
          <p className="mt-1 text-slate-500">
            Registrá la entrada y salida de cada empleado. Las llegadas tarde y las
            horas extra se calculan automáticamente.
          </p>
        </div>
        <form method="GET" className="flex items-end gap-2">
          <div>
            <label className="label">Fecha</label>
            <input type="date" name="date" defaultValue={date} className="input" />
          </div>
          <button type="submit" className="btn-secondary">
            Ver
          </button>
          {!isToday && (
            <Link href="/asistencia" className="btn-secondary">
              Hoy
            </Link>
          )}
        </form>
      </div>
      <AttendanceBoard
        employees={activos}
        records={records}
        isToday={isToday}
        dateLabel={formatRangeLabel(date, date)}
      />
    </div>
  );
}
