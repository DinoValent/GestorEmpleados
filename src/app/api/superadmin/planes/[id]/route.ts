import { NextRequest, NextResponse } from "next/server";
import { deletePlan, getPlan, updatePlan } from "@/lib/notion";
import { requireSuperAdmin } from "@/lib/session";
import type { PlanInput } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const plan = await getPlan(id);
    return NextResponse.json(plan);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<PlanInput>;
    if (body.diasGracia !== undefined && body.diasGracia < 5) {
      return NextResponse.json(
        { error: "Los días de gracia no pueden ser menos de 5" },
        { status: 400 }
      );
    }
    const plan = await updatePlan(id, body);
    return NextResponse.json(plan);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar el plan" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deletePlan(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo eliminar el plan" }, { status: 500 });
  }
}
