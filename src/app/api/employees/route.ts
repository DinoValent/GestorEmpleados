import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createEmployee, getShiftTemplate, listEmployees } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { EmployeeInput } from "@/lib/types";

export async function GET() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const employees = await listEmployees(empresaId);
    return NextResponse.json(employees);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener la lista de empleados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const data = (await req.json()) as Omit<EmployeeInput, "empresaId">;
    if (!data.nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (data.shiftId) {
      await getShiftTemplate(data.shiftId, empresaId); // valida que el turno sea de esta empresa
    }
    const employee = await createEmployee({ ...data, empresaId });
    revalidatePath("/empleados");
    revalidatePath("/");
    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear el empleado" }, { status: 500 });
  }
}
