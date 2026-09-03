import Link from "next/link";
import TutorialHint from "@/components/TutorialHint";
import { listEmployees, listShiftTemplates } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EmpleadosPage() {
  const empresaId = (await getEmpresaId())!;
  const [employees, shifts] = await Promise.all([
    listEmployees(empresaId),
    listShiftTemplates(empresaId),
  ]);
  const shiftById = new Map(shifts.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            Empleados
            <TutorialHint
              title="Empleados"
              short="La ficha técnica de cada persona del equipo."
              long="Acá está el legajo de cada empleado: datos personales, puesto, área, horario habitual y salario base (usado para el costo estimado en Reportes). Hacé clic en un nombre para editarlo. Para dar de baja a alguien, no hace falta borrarlo: cambiá su Estado a Inactivo desde su ficha y deja de contar en los totales, pero conserva todo su historial de fichajes."
            />
          </h1>
          <p className="mt-1 text-slate-500">Ficha técnica de cada empleado.</p>
        </div>
        <Link href="/empleados/nuevo" className="btn-primary">
          Nuevo empleado
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Legajo</th>
              <th>Puesto</th>
              <th>Área</th>
              <th>Turno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Todavía no hay empleados cargados.
                </td>
              </tr>
            )}
            {employees.map((e) => {
              const shift = e.shiftId ? shiftById.get(e.shiftId) : undefined;
              return (
              <tr key={e.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/empleados/${e.id}`} className="font-medium hover:underline">
                    {e.nombre}
                  </Link>
                </td>
                <td>{e.legajo || "—"}</td>
                <td>{e.puesto || "—"}</td>
                <td>{e.area || "—"}</td>
                <td>
                  {shift ? `${shift.nombre} (${shift.horaEntrada}–${shift.horaSalida})` : "—"}
                </td>
                <td>
                  <span className={e.estado === "Activo" ? "badge-green" : "badge-gray"}>
                    {e.estado}
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
