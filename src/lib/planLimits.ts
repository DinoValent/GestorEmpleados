import { NextResponse } from "next/server";
import { GeofenceError } from "./geo";
import { computeVencimiento, countActiveEmployees, countAdmins, getCompany } from "./notion";
import type { Company } from "./types";

/** Error de negocio (límite de plan o suscripción vencida): se muestra tal cual al usuario. */
export class PlanLimitError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/** La empresa puede seguir usando la app en modo lectura/escritura normal. Devuelve
 * la empresa ya traída para que, si el handler también necesita chequear un límite
 * (`assertEmployeeLimit`/`assertAdminLimit`), no haga una segunda consulta idéntica. */
export async function assertEmpresaActiva(empresaId: string): Promise<Company> {
  const empresa = await getCompany(empresaId);
  if (empresa.estado !== "Activo") {
    throw new PlanLimitError("Tu empresa está desactivada. Contactá al administrador de Puntual.");
  }
  const { vencida } = computeVencimiento(empresa.fechaVencimiento, empresa.diasGracia);
  if (vencida) {
    throw new PlanLimitError(
      "La suscripción de tu empresa venció. Contactá al administrador de Puntual para renovarla."
    );
  }
  return empresa;
}

export async function assertEmployeeLimit(empresaId: string, empresa?: Company): Promise<void> {
  const e = empresa ?? (await getCompany(empresaId));
  const count = await countActiveEmployees(empresaId);
  if (count >= e.maxEmpleados) {
    throw new PlanLimitError(`Alcanzaste el máximo de ${e.maxEmpleados} empleados de tu plan.`);
  }
}

export async function assertAdminLimit(
  empresaId: string,
  excludeUserId?: string,
  empresa?: Company
): Promise<void> {
  const e = empresa ?? (await getCompany(empresaId));
  const count = await countAdmins(empresaId, excludeUserId);
  if (count >= e.maxAdmins) {
    throw new PlanLimitError(`Alcanzaste el máximo de ${e.maxAdmins} administradores de tu plan.`);
  }
}

/** Si `err` es un PlanLimitError, devuelve la respuesta ya armada para ese error; si no, null. */
export function planLimitResponse(err: unknown): NextResponse | null {
  if (err instanceof PlanLimitError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}

/** Si `err` es un GeofenceError (fichaje fuera del radio permitido), devuelve la
 * respuesta ya armada para ese error; si no, null. */
export function geofenceResponse(err: unknown): NextResponse | null {
  if (err instanceof GeofenceError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}
