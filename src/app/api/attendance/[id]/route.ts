import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { updateAttendanceNotes } from "@/lib/notion";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { observaciones } = (await req.json()) as { observaciones?: string };
    const record = await updateAttendanceNotes(id, observaciones ?? "");
    revalidatePath("/asistencia");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar el registro" }, { status: 500 });
  }
}
