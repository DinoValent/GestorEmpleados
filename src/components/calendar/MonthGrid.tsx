import Link from "next/link";
import { colorForEmployee, recordSpan, todayISO } from "@/lib/calendar";
import type { AttendanceRecord, Employee, Holiday } from "@/lib/types";

const DIA_LABEL = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export default function MonthGrid({
  weeks,
  month,
  recordsByDay,
  employees,
  holidays = [],
}: {
  weeks: string[][];
  month: number;
  recordsByDay: Map<string, AttendanceRecord[]>;
  employees: Employee[];
  holidays?: Holiday[];
}) {
  const today = todayISO();
  const holidayByDate = new Map(holidays.map((h) => [h.fecha, h]));

  return (
    <div className="card p-0">
      <div className="overflow-x-auto">
      <div style={{ minWidth: 760 }}>
        <div className="grid grid-cols-7 border-b border-slate-200">
          {DIA_LABEL.map((d) => (
            <div
              key={d}
              className="border-l border-slate-200 py-2 text-center text-[11px] font-semibold tracking-wide text-slate-400 first:border-l-0"
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
            {week.map((d) => {
              const date = new Date(`${d}T00:00:00`);
              const inMonth = date.getMonth() === month;
              const isToday = d === today;
              const records = recordsByDay.get(d) ?? [];
              const totalHours = records.reduce((acc, r) => {
                const { startMin, endMin } = recordSpan(r);
                return acc + (endMin - startMin) / 60;
              }, 0);
              const employeeIds = Array.from(new Set(records.map((r) => r.employeeId)));
              const hasLate = records.some((r) => r.llegadaTarde);
              const holiday = holidayByDate.get(d);

              return (
                <Link
                  key={d}
                  href={`/calendario?view=day&ref=${d}`}
                  className={`relative flex min-h-[92px] flex-col gap-1.5 border-l border-slate-100 p-2 first:border-l-0 hover:bg-slate-50 ${
                    holiday ? "bg-amber-50/60" : inMonth ? "" : "bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"
                          : inMonth
                            ? "text-slate-700"
                            : "text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {hasLate && (
                      <span
                        className="h-2 w-2 rounded-full bg-red-500"
                        title="Hubo llegadas tarde"
                      />
                    )}
                  </div>
                  {holiday && (
                    <p className="truncate text-[10px] font-medium text-amber-700" title={holiday.nombre}>
                      🎉 {holiday.nombre}
                    </p>
                  )}
                  {records.length > 0 && (
                    <>
                      <p className="font-mono text-xs font-semibold text-slate-600">
                        {totalHours.toFixed(1)} hs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {employeeIds.slice(0, 5).map((id) => (
                          <span
                            key={id}
                            className="h-2 w-2 rounded-full"
                            style={{ background: colorForEmployee(id).border }}
                            title={employees.find((e) => e.id === id)?.nombre}
                          />
                        ))}
                        {employeeIds.length > 5 && (
                          <span className="text-[10px] text-slate-400">
                            +{employeeIds.length - 5}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
