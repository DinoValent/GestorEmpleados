import Link from "next/link";
import LandingPage from "@/components/LandingPage";
import TeamHoursCard from "@/components/TeamHoursCard";
import TutorialHint from "@/components/TutorialHint";
import { getWeekRange } from "@/lib/calendar";
import { dailyHoursChart } from "@/lib/chartData";
import { listAttendance, listEmployees, todayISO } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const revalidate = 30;

export default async function Home() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return <LandingPage />;
  return <Dashboard empresaId={empresaId} />;
}

async function Dashboard({ empresaId }: { empresaId: string }) {
  const today = todayISO();
  const week = getWeekRange();

  const [employees, todayAttendance, weekAttendance] = await Promise.all([
    listEmployees(empresaId),
    listAttendance(empresaId, { dateFrom: today, dateTo: today }),
    listAttendance(empresaId, { dateFrom: week.from, dateTo: week.to }),
  ]);

  const activos = employees.filter((e) => e.estado === "Activo").length;
  const fichajesHoy = todayAttendance.length;
  const tardeHoy = todayAttendance.filter((a) => a.llegadaTarde).length;
  const weekChartData = dailyHoursChart(weekAttendance, week.from, week.to);
  const weekTotalHoras = weekAttendance.reduce((acc, r) => acc + (r.horasTrabajadas ?? 0), 0);

  const stats = [
    { label: "Empleados activos", value: activos, href: "/empleados" },
    { label: "Fichajes de hoy", value: fichajesHoy, href: "/asistencia" },
    { label: "Llegadas tarde hoy", value: tardeHoy, href: "/asistencia" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Panel general
          <TutorialHint
            title="Panel general"
            short="Un resumen rápido de tu equipo hoy."
            long="Acá ves de un vistazo cuántos empleados activos tenés, cuántos ficharon hoy y cuántas llegadas tarde hubo. Cada tarjeta es un acceso directo: hacé clic para ir a Empleados o Asistencia. En pantallas grandes también aparece un gráfico con las horas trabajadas por el equipo en la semana, que podés ocultar o mostrar cuando quieras."
          />
        </h1>
        <p className="mt-1 text-slate-500">
          Resumen del control de empleados, asistencia y horas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card p-4 hover:border-slate-300 sm:p-6"
          >
            <p className="text-xs text-slate-500 sm:text-sm">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">{s.value}</p>
          </Link>
        ))}
      </div>

      <TeamHoursCard data={weekChartData} label={week.label} totalHoras={weekTotalHoras} />

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
