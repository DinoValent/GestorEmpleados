import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getEmployee, listUsers, upsertUser } from "@/lib/notion";
import { requireSuperAdmin } from "@/lib/session";
import type { Rol } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const users = await listUsers(id);
    return NextResponse.json(users.map((u) => ({ ...u, passwordHash: undefined })));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los usuarios" }, { status: 500 });
  }
}

// El SuperAdmin no está sujeto a los límites de plan (assertAdminLimit/assertEmpresaActiva):
// gestiona la empresa por fuera de esas reglas, incluso si está vencida o llegó al tope.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id: empresaId } = await params;
    const { email, password, rol, employeeId } = (await req.json()) as {
      email?: string;
      password?: string;
      rol?: Rol;
      employeeId?: string | null;
    };
    if (!email || !password || !rol) {
      return NextResponse.json(
        { error: "Faltan datos: email, contraseña o rol" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
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
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await upsertUser(empresaId, {
      email,
      passwordHash,
      rol,
      employeeId: employeeId || null,
    });
    return NextResponse.json({ ...user, passwordHash: undefined }, { status: 201 });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "No se pudo guardar el usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
