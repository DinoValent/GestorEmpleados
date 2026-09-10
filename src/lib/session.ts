import { cookies } from "next/headers";
import { auth } from "./auth";
import { esSucursalValida } from "./notion";

export const SUCURSAL_COOKIE = "sucursal_activa";

/** La empresa "de origen" del usuario logueado (la que quedó en su sesión al
 * loguearse), sin considerar si cambió de sucursal. Útil para listar el resto
 * del grupo sin importar cuál esté viendo ahora mismo. */
export async function getEmpresaHomeId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.empresaId ?? null;
}

/** La empresa que hay que usar para esta request: su empresa de origen, salvo
 * que haya elegido ver otra sucursal del mismo grupo corporativo (cookie). */
export async function getEmpresaId(): Promise<string | null> {
  const home = await getEmpresaHomeId();
  if (!home) return null;

  const jar = await cookies();
  const activa = jar.get(SUCURSAL_COOKIE)?.value;
  if (!activa || activa === home) return home;

  return (await esSucursalValida(home, activa)) ? activa : home;
}

/** true si el usuario logueado es SuperAdmin. Re-chequeo defensivo dentro de cada
 *  handler de /api/superadmin/*, además del filtro que ya hace el proxy. */
export async function requireSuperAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.rol === "SuperAdmin";
}
