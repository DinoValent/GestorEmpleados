import { NextRequest, NextResponse } from "next/server";
import { listAttendance } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const records = await listAttendance(empresaId, { employeeId, dateFrom, dateTo });
    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener la asistencia" }, { status: 500 });
  }
}
