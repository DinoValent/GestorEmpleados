import { todayISO } from "./timezone";

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

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export interface QuincenaRange {
  from: string;
  to: string;
  num: 1 | 2;
  year: number;
  month: number;
  label: string;
}

export function getQuincenaRange(refISO?: string): QuincenaRange {
  const ref = new Date(`${refISO ?? todayISO()}T00:00:00`);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const d = ref.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();

  if (d <= 15) {
    return {
      from: toISO(y, m, 1),
      to: toISO(y, m, 15),
      num: 1,
      year: y,
      month: m,
      label: `1.ª quincena de ${MESES[m]} ${y}`,
    };
  }
  return {
    from: toISO(y, m, 16),
    to: toISO(y, m, lastDay),
    num: 2,
    year: y,
    month: m,
    label: `2.ª quincena de ${MESES[m]} ${y}`,
  };
}

export function prevQuincenaRef(range: QuincenaRange): string {
  if (range.num === 2) {
    return toISO(range.year, range.month, 1);
  }
  const prev = new Date(range.year, range.month - 1, 20);
  return toISO(prev.getFullYear(), prev.getMonth(), 20);
}

export function nextQuincenaRef(range: QuincenaRange): string {
  if (range.num === 1) {
    return toISO(range.year, range.month, 16);
  }
  const next = new Date(range.year, range.month + 1, 1);
  return toISO(next.getFullYear(), next.getMonth(), 1);
}
