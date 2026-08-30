const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

interface ArgentinaParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

function argentinaParts(date: Date): ArgentinaParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    // Some ICU implementations render midnight as "24" with hour12: false.
    hour: map.hour === "24" ? "00" : map.hour,
    minute: map.minute,
  };
}

/** Current time in Argentina, formatted "HH:MM", regardless of the server's own timezone. */
export function nowHHMM(date: Date = new Date()): string {
  const { hour, minute } = argentinaParts(date);
  return `${hour}:${minute}`;
}

/** Current calendar date in Argentina, formatted "YYYY-MM-DD", regardless of the server's own timezone. */
export function todayISO(date: Date = new Date()): string {
  const { year, month, day } = argentinaParts(date);
  return `${year}-${month}-${day}`;
}
