import { NextRequest, NextResponse } from "next/server";
import { createPlan, listPlanes } from "@/lib/notion";
import { requireSuperAdmin } from "@/lib/session";
import type { PlanInput } from "@/lib/types";

export async function GET() {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const planes = await listPlanes();
    return NextResponse.json(planes);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los planes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Partial<PlanInput>;
    if (!body.nombre?.trim() || !body.precio?.trim()) {
      return NextResponse.json({ error: "Faltan datos: nombre o precio" }, { status: 400 });
    }
    if (!Number.isFinite(body.maxEmpleados) || !Number.isFinite(body.maxAdmins)) {
      return NextResponse.json(
        { error: "Faltan datos: máximo de empleados o de administradores" },
        { status: 400 }
      );
    }
    if (body.diasGracia !== undefined && body.diasGracia < 5) {
      return NextResponse.json(
        { error: "Los días de gracia no pueden ser menos de 5" },
        { status: 400 }
      );
    }
    const plan = await createPlan({
      nombre: body.nombre,
      precio: body.precio,
      precioOriginal: body.precioOriginal ?? null,
      maxEmpleados: body.maxEmpleados!,
      maxAdmins: body.maxAdmins!,
      diasGracia: body.diasGracia ?? 5,
      detalle: body.detalle ?? [],
      destacado: body.destacado ?? false,
      esCorporativo: body.esCorporativo ?? false,
      activo: body.activo ?? true,
      orden: body.orden ?? 0,
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear el plan" }, { status: 500 });
  }
}
