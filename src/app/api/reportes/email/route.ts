import { NextRequest, NextResponse } from "next/server";
import { getEmployee, listAttendance } from "@/lib/notion";
import { sendSummaryEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { employeeId, dateFrom, dateTo } = (await req.json()) as {
      employeeId?: string;
      dateFrom?: string;
      dateTo?: string;
    };
    if (!employeeId || !dateFrom || !dateTo) {
      return NextResponse.json({ error: "Faltan employeeId, dateFrom o dateTo" }, { status: 400 });
    }
    const [employee, records] = await Promise.all([
      getEmployee(employeeId),
      listAttendance({ employeeId, dateFrom, dateTo }),
    ]);
    if (records.length === 0) {
      return NextResponse.json(
        { error: "No hay fichajes en el período seleccionado" },
        { status: 400 }
      );
    }
    await sendSummaryEmail(employee, records, dateFrom, dateTo);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo enviar el mail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
