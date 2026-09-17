import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkOut, getAttendanceRecord } from "@/lib/notion";
import { assertEmpresaActiva, geofenceResponse, planLimitResponse } from "@/lib/planLimits";

export async function POST(req: NextRequest) {
  const session = await auth();
  const employeeId = session?.user?.employeeId;
  const empresaId = session?.user?.empresaId;
  if (!employeeId || !empresaId) {
    return NextResponse.json({ error: "Tu cuenta no está vinculada a un empleado" }, { status: 403 });
  }
  try {
    await assertEmpresaActiva(empresaId);
    const { recordId, lat, lon, accuracy } = (await req.json()) as {
      recordId?: string;
      lat?: number;
      lon?: number;
      accuracy?: number;
    };
    if (!recordId) {
      return NextResponse.json({ error: "Falta recordId" }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Necesitamos tu ubicación para fichar la salida. Activá el permiso de ubicación e intentá de nuevo." },
        { status: 400 }
      );
    }
    const existing = await getAttendanceRecord(recordId, empresaId);
    if (existing.employeeId !== employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const coords = { lat, lon, accuracy: typeof accuracy === "number" ? accuracy : undefined };
    const record = await checkOut(empresaId, recordId, coords);
    revalidatePath("/mi-fichaje");
    revalidatePath("/asistencia");
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return (
      planLimitResponse(err) ??
      geofenceResponse(err) ??
      NextResponse.json({ error: "No se pudo registrar la salida" }, { status: 500 })
    );
  }
}
