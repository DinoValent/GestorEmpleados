import { NextRequest, NextResponse } from "next/server";
import { listAttendance } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const records = await listAttendance({ employeeId, dateFrom, dateTo });
    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener la asistencia" }, { status: 500 });
  }
}
