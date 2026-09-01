import { NextRequest, NextResponse } from "next/server";
import { getAttendanceRecord, getEmployee } from "@/lib/notion";
import { sendSingleObservationEmail } from "@/lib/email";
import { getEmpresaId } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const record = await getAttendanceRecord(id, empresaId);
    const employee = await getEmployee(record.employeeId, empresaId);
    await sendSingleObservationEmail(employee, record);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el mail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
