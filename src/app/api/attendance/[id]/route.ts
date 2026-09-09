import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { updateAttendanceNotes } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const { id } = await params;
    const { observaciones } = (await req.json()) as { observaciones?: string };
    const record = await updateAttendanceNotes(empresaId, id, observaciones ?? "");
    revalidatePath("/asistencia");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo actualizar el registro" }, { status: 500 });
  }
}
