import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { deleteShiftAssignment } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const { id } = await params;
    await deleteShiftAssignment(id, empresaId);
    revalidatePath("/turnos");
    revalidatePath("/asistencia");
    revalidatePath("/resumen-pagos");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo eliminar la asignación" }, { status: 500 });
  }
}
