import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { checkOut } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const { recordId } = (await req.json()) as { recordId?: string };
    if (!recordId) {
      return NextResponse.json({ error: "Falta recordId" }, { status: 400 });
    }
    const record = await checkOut(recordId);
    revalidatePath("/asistencia");
    revalidatePath("/");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo registrar la salida" }, { status: 500 });
  }
}
