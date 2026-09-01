import { auth } from "./auth";

/** La empresa del usuario logueado, o null si no hay sesión. */
export async function getEmpresaId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.empresaId ?? null;
}
