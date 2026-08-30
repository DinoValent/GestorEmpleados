import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkIn } from "@/lib/notion";

export async function POST(req: NextRequest) {
  const session = await auth();
  const employeeId = session?.user?.employeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "Tu cuenta no está vinculada a un empleado" }, { status: 403 });
  }
  try {
    const { lat, lon, accuracy } = (await req.json().catch(() => ({}))) as {
      lat?: number;
      lon?: number;
      accuracy?: number;
    };
    const coords =
      typeof lat === "number" && typeof lon === "number"
        ? { lat, lon, accuracy: typeof accuracy === "number" ? accuracy : undefined }
        : undefined;
    const record = await checkIn(employeeId, coords);
    revalidatePath("/mi-fichaje");
    revalidatePath("/asistencia");
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo registrar la entrada" }, { status: 500 });
  }
}
