import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateCompanyPlan } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";

/** Ubicación de la sucursal activa, para el geofencing de fichaje. Solo el Admin
 * la puede editar — se aplica a la sucursal que tenga elegida en ese momento
 * (relevante para cuentas corporativas con varias sucursales). */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    await assertEmpresaActiva(empresaId);
    const { latitud, longitud, radioMetros } = (await req.json()) as {
      latitud?: number | null;
      longitud?: number | null;
      radioMetros?: number | null;
    };
    if (
      latitud !== undefined &&
      latitud !== null &&
      (typeof latitud !== "number" || latitud < -90 || latitud > 90)
    ) {
      return NextResponse.json({ error: "Latitud inválida" }, { status: 400 });
    }
    if (
      longitud !== undefined &&
      longitud !== null &&
      (typeof longitud !== "number" || longitud < -180 || longitud > 180)
    ) {
      return NextResponse.json({ error: "Longitud inválida" }, { status: 400 });
    }
    if (
      radioMetros !== undefined &&
      radioMetros !== null &&
      (typeof radioMetros !== "number" || radioMetros < 5)
    ) {
      return NextResponse.json({ error: "El radio mínimo es 5 metros" }, { status: 400 });
    }
    const empresa = await updateCompanyPlan(empresaId, { latitud, longitud, radioMetros });
    return NextResponse.json(empresa);
  } catch (err) {
    console.error(err);
    return (
      planLimitResponse(err) ??
      NextResponse.json({ error: "No se pudo guardar la ubicación" }, { status: 500 })
    );
  }
}
