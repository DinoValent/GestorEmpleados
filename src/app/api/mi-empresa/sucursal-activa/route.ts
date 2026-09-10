import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { esSucursalValida } from "@/lib/notion";
import { getEmpresaHomeId, SUCURSAL_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const home = await getEmpresaHomeId();
  if (!home) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { sucursalId } = (await req.json()) as { sucursalId?: string };
    if (!sucursalId) {
      return NextResponse.json({ error: "Falta sucursalId" }, { status: 400 });
    }
    if (!(await esSucursalValida(home, sucursalId))) {
      return NextResponse.json({ error: "Esa sucursal no pertenece a tu empresa" }, { status: 403 });
    }
    const jar = await cookies();
    if (sucursalId === home) {
      jar.delete(SUCURSAL_COOKIE);
    } else {
      jar.set(SUCURSAL_COOKIE, sucursalId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo cambiar de sucursal" }, { status: 500 });
  }
}
