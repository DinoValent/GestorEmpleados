import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkOut, getAttendanceRecord } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";

export async function POST(req: NextRequest) {
  const session = await auth();
  const employeeId = session?.user?.employeeId;
  const empresaId = session?.user?.empresaId;
  if (!employeeId || !empresaId) {
    return NextResponse.json({ error: "Tu cuenta no está vinculada a un empleado" }, { status: 403 });
  }
  try {
    await assertEmpresaActiva(empresaId);
    const { recordId } = (await req.json()) as { recordId?: string };
    if (!recordId) {
      return NextResponse.json({ error: "Falta recordId" }, { status: 400 });
    }
    const existing = await getAttendanceRecord(recordId, empresaId);
    if (existing.employeeId !== employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const record = await checkOut(empresaId, recordId);
    revalidatePath("/mi-fichaje");
    revalidatePath("/asistencia");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo registrar la salida" }, { status: 500 });
  }
}
