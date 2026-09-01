import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createAbsence, getEmployee, listAbsences } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { AbsenceInput } from "@/lib/types";

export async function GET() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const absences = await listAbsences(empresaId);
    return NextResponse.json(absences);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener las ausencias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const data = (await req.json()) as Omit<AbsenceInput, "empresaId">;
    if (!data.employeeId || !data.fechaInicio || !data.fechaFin) {
      return NextResponse.json(
        { error: "Faltan datos: empleado, fecha de inicio o fecha de fin" },
        { status: 400 }
      );
    }
    if (data.fechaFin < data.fechaInicio) {
      return NextResponse.json(
        { error: "La fecha de fin no puede ser anterior a la de inicio" },
        { status: 400 }
      );
    }
    await getEmployee(data.employeeId, empresaId); // valida que el empleado sea de esta empresa
    const absence = await createAbsence({ ...data, empresaId });
    revalidatePath("/ausencias");
    revalidatePath("/calendario");
    return NextResponse.json(absence, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear la ausencia" }, { status: 500 });
  }
}
