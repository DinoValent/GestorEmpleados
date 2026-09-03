import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { deleteShiftTemplate, updateShiftTemplate } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { ShiftTemplateInput } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const data = (await req.json()) as Omit<ShiftTemplateInput, "empresaId">;
    if (!data.nombre?.trim() || !data.horaEntrada || !data.horaSalida) {
      return NextResponse.json(
        { error: "Faltan datos: nombre, hora de entrada u hora de salida" },
        { status: 400 }
      );
    }
    const shift = await updateShiftTemplate(id, empresaId, data);
    revalidatePath("/turnos");
    return NextResponse.json(shift);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar el turno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    await deleteShiftTemplate(id, empresaId);
    revalidatePath("/turnos");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo eliminar el turno" }, { status: 500 });
  }
}
