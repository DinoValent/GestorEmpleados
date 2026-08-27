import { NextRequest, NextResponse } from "next/server";
import { formatRangeLabel, getWeekRange } from "@/lib/calendar";
import { sendWeeklyAdminSummary, type WeeklySummaryRow } from "@/lib/email";
import { listAttendance, listEmployees } from "@/lib/notion";

function unauthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") !== `Bearer ${secret}`;
}

interface SummaryParams {
  dateFrom?: string;
  dateTo?: string;
  employeeIds?: string[];
}

async function buildAndSend(
  params: SummaryParams
): Promise<{ label: string; rows: WeeklySummaryRow[] }> {
  const hasCustomRange = !!(params.dateFrom && params.dateTo);
  const range = hasCustomRange
    ? { from: params.dateFrom!, to: params.dateTo!, label: formatRangeLabel(params.dateFrom!, params.dateTo!) }
    : getWeekRange();

  const [allEmployees, records] = await Promise.all([
    listEmployees(),
    listAttendance({ dateFrom: range.from, dateTo: range.to }),
  ]);

  const employees =
    params.employeeIds && params.employeeIds.length > 0
      ? allEmployees.filter((e) => params.employeeIds!.includes(e.id))
      : allEmployees.filter((e) => e.estado === "Activo");

  if (employees.length === 0) {
    throw new Error("No hay empleados seleccionados para el resumen");
  }

  const totals = new Map<string, WeeklySummaryRow>();
  for (const e of employees) {
    totals.set(e.id, { nombre: e.nombre, horasTrabajadas: 0, horasExtra: 0, fichajes: 0, tardanzas: 0 });
  }
  for (const r of records) {
    const row = totals.get(r.employeeId);
    if (!row) continue;
    row.horasTrabajadas += r.horasTrabajadas ?? 0;
    row.horasExtra += r.horasExtra ?? 0;
    row.fichajes += 1;
    if (r.llegadaTarde) row.tardanzas += 1;
  }

  const rows = Array.from(totals.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  await sendWeeklyAdminSummary(rows, range.label);
  return { label: range.label, rows };
}

export async function GET(req: NextRequest) {
  if (unauthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await buildAndSend({});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el resumen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (unauthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as SummaryParams;
    const result = await buildAndSend(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el resumen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
