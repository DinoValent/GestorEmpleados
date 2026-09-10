import { NextResponse } from "next/server";
import { listSucursales } from "@/lib/notion";
import { getEmpresaHomeId, getEmpresaId } from "@/lib/session";

export async function GET() {
  const home = await getEmpresaHomeId();
  if (!home) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const activa = (await getEmpresaId())!;
    const sucursales = await listSucursales(home, activa);
    return NextResponse.json(sucursales);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo obtener las sucursales" }, { status: 500 });
  }
}
