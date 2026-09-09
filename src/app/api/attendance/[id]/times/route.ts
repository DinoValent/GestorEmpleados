import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { updateAttendanceTimes } from "@/lib/notion";
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
    const { horaEntrada, horaSalida } = (await req.json()) as {
      horaEntrada?: string;
      horaSalida?: string | null;
    };
    if (!horaEntrada || !/^\d{1,2}:\d{2}$/.test(horaEntrada)) {
      return NextResponse.json({ error: "Hora de entrada inválida" }, { status: 400 });
    }
    if (horaSalida && !/^\d{1,2}:\d{2}$/.test(horaSalida)) {
      return NextResponse.json({ error: "Hora de salida inválida" }, { status: 400 });
    }
    const record = await updateAttendanceTimes(empresaId, id, horaEntrada, horaSalida || null);
    revalidatePath("/asistencia");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo actualizar el fichaje" }, { status: 500 });
  }
}
