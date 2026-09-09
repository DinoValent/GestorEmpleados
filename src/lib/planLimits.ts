import { NextResponse } from "next/server";
import { countActiveEmployees, countAdmins, getCompany, todayISO } from "./notion";

/** Error de negocio (límite de plan o suscripción vencida): se muestra tal cual al usuario. */
export class PlanLimitError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/** La empresa puede seguir usando la app en modo lectura/escritura normal. */
export async function assertEmpresaActiva(empresaId: string): Promise<void> {
  const empresa = await getCompany(empresaId);
  if (empresa.estado !== "Activo") {
    throw new PlanLimitError("Tu empresa está desactivada. Contactá al administrador de Puntual.");
  }
  if (empresa.fechaVencimiento && empresa.fechaVencimiento < todayISO()) {
    throw new PlanLimitError(
      "La suscripción de tu empresa venció. Contactá al administrador de Puntual para renovarla."
    );
  }
}

export async function assertEmployeeLimit(empresaId: string): Promise<void> {
  const empresa = await getCompany(empresaId);
  const count = await countActiveEmployees(empresaId);
  if (count >= empresa.maxEmpleados) {
    throw new PlanLimitError(`Alcanzaste el máximo de ${empresa.maxEmpleados} empleados de tu plan.`);
  }
}

export async function assertAdminLimit(empresaId: string, excludeUserId?: string): Promise<void> {
  const empresa = await getCompany(empresaId);
  const count = await countAdmins(empresaId, excludeUserId);
  if (count >= empresa.maxAdmins) {
    throw new PlanLimitError(
      `Alcanzaste el máximo de ${empresa.maxAdmins} administradores de tu plan.`
    );
  }
}

/** Si `err` es un PlanLimitError, devuelve la respuesta ya armada para ese error; si no, null. */
export function planLimitResponse(err: unknown): NextResponse | null {
  if (err instanceof PlanLimitError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}
