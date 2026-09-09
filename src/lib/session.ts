import { auth } from "./auth";

/** La empresa del usuario logueado, o null si no hay sesión (o es un SuperAdmin). */
export async function getEmpresaId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.empresaId ?? null;
}

/** true si el usuario logueado es SuperAdmin. Re-chequeo defensivo dentro de cada
 *  handler de /api/superadmin/*, además del filtro que ya hace el proxy. */
export async function requireSuperAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.rol === "SuperAdmin";
}
