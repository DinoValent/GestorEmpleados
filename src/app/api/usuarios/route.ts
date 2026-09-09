import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getEmployee, listUsers, upsertUser } from "@/lib/notion";
import { assertAdminLimit, assertEmpresaActiva, planLimitResponse } from "@/lib/planLimits";
import { getEmpresaId } from "@/lib/session";
import type { Rol } from "@/lib/types";

export async function GET() {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const users = await listUsers(empresaId);
    return NextResponse.json(users.map((u) => ({ ...u, passwordHash: undefined })));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await assertEmpresaActiva(empresaId);
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
      await getEmployee(employeeId, empresaId); // valida que el empleado sea de esta empresa
    }
    if (rol === "Admin") {
      await assertAdminLimit(empresaId);
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
    const planError = planLimitResponse(err);
    if (planError) return planError;
    const message = err instanceof Error ? err.message : "No se pudo guardar el usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
