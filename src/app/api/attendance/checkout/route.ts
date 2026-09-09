import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { checkOut } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const { recordId } = (await req.json()) as { recordId?: string };
    if (!recordId) {
      return NextResponse.json({ error: "Falta recordId" }, { status: 400 });
    }
    const record = await checkOut(empresaId, recordId);
    revalidatePath("/asistencia");
    revalidatePath("/");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo registrar la salida" }, { status: 500 });
  }
}
