import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { listUsers, upsertUser } from "@/lib/notion";
import type { Rol } from "@/lib/types";

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json(users.map((u) => ({ ...u, passwordHash: undefined })));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener los usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await upsertUser({
      email,
      passwordHash,
      rol,
      employeeId: employeeId || null,
    });
    return NextResponse.json({ ...user, passwordHash: undefined }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo guardar el usuario" }, { status: 500 });
  }
}
