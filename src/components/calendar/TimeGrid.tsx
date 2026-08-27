import Link from "next/link";
import {
  colorForEmployee,
  hourBounds,
  layoutDayBlocks,
  toISO,
} from "@/lib/calendar";
import type { AttendanceRecord, Employee } from "@/lib/types";

const ROW_HEIGHT = 56;
const DIA_LABEL = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function TimeGrid({
  days,
  recordsByDay,
  employees,
}: {
  days: string[];
  recordsByDay: Map<string, AttendanceRecord[]>;
  employees: Employee[];
}) {
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.nombre ?? "—";
  const allRecords = days.flatMap((d) => recordsByDay.get(d) ?? []);
  const { startHour, endHour } = hourBounds(allRecords);
  const totalHeight = (endHour - startHour) * ROW_HEIGHT;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const today = toISO(new Date());
  const isWeek = days.length > 1;

  return (
    <div className="card p-0">
      <div className="overflow-x-auto">
        <div style={{ minWidth: isWeek ? 760 : 320 }}>
          <div className="flex border-b border-slate-200">
          <div className="w-16 shrink-0" />
          {days.map((d) => {
            const date = new Date(`${d}T00:00:00`);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`flex-1 border-l border-slate-200 py-3 text-center ${
                  isToday ? "bg-indigo-50" : ""
                }`}
              >
                {isWeek && (
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400">
                    {DIA_LABEL[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                  </p>
                )}
                <p
                  className={`mt-0.5 text-lg font-semibold ${
                    isToday ? "text-indigo-700" : "text-slate-800"
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex">
          <div className="w-16 shrink-0">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: ROW_HEIGHT }}
                className="relative border-r border-slate-200"
              >
                <span className="absolute -top-2 right-2 text-[11px] text-slate-400 font-mono">
                  {pad(h)}:00
                </span>
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayRecords = recordsByDay.get(d) ?? [];
            const blocks = layoutDayBlocks(dayRecords, employeeName);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`relative flex-1 border-l border-slate-200 ${
                  isToday ? "bg-indigo-50/40" : ""
                }`}
                style={{ height: totalHeight }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: ROW_HEIGHT }}
                    className="border-b border-slate-100"
                  />
                ))}
                {blocks.map((b) => {
                  const color = colorForEmployee(b.record.employeeId);
                  const top = ((b.startMin - startHour * 60) / 60) * ROW_HEIGHT;
                  const height = Math.max(
                    22,
                    ((b.endMin - b.startMin) / 60) * ROW_HEIGHT - 2
                  );
                  const widthPct = 100 / b.lanes;
                  return (
                    <Link
                      key={b.record.id}
                      href={`/calendario?view=day&ref=${d}`}
                      style={{
                        top,
                        height,
                        left: `${b.lane * widthPct}%`,
                        width: `calc(${widthPct}% - 4px)`,
                        background: color.bg,
                        borderLeft: `3px solid ${color.border}`,
                        color: color.text,
                      }}
                      className="absolute mx-0.5 overflow-hidden rounded-sm px-2 py-1 text-xs shadow-sm hover:brightness-95"
                      title={`${b.employeeName} · ${pad(Math.floor(b.startMin / 60))}:${pad(
                        b.startMin % 60
                      )} - ${b.ongoing ? "en curso" : `${pad(Math.floor(b.endMin / 60))}:${pad(b.endMin % 60)}`}`}
                    >
                      <p className="font-mono font-semibold leading-tight">
                        {pad(Math.floor(b.startMin / 60))}:{pad(b.startMin % 60)}
                        {b.ongoing && " ·"}
                      </p>
                      <p className="truncate leading-tight">{b.employeeName}</p>
                    </Link>
                  );
                })}
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
