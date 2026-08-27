import { NextRequest, NextResponse } from "next/server";
import { createEmployee, listEmployees } from "@/lib/notion";
import type { EmployeeInput } from "@/lib/types";

export async function GET() {
  try {
    const employees = await listEmployees();
    return NextResponse.json(employees);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener la lista de empleados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as EmployeeInput;
    if (!data.nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const employee = await createEmployee(data);
    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear el empleado" }, { status: 500 });
  }
}
