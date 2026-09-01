import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  createShiftAssignment,
  listEmployees,
  listShiftAssignments,
  listShiftTemplates,
} from "@/lib/notion";
import type { ShiftAssignmentInput } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const assignments = await listShiftAssignments(employeeId);
    return NextResponse.json(assignments);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener las asignaciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as ShiftAssignmentInput;
    if (!data.employeeId || !data.shiftId || !data.fechaInicio) {
      return NextResponse.json(
        { error: "Faltan datos: empleado, turno o fecha de inicio" },
        { status: 400 }
      );
    }
    const [employees, shifts] = await Promise.all([listEmployees(), listShiftTemplates()]);
    const employee = employees.find((e) => e.id === data.employeeId);
    const shift = shifts.find((s) => s.id === data.shiftId);
    if (!employee || !shift) {
      return NextResponse.json({ error: "Empleado o turno inválido" }, { status: 400 });
    }
    const assignment = await createShiftAssignment(data, employee.nombre, shift.nombre);
    revalidatePath("/turnos");
    revalidatePath("/asistencia");
    revalidatePath("/quincena");
    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear la asignación" }, { status: 500 });
  }
}
