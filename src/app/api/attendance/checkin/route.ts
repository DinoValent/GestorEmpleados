import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { checkIn } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const { employeeId } = (await req.json()) as { employeeId?: string };
    if (!employeeId) {
      return NextResponse.json({ error: "Falta employeeId" }, { status: 400 });
    }
    const record = await checkIn(empresaId, employeeId);
    revalidatePath("/asistencia");
    revalidatePath("/");
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo registrar la entrada" }, { status: 500 });
  }
}
