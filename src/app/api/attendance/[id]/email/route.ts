import { NextRequest, NextResponse } from "next/server";
import { getAttendanceRecord, getEmployee } from "@/lib/notion";
import { sendSingleObservationEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getAttendanceRecord(id);
    const employee = await getEmployee(record.employeeId);
    await sendSingleObservationEmail(employee, record);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el mail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
