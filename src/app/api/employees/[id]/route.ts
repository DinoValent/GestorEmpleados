import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getEmployee, getShiftTemplate, updateEmployee } from "@/lib/notion";
import { assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";
import type { EmployeeInput } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const employee = await getEmployee(id, empresaId);
    return NextResponse.json(employee);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
    const { id } = await params;
    const data = (await req.json()) as Omit<EmployeeInput, "empresaId">;
    if (!data.nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (data.shiftId) {
      await getShiftTemplate(data.shiftId, empresaId); // valida que el turno sea de esta empresa
    }
    const employee = await updateEmployee(id, empresaId, { ...data, empresaId });
    revalidatePath("/empleados");
    revalidatePath(`/empleados/${id}`);
    revalidatePath("/");
    return NextResponse.json(employee);
  } catch (err) {
    console.error(err);
    return planLimitResponse(err) ?? NextResponse.json({ error: "No se pudo actualizar el empleado" }, { status: 500 });
  }
}
