import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getEmployee, updateUser } from "@/lib/notion";
import { requireSuperAdmin } from "@/lib/session";
import type { Rol } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id: empresaId, userId } = await params;
    const { email, password, rol, employeeId } = (await req.json()) as {
      email?: string;
      password?: string;
      rol?: Rol;
      employeeId?: string | null;
    };
    if (!email || !rol) {
      return NextResponse.json({ error: "Faltan datos: email o rol" }, { status: 400 });
    }
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }
    if (rol === "Empleado" && !employeeId) {
      return NextResponse.json(
        { error: "Un usuario Empleado debe estar vinculado a una ficha" },
        { status: 400 }
      );
    }
    if (employeeId) {
      await getEmployee(employeeId, empresaId);
    }
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    const user = await updateUser(userId, empresaId, {
      email,
      rol,
      employeeId: employeeId || null,
      passwordHash,
    });
    return NextResponse.json({ ...user, passwordHash: undefined });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo guardar el usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
