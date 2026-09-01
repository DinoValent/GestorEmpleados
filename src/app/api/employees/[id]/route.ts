import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getEmployee, updateEmployee } from "@/lib/notion";
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
    const { id } = await params;
    const data = (await req.json()) as Omit<EmployeeInput, "empresaId">;
    if (!data.nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const employee = await updateEmployee(id, empresaId, { ...data, empresaId });
    revalidatePath("/empleados");
    revalidatePath(`/empleados/${id}`);
    revalidatePath("/");
    return NextResponse.json(employee);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo actualizar el empleado" }, { status: 500 });
  }
}
