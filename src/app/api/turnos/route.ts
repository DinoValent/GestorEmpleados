import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createShiftTemplate, listShiftTemplates } from "@/lib/notion";
import type { ShiftTemplateInput } from "@/lib/types";

export async function GET() {
  try {
    const shifts = await listShiftTemplates();
    return NextResponse.json(shifts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los turnos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as ShiftTemplateInput;
    if (!data.nombre?.trim() || !data.horaEntrada || !data.horaSalida) {
      return NextResponse.json(
        { error: "Faltan datos: nombre, hora de entrada u hora de salida" },
        { status: 400 }
      );
    }
    const shift = await createShiftTemplate(data);
    revalidatePath("/turnos");
    return NextResponse.json(shift, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear el turno" }, { status: 500 });
  }
}
