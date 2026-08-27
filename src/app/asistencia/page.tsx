import AttendanceBoard from "@/components/AttendanceBoard";
import { listAttendance, listEmployees, todayISO } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function AsistenciaPage() {
  const today = todayISO();
  const [employees, records] = await Promise.all([
    listEmployees(),
    listAttendance({ dateFrom: today, dateTo: today }),
  ]);

  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Asistencia</h1>
        <p className="mt-1 text-slate-500">
          Registrá la entrada y salida de cada empleado. Las llegadas tarde y las
          horas extra se calculan automáticamente.
        </p>
      </div>
      <AttendanceBoard employees={activos} records={records} />
    </div>
  );
}
