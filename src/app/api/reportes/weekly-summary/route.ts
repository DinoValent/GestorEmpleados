import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { formatRangeLabel, getWeekRange } from "@/lib/calendar";
import { sendWeeklyAdminSummary, type WeeklySummaryRow } from "@/lib/email";
import { getCompany, listAttendance, listCompanies, listEmployees } from "@/lib/notion";

function isCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

interface SummaryParams {
  dateFrom?: string;
  dateTo?: string;
  employeeIds?: string[];
}

async function buildAndSend(
  empresaId: string,
  empresaNombre: string,
  params: SummaryParams
): Promise<{ label: string; rows: WeeklySummaryRow[] } | null> {
  const hasCustomRange = !!(params.dateFrom && params.dateTo);
  const range = hasCustomRange
    ? { from: params.dateFrom!, to: params.dateTo!, label: formatRangeLabel(params.dateFrom!, params.dateTo!) }
    : getWeekRange();

  const [allEmployees, records] = await Promise.all([
    listEmployees(empresaId),
    listAttendance(empresaId, { dateFrom: range.from, dateTo: range.to }),
  ]);

  const employees =
    params.employeeIds && params.employeeIds.length > 0
      ? allEmployees.filter((e) => params.employeeIds!.includes(e.id))
      : allEmployees.filter((e) => e.estado === "Activo");

  if (employees.length === 0) return null;

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
  const label = `${empresaNombre} — ${range.label}`;
  await sendWeeklyAdminSummary(rows, label);
  return { label, rows };
}

/** Cron sin sesión: recorre todas las empresas activas y manda un resumen por cada una. */
async function buildAndSendAll(params: SummaryParams) {
  const companies = await listCompanies();
  const activas = companies.filter((c) => c.estado === "Activo");
  const results = [];
  for (const empresa of activas) {
    const result = await buildAndSend(empresa.id, empresa.nombre, params);
    if (result) results.push({ empresa: empresa.nombre, ...result });
  }
  return results;
}

export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const results = await buildAndSendAll({});
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el resumen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (isCronRequest(req)) {
    try {
      const body = (await req.json().catch(() => ({}))) as SummaryParams;
      const results = await buildAndSendAll(body);
      return NextResponse.json({ ok: true, results });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo enviar el resumen";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Llamada interactiva desde /reportes ("Enviar resumen por mail"): solo la empresa del admin logueado.
  const session = await auth();
  const empresaId = session?.user?.empresaId;
  if (!empresaId || session?.user?.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as SummaryParams;
    const empresa = await getCompany(empresaId);
    const result = await buildAndSend(empresaId, empresa.nombre, body);
    if (!result) {
      return NextResponse.json(
        { error: "No hay empleados seleccionados para el resumen" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el resumen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
