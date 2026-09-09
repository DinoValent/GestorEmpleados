import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createHoliday, listHolidays } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";
import type { HolidayInput } from "@/lib/types";

export async function GET(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const holidays = await listHolidays(empresaId, dateFrom, dateTo);
    return NextResponse.json(holidays);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los feriados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const data = (await req.json()) as Omit<HolidayInput, "empresaId">;
    if (!data.nombre?.trim() || !data.fecha) {
      return NextResponse.json({ error: "Faltan datos: nombre o fecha" }, { status: 400 });
    }
    const holiday = await createHoliday({ ...data, empresaId });
    revalidatePath("/feriados");
    revalidatePath("/calendario");
    return NextResponse.json(holiday, { status: 201 });
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo crear el feriado" }, { status: 500 });
  }
}
