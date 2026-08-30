import Link from "next/link";
import { listEmployees } from "@/lib/notion";

export const revalidate = 30;

export default async function EmpleadosPage() {
  const employees = await listEmployees();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empleados</h1>
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
              <th>Horario</th>
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
            {employees.map((e) => (
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
                  {e.horarioEntrada || "—"} a {e.horarioSalida || "—"}
                </td>
                <td>
                  <span className={e.estado === "Activo" ? "badge-green" : "badge-gray"}>
                    {e.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
