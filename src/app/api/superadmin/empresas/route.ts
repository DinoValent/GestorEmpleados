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
      planId,
      planLabel,
      maxEmpleados,
      maxAdmins,
      diasGracia,
      fechaVencimiento,
      adminEmail,
      adminPassword,
      sucursales,
    } = (await req.json()) as {
      nombre?: string;
      planId?: string | null;
      planLabel?: string | null;
      maxEmpleados?: number;
      maxAdmins?: number;
      diasGracia?: number;
      fechaVencimiento?: string | null;
      adminEmail?: string;
      adminPassword?: string;
      /** Si viene con al menos 1 elemento, se crea un grupo corporativo con estas sucursales. */
      sucursales?: { nombre?: string; direccion?: string | null; color?: string | null }[];
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
    if (sucursales && sucursales.some((s) => !s.nombre?.trim())) {
      return NextResponse.json(
        { error: "Todas las sucursales necesitan un nombre" },
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
    const companyData = {
      estado: "Activo",
      planId: planId || null,
      planLabel: planId ? null : planLabel || null,
      maxEmpleados: maxEmpleados ?? 999999,
      maxAdmins: maxAdmins ?? 999999,
      diasGracia: Math.max(5, diasGracia ?? 5),
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
    };

    const result = await prisma.$transaction(async (tx) => {
      if (sucursales && sucursales.length > 0) {
        const grupo = await tx.empresaGrupo.create({ data: { nombre } });
        const companies = [];
        for (const s of sucursales) {
          companies.push(
            await tx.company.create({
              data: {
                ...companyData,
                nombre: s.nombre!,
                direccion: s.direccion || null,
                color: s.color || null,
                grupoId: grupo.id,
              },
            })
          );
        }
        const admin = await tx.appUser.create({
          data: { empresaId: companies[0].id, email: adminEmail.toLowerCase(), passwordHash, rol: "Admin" },
        });
        return { company: companies[0], admin };
      }

      const company = await tx.company.create({ data: { ...companyData, nombre } });
      const admin = await tx.appUser.create({
        data: { empresaId: company.id, email: adminEmail.toLowerCase(), passwordHash, rol: "Admin" },
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
