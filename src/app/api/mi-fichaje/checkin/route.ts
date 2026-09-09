import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkIn } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";

export async function POST(req: NextRequest) {
  const session = await auth();
  const employeeId = session?.user?.employeeId;
  const empresaId = session?.user?.empresaId;
  if (!employeeId || !empresaId) {
    return NextResponse.json({ error: "Tu cuenta no está vinculada a un empleado" }, { status: 403 });
  }
  try {
    await assertEmpresaActiva(empresaId);
    const { lat, lon, accuracy } = (await req.json().catch(() => ({}))) as {
      lat?: number;
      lon?: number;
      accuracy?: number;
    };
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Necesitamos tu ubicación para fichar la entrada. Activá el permiso de ubicación e intentá de nuevo." },
        { status: 400 }
      );
    }
    const coords = { lat, lon, accuracy: typeof accuracy === "number" ? accuracy : undefined };
    const record = await checkIn(empresaId, employeeId, coords);
    revalidatePath("/mi-fichaje");
    revalidatePath("/asistencia");
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo registrar la entrada" }, { status: 500 });
  }
}
