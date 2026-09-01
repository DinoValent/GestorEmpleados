import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createHolidaysBulk } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { HolidayInput } from "@/lib/types";

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { year } = (await req.json()) as { year?: number };
    const targetYear = year || new Date().getFullYear();

    const res = await fetch(
      `https://date.nager.at/api/v3/publicholidays/${targetYear}/AR`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo consultar el servicio de feriados" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as NagerHoliday[];

    const items: HolidayInput[] = data.map((h) => ({
      nombre: h.localName || h.name,
      fecha: h.date,
      tipo: "Nacional",
      empresaId,
    }));

    const created = await createHolidaysBulk(empresaId, items);
    revalidatePath("/feriados");
    revalidatePath("/calendario");
    return NextResponse.json({ ok: true, total: items.length, creados: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo importar los feriados" }, { status: 500 });
  }
}
