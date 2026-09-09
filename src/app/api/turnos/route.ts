import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createShiftTemplate, listShiftTemplates } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";
import type { ShiftTemplateInput } from "@/lib/types";

export async function GET() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const shifts = await listShiftTemplates(empresaId);
    return NextResponse.json(shifts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los turnos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const data = (await req.json()) as Omit<ShiftTemplateInput, "empresaId">;
    if (!data.nombre?.trim() || !data.horaEntrada || !data.horaSalida) {
      return NextResponse.json(
        { error: "Faltan datos: nombre, hora de entrada u hora de salida" },
        { status: 400 }
      );
    }
    const shift = await createShiftTemplate({ ...data, empresaId });
    revalidatePath("/turnos");
    return NextResponse.json(shift, { status: 201 });
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo crear el turno" }, { status: 500 });
  }
}
