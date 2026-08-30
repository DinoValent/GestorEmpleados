import type { HoursBar } from "@/components/charts/StackedHoursChart";
import type { AttendanceRecord } from "./types";

const DIA_LABEL = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function enumerateDays(dateFrom: string, dateTo: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  while (cursor <= end) {
    days.push(localISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function dailyHoursChart(
  records: AttendanceRecord[],
  dateFrom: string,
  dateTo: string
): HoursBar[] {
  const days = enumerateDays(dateFrom, dateTo);
  const perDay = new Map(days.map((d) => [d, { regular: 0, extra: 0 }]));
  for (const r of records) {
    const entry = perDay.get(r.fecha);
    if (!entry) continue;
    const extra = r.horasExtra ?? 0;
    entry.extra += extra;
    entry.regular += Math.max(0, (r.horasTrabajadas ?? 0) - extra);
  }
  const compact = days.length > 7;
  return days.map((d) => {
    const date = new Date(`${d}T00:00:00`);
    const label = compact
      ? `${date.getDate()}/${date.getMonth() + 1}`
      : DIA_LABEL[date.getDay() === 0 ? 6 : date.getDay() - 1];
    const entry = perDay.get(d)!;
    return { key: d, label, regular: entry.regular, extra: entry.extra };
  });
}
