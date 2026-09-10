import { NextRequest, NextResponse } from "next/server";
import { getCompanyWithStats, updateCompanyPlan } from "@/lib/notion";
import { requireSuperAdmin } from "@/lib/session";
import type { Estado } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const empresa = await getCompanyWithStats(id);
    return NextResponse.json(empresa);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const {
      estado,
      planId,
      planLabel,
      maxEmpleados,
      maxAdmins,
      diasGracia,
      fechaVencimiento,
      direccion,
      color,
    } = (await req.json()) as {
      estado?: Estado;
      planId?: string | null;
      planLabel?: string | null;
      maxEmpleados?: number;
      maxAdmins?: number;
      diasGracia?: number;
      fechaVencimiento?: string | null;
      direccion?: string | null;
      color?: string | null;
    };
    if (diasGracia !== undefined && diasGracia < 5) {
      return NextResponse.json(
        { error: "Los días de gracia no pueden ser menos de 5" },
        { status: 400 }
      );
    }
    const empresa = await updateCompanyPlan(id, {
      estado,
      planId,
      planLabel,
      maxEmpleados,
      maxAdmins,
      diasGracia,
      fechaVencimiento,
      direccion,
      color,
    });
    return NextResponse.json(empresa);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar la empresa" }, { status: 500 });
  }
}
