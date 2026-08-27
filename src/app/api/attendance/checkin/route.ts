import { NextRequest, NextResponse } from "next/server";
import { checkIn } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const { employeeId } = (await req.json()) as { employeeId?: string };
    if (!employeeId) {
      return NextResponse.json({ error: "Falta employeeId" }, { status: 400 });
    }
    const record = await checkIn(employeeId);
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo registrar la entrada" }, { status: 500 });
  }
}
