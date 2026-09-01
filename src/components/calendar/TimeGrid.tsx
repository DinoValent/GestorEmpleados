import { absenceOnDate, recordSpan, todayISO } from "@/lib/calendar";
import type { Absence, AttendanceRecord, Employee, Holiday } from "@/lib/types";

const DIA_LABEL = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const NAME_COL = 160;
const HOUR_WIDTH = 60;
const ROW_HEIGHT = 48;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type Status = "ongoing" | "late" | "onTime";

const STATUS_STYLE: Record<Status, { bg: string; border: string; text: string }> = {
  ongoing: { bg: "#EEF2FF", border: "#818CF8", text: "#4338CA" },
  late: { bg: "#FEF2F2", border: "#F87171", text: "#B91C1C" },
  onTime: { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46" },
};

function statusOf(r: AttendanceRecord): Status {
  if (!r.horaSalida) return "ongoing";
  if (r.llegadaTarde) return "late";
  return "onTime";
}

function timeLabel(r: AttendanceRecord): string {
  const status = statusOf(r);
  if (status === "ongoing") return `${r.horaEntrada} · en curso`;
  return `${r.horaEntrada}–${r.horaSalida}`;
}

function hourBoundsFor(records: AttendanceRecord[]): { startHour: number; endHour: number } {
  if (records.length === 0) return { startHour: 9, endHour: 18 };
  let min = Infinity;
  let max = -Infinity;
  for (const r of records) {
    const { startMin, endMin } = recordSpan(r);
    min = Math.min(min, startMin);
    max = Math.max(max, endMin);
  }
  const startHour = Math.max(0, Math.floor(min / 60));
  const endHour = Math.min(24, Math.ceil(max / 60));
  return { startHour, endHour: Math.max(endHour, startHour + 2) };
}

export default function TimeGrid({
  days,
  recordsByDay,
  employees,
  absences = [],
  holidays = [],
}: {
  days: string[];
  recordsByDay: Map<string, AttendanceRecord[]>;
  employees: Employee[];
  absences?: Absence[];
  holidays?: Holiday[];
}) {
  const isWeek = days.length > 1;

  if (employees.length === 0) {
    return (
      <div className="card flex h-40 items-center justify-center text-sm text-slate-400">
        No hay empleados activos.
      </div>
    );
  }

  return (
    <div className="card p-0">
      <div className="overflow-x-auto">
        {isWeek ? (
          <WeekRoster
            days={days}
            recordsByDay={recordsByDay}
            employees={employees}
            absences={absences}
            holidays={holidays}
          />
        ) : (
          <DayTimeline
            date={days[0]}
            records={recordsByDay.get(days[0]) ?? []}
            employees={employees}
            absences={absences}
          />
        )}
      </div>
    </div>
  );
}

function absenceLabel(a: Absence): string {
  return a.tipo === "Licencia medica" ? "Lic. médica" : a.tipo === "Licencia personal" ? "Lic. personal" : a.tipo;
}

function AbsenceChip({ absence }: { absence: Absence }) {
  return (
    <div
      className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-1.5 py-1 text-center text-[11px] font-medium italic text-slate-500"
      title={absenceLabel(absence)}
    >
      {absenceLabel(absence)}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-2 text-[11px] text-slate-500">
      {(
        [
          ["onTime", "A tiempo"],
          ["late", "Llegada tarde"],
          ["ongoing", "En curso"],
        ] as [Status, string][]
      ).map(([status, label]) => (
        <span key={status} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{
              background: STATUS_STYLE[status].bg,
              border: `1.5px solid ${STATUS_STYLE[status].border}`,
            }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

function DayTimeline({
  date,
  records,
  employees,
  absences,
}: {
  date: string;
  records: AttendanceRecord[];
  employees: Employee[];
  absences: Absence[];
}) {
  const { startHour, endHour } = hourBoundsFor(records);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const trackWidth = hours.length * HOUR_WIDTH;
  const isToday = date === todayISO();

  return (
    <div style={{ minWidth: NAME_COL + trackWidth }}>
      <Legend />
      <div className="flex border-b border-slate-200">
        <div className="shrink-0 border-r border-slate-200" style={{ width: NAME_COL }} />
        <div className="relative flex" style={{ width: trackWidth }}>
          {hours.map((h) => (
            <div
              key={h}
              className="shrink-0 border-l border-slate-100 py-2 text-center font-mono text-[11px] text-slate-400"
              style={{ width: HOUR_WIDTH }}
            >
              {pad(h)}:00
            </div>
          ))}
        </div>
      </div>

      {employees.map((emp) => {
        const empRecords = records.filter((r) => r.employeeId === emp.id);
        const absence = absenceOnDate(absences, emp.id, date);
        return (
          <div key={emp.id} className="flex border-b border-slate-100 last:border-b-0">
            <div
              className="flex shrink-0 items-center border-r border-slate-200 px-3 text-sm font-medium text-slate-700"
              style={{ width: NAME_COL, height: ROW_HEIGHT }}
            >
              <span className="truncate">{emp.nombre}</span>
            </div>
            <div
              className={`relative ${isToday ? "bg-indigo-50/30" : ""}`}
              style={{ width: trackWidth, height: ROW_HEIGHT }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 border-l border-slate-100"
                  style={{ left: (h - startHour) * HOUR_WIDTH }}
                />
              ))}
              {empRecords.length === 0 && absence && (
                <div className="absolute inset-1.5 flex items-center">
                  <AbsenceChip absence={absence} />
                </div>
              )}
              {empRecords.length === 0 && !absence && (
                <span className="absolute inset-0 flex items-center px-3 text-xs text-slate-300">
                  Sin fichaje
                </span>
              )}
              {empRecords.map((r) => {
                const { startMin, endMin } = recordSpan(r);
                const left = ((startMin - startHour * 60) / 60) * HOUR_WIDTH;
                const width = Math.max(6, ((endMin - startMin) / 60) * HOUR_WIDTH);
                const style = STATUS_STYLE[statusOf(r)];
                return (
                  <div
                    key={r.id}
                    className="absolute top-1/2 flex -translate-y-1/2 items-center overflow-hidden rounded-md px-2 py-1.5 text-[11px] font-medium shadow-sm"
                    style={{
                      left,
                      width,
                      minWidth: 46,
                      background: style.bg,
                      border: `1.5px solid ${style.border}`,
                      color: style.text,
                    }}
                    title={`${emp.nombre} · ${timeLabel(r)}`}
                  >
                    <span className="truncate font-mono">{timeLabel(r)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekRoster({
  days,
  recordsByDay,
  employees,
  absences,
  holidays,
}: {
  days: string[];
  recordsByDay: Map<string, AttendanceRecord[]>;
  employees: Employee[];
  absences: Absence[];
  holidays: Holiday[];
}) {
  const today = todayISO();
  const holidayByDate = new Map(holidays.map((h) => [h.fecha, h]));

  return (
    <div style={{ minWidth: NAME_COL + days.length * 128 }}>
      <Legend />
      <div className="flex border-b border-slate-200">
        <div className="shrink-0 border-r border-slate-200" style={{ width: NAME_COL }} />
        {days.map((d) => {
          const date = new Date(`${d}T00:00:00`);
          const isToday = d === today;
          const holiday = holidayByDate.get(d);
          return (
            <div
              key={d}
              className={`min-w-[128px] flex-1 border-l border-slate-100 py-2 text-center ${
                holiday ? "bg-amber-50" : isToday ? "bg-indigo-50" : ""
              }`}
            >
              <p className="text-[11px] font-semibold tracking-wide text-slate-400">
                {DIA_LABEL[date.getDay() === 0 ? 6 : date.getDay() - 1]}
              </p>
              <p className={`text-sm font-semibold ${isToday ? "text-indigo-700" : "text-slate-700"}`}>
                {date.getDate()}
              </p>
              {holiday && (
                <p className="truncate px-1 text-[10px] font-medium text-amber-700" title={holiday.nombre}>
                  🎉 {holiday.nombre}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {employees.map((emp) => (
        <div key={emp.id} className="flex border-b border-slate-100 last:border-b-0">
          <div
            className="flex shrink-0 items-center border-r border-slate-200 px-3 text-sm font-medium text-slate-700"
            style={{ width: NAME_COL }}
          >
            <span className="truncate">{emp.nombre}</span>
          </div>
          {days.map((d) => {
            const dayRecords = (recordsByDay.get(d) ?? []).filter((r) => r.employeeId === emp.id);
            const isToday = d === today;
            const absence = dayRecords.length === 0 ? absenceOnDate(absences, emp.id, d) : undefined;
            return (
              <div
                key={d}
                className={`flex min-w-[128px] flex-1 flex-col justify-center gap-1 border-l border-slate-100 px-1.5 py-1.5 ${
                  isToday ? "bg-indigo-50/30" : ""
                }`}
              >
                {dayRecords.length === 0 ? (
                  absence ? (
                    <AbsenceChip absence={absence} />
                  ) : (
                    <span className="text-center text-sm text-slate-200">–</span>
                  )
                ) : (
                  dayRecords.map((r) => {
                    const style = STATUS_STYLE[statusOf(r)];
                    return (
                      <div
                        key={r.id}
                        className="rounded-md px-1.5 py-1 text-center font-mono text-[11px] font-medium"
                        style={{
                          background: style.bg,
                          border: `1.5px solid ${style.border}`,
                          color: style.text,
                        }}
                        title={`${emp.nombre} · ${timeLabel(r)}`}
                      >
                        {timeLabel(r)}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
