import type { Absence, AttendanceRecord } from "./types";
import { nowHHMM, todayISO } from "./timezone";

export { todayISO };

export function absenceOnDate(
  absences: Absence[],
  employeeId: string,
  date: string
): Absence | undefined {
  return absences.find(
    (a) => a.employeeId === employeeId && date >= a.fechaInicio && date <= a.fechaFin
  );
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** A local Date for "today" in Argentina, not the server's own timezone. */
function todayAsDate(): Date {
  return parseISO(todayISO());
}

export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function formatRangeLabel(fromISO: string, toISO_: string): string {
  const from = parseISO(fromISO);
  const to = parseISO(toISO_);
  if (fromISO === toISO_) {
    return `${from.getDate()} de ${MESES[from.getMonth()]} de ${from.getFullYear()}`;
  }
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  return sameMonth
    ? `${from.getDate()} - ${to.getDate()} de ${MESES[from.getMonth()]} de ${to.getFullYear()}`
    : `${from.getDate()} de ${MESES[from.getMonth()]} - ${to.getDate()} de ${MESES[to.getMonth()]} de ${to.getFullYear()}`;
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ---------- day view ----------

export interface DayRange {
  view: "day";
  date: string;
  label: string;
  prevRef: string;
  nextRef: string;
}

export function getDayRange(refISO?: string): DayRange {
  const ref = refISO ? parseISO(refISO) : todayAsDate();
  const prev = new Date(ref);
  prev.setDate(ref.getDate() - 1);
  const next = new Date(ref);
  next.setDate(ref.getDate() + 1);
  const label = `${DIAS_CORTOS_LARGO[ref.getDay() === 0 ? 6 : ref.getDay() - 1]} ${ref.getDate()} de ${MESES[ref.getMonth()]} de ${ref.getFullYear()}`;
  return { view: "day", date: toISO(ref), label, prevRef: toISO(prev), nextRef: toISO(next) };
}
const DIAS_CORTOS_LARGO = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// ---------- week view ----------

export interface WeekRange {
  view: "week";
  days: string[];
  from: string;
  to: string;
  label: string;
  prevRef: string;
  nextRef: string;
}

export function getWeekRange(refISO?: string): WeekRange {
  const ref = refISO ? parseISO(refISO) : todayAsDate();
  const monday = startOfWeek(ref);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const sunday = days[6];
  const prev = new Date(monday);
  prev.setDate(monday.getDate() - 7);
  const next = new Date(monday);
  next.setDate(monday.getDate() + 7);

  const sameMonth = monday.getMonth() === sunday.getMonth();
  const label = sameMonth
    ? `${monday.getDate()} - ${sunday.getDate()} de ${MESES[monday.getMonth()]} de ${sunday.getFullYear()}`
    : `${monday.getDate()} de ${MESES[monday.getMonth()]} - ${sunday.getDate()} de ${MESES[sunday.getMonth()]} de ${sunday.getFullYear()}`;

  return {
    view: "week",
    days: days.map(toISO),
    from: toISO(monday),
    to: toISO(sunday),
    label,
    prevRef: toISO(prev),
    nextRef: toISO(next),
  };
}

// ---------- month view ----------

export interface MonthRange {
  view: "month";
  year: number;
  month: number;
  from: string;
  to: string;
  weeks: string[][];
  label: string;
  prevRef: string;
  nextRef: string;
}

export function getMonthRange(refISO?: string): MonthRange {
  const ref = refISO ? parseISO(refISO) : todayAsDate();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const gridStart = startOfWeek(firstOfMonth);

  const weeks: string[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(toISO(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const prev = new Date(year, month - 1, 15);
  const next = new Date(year, month + 1, 15);

  return {
    view: "month",
    year,
    month,
    from: toISO(firstOfMonth),
    to: toISO(lastOfMonth),
    weeks,
    label: `${MESES[month][0].toUpperCase()}${MESES[month].slice(1)} ${year}`,
    prevRef: toISO(prev),
    nextRef: toISO(next),
  };
}

// ---------- employee colors ----------

const PALETTE = [
  { bg: "#EDE9FE", border: "#7C3AED", text: "#5B21B6" },
  { bg: "#D1FAE5", border: "#059669", text: "#065F46" },
  { bg: "#FEE2E2", border: "#DC2626", text: "#991B1B" },
  { bg: "#DBEAFE", border: "#2563EB", text: "#1E40AF" },
  { bg: "#FEF3C7", border: "#D97706", text: "#92400E" },
  { bg: "#FCE7F3", border: "#DB2777", text: "#9D174D" },
  { bg: "#E0F2FE", border: "#0284C7", text: "#075985" },
  { bg: "#ECFCCB", border: "#65A30D", text: "#3F6212" },
];

export function colorForEmployee(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

// ---------- time-grid layout ----------

export interface Block {
  record: AttendanceRecord;
  employeeName: string;
  startMin: number;
  endMin: number;
  ongoing: boolean;
  lane: number;
  lanes: number;
}

export function recordSpan(r: AttendanceRecord): { startMin: number; endMin: number; ongoing: boolean } {
  const startMin = toMinutes(r.horaEntrada) ?? 0;
  if (r.horaSalida) {
    const endMin = toMinutes(r.horaSalida) ?? startMin + 30;
    return { startMin, endMin: Math.max(endMin, startMin + 15), ongoing: false };
  }
  if (r.fecha === todayISO()) {
    const nowMin = toMinutes(nowHHMM()) ?? startMin + 30;
    return { startMin, endMin: Math.max(nowMin, startMin + 15), ongoing: true };
  }
  return { startMin, endMin: startMin + 30, ongoing: true };
}

export function layoutDayBlocks(
  records: AttendanceRecord[],
  employeeName: (id: string) => string
): Block[] {
  const blocks: Block[] = records
    .map((record) => {
      const { startMin, endMin, ongoing } = recordSpan(record);
      return { record, employeeName: employeeName(record.employeeId), startMin, endMin, ongoing, lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin);

  const laneEnds: number[] = [];
  for (const b of blocks) {
    let lane = laneEnds.findIndex((end) => end <= b.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(b.endMin);
    } else {
      laneEnds[lane] = b.endMin;
    }
    b.lane = lane;
  }
  const totalLanes = Math.max(1, laneEnds.length);
  for (const b of blocks) b.lanes = totalLanes;
  return blocks;
}

export function hourBounds(records: AttendanceRecord[]): { startHour: number; endHour: number } {
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
