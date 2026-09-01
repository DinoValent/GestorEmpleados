import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createHoliday, listHolidays } from "@/lib/notion";
import type { HolidayInput } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const holidays = await listHolidays(dateFrom, dateTo);
    return NextResponse.json(holidays);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los feriados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as HolidayInput;
    if (!data.nombre?.trim() || !data.fecha) {
      return NextResponse.json({ error: "Faltan datos: nombre o fecha" }, { status: 400 });
    }
    const holiday = await createHoliday(data);
    revalidatePath("/feriados");
    revalidatePath("/calendario");
    return NextResponse.json(holiday, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear el feriado" }, { status: 500 });
  }
}
