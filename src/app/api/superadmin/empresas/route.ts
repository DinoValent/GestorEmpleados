import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { listCompaniesWithStats } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";

export async function GET() {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const empresas = await listCompaniesWithStats();
    return NextResponse.json(empresas);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener las empresas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const {
      nombre,
      plan,
      maxEmpleados,
      maxAdmins,
      fechaVencimiento,
      adminEmail,
      adminPassword,
    } = (await req.json()) as {
      nombre?: string;
      plan?: string | null;
      maxEmpleados?: number;
      maxAdmins?: number;
      fechaVencimiento?: string | null;
      adminEmail?: string;
      adminPassword?: string;
    };

    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre de la empresa es obligatorio" }, { status: 400 });
    }
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Faltan datos del primer administrador: email o contraseña" },
        { status: 400 }
      );
    }
    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existing = await prisma.appUser.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          nombre,
          estado: "Activo",
          plan: plan ?? null,
          maxEmpleados: maxEmpleados ?? 999999,
          maxAdmins: maxAdmins ?? 999999,
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        },
      });
      const admin = await tx.appUser.create({
        data: {
          empresaId: company.id,
          email: adminEmail.toLowerCase(),
          passwordHash,
          rol: "Admin",
        },
      });
      return { company, admin };
    });

    return NextResponse.json(
      { empresa: result.company, adminEmail: result.admin.email },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo crear la empresa" }, { status: 500 });
  }
}
