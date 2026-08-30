import Link from "next/link";
import MonthGrid from "@/components/calendar/MonthGrid";
import TimeGrid from "@/components/calendar/TimeGrid";
import { getDayRange, getMonthRange, getWeekRange } from "@/lib/calendar";
import { listAttendance, listEmployees } from "@/lib/notion";
import type { AttendanceRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

function groupByDay(records: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = map.get(r.fecha) ?? [];
    list.push(r);
    map.set(r.fecha, list);
  }
  return map;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const view: View = sp.view === "day" || sp.view === "month" ? sp.view : "week";

  const employees = await listEmployees();
  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (view === "day") {
    const range = getDayRange(sp.ref);
    const records = await listAttendance({ dateFrom: range.date, dateTo: range.date });
    return (
      <div className="space-y-6">
        <Header
          view={view}
          refDate={range.date}
          label={range.label}
          prevRef={range.prevRef}
          nextRef={range.nextRef}
          count={records.length}
        />
        <TimeGrid days={[range.date]} recordsByDay={groupByDay(records)} employees={activos} />
      </div>
    );
  }

  if (view === "month") {
    const range = getMonthRange(sp.ref);
    const from = range.weeks[0][0];
    const to = range.weeks[range.weeks.length - 1][6];
    const records = await listAttendance({ dateFrom: from, dateTo: to });
    return (
      <div className="space-y-6">
        <Header
          view={view}
          refDate={range.from}
          label={range.label}
          prevRef={range.prevRef}
          nextRef={range.nextRef}
          count={records.length}
        />
        <MonthGrid
          weeks={range.weeks}
          month={range.month}
          recordsByDay={groupByDay(records)}
          employees={employees}
        />
      </div>
    );
  }

  const range = getWeekRange(sp.ref);
  const records = await listAttendance({ dateFrom: range.from, dateTo: range.to });
  return (
    <div className="space-y-6">
      <Header
        view={view}
        refDate={range.from}
        label={range.label}
        prevRef={range.prevRef}
        nextRef={range.nextRef}
        count={records.length}
      />
      <TimeGrid days={range.days} recordsByDay={groupByDay(records)} employees={activos} />
    </div>
  );
}

function Header({
  view,
  refDate,
  label,
  prevRef,
  nextRef,
  count,
}: {
  view: View;
  refDate: string;
  label: string;
  prevRef: string;
  nextRef: string;
  count: number;
}) {
  const VIEW_LABELS: Record<View, string> = { day: "Día", week: "Semana", month: "Mes" };
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendario de asistencia</h1>
        <p className="mt-1 text-sm text-slate-500">
          {count} fichaje{count === 1 ? "" : "s"} en este período
        </p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Link
              href={`/calendario?view=${view}&ref=${prevRef}`}
              aria-label="Período anterior"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            >
              ‹
            </Link>
            <Link href={`/calendario?view=${view}`} className="btn-secondary">
              Hoy
            </Link>
            <Link
              href={`/calendario?view=${view}&ref=${nextRef}`}
              aria-label="Período siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            >
              ›
            </Link>
          </div>
          <p className="text-base font-semibold text-slate-800">{label}</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["day", "week", "month"] as View[]).map((v) => (
            <Link
              key={v}
              href={`/calendario?view=${v}&ref=${refDate}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                v === view ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {VIEW_LABELS[v]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
