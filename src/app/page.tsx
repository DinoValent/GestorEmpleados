import Link from "next/link";
import { listAttendance, listEmployees, todayISO } from "@/lib/notion";

export const revalidate = 30;

function monthRange(): { from: string; to: string } {
  const [y, m] = todayISO().split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` };
}

export default async function Home() {
  const today = todayISO();
  const { from, to } = monthRange();

  const [employees, todayAttendance, monthAttendance] = await Promise.all([
    listEmployees(),
    listAttendance({ dateFrom: today, dateTo: today }),
    listAttendance({ dateFrom: from, dateTo: to }),
  ]);

  const activos = employees.filter((e) => e.estado === "Activo").length;
  const fichajesHoy = todayAttendance.length;
  const tardeHoy = todayAttendance.filter((a) => a.llegadaTarde).length;
  const horasExtraMes = monthAttendance.reduce((sum, a) => sum + (a.horasExtra ?? 0), 0);

  const stats = [
    { label: "Empleados activos", value: activos, href: "/empleados" },
    { label: "Fichajes de hoy", value: fichajesHoy, href: "/asistencia" },
    { label: "Llegadas tarde hoy", value: tardeHoy, href: "/asistencia" },
    { label: "Horas extra (mes actual)", value: horasExtraMes.toFixed(1), href: "/reportes" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel general</h1>
        <p className="mt-1 text-slate-500">
          Resumen del control de empleados, asistencia y horas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:border-slate-300">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/asistencia" className="card hover:border-slate-300">
          <h2 className="font-medium">Fichar entrada / salida</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registrá la asistencia diaria del equipo.
          </p>
        </Link>
        <Link href="/empleados/nuevo" className="card hover:border-slate-300">
          <h2 className="font-medium">Nuevo empleado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cargá la ficha técnica de un nuevo empleado.
          </p>
        </Link>
        <Link href="/reportes" className="card hover:border-slate-300">
          <h2 className="font-medium">Reportes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Horas extra y llegadas tarde por período.
          </p>
        </Link>
      </div>
    </div>
  );
}
