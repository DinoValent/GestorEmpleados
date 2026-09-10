import Link from "next/link";
import type { CompanyWithStats } from "@/lib/notion";

export default function EmpresasTable({ empresas }: { empresas: CompanyWithStats[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Estado</th>
            <th>Plan</th>
            <th>Empleados</th>
            <th>Admins</th>
            <th>Vencimiento</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {empresas.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-400">
                Todavía no hay empresas cargadas.
              </td>
            </tr>
          )}
          {empresas.map((e) => (
            <tr key={e.id}>
              <td className="font-medium">
                {e.color && (
                  <span
                    className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full align-middle"
                    style={{ background: e.color }}
                  />
                )}
                {e.nombre}
                {e.grupoId && (
                  <span className="badge bg-purple-100 text-purple-800 ml-2 dark:bg-purple-500/15 dark:text-purple-300">
                    Sucursal
                  </span>
                )}
                {e.direccion && <p className="text-xs font-normal text-slate-400">{e.direccion}</p>}
              </td>
              <td>
                {e.vencida ? (
                  <span className="badge-red">Vencida</span>
                ) : e.pagoVencido ? (
                  <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    En gracia
                  </span>
                ) : (
                  <span className={e.estado === "Activo" ? "badge-green" : "badge-gray"}>
                    {e.estado}
                  </span>
                )}
              </td>
              <td>{e.planNombre ?? "—"}</td>
              <td>
                {e.totalEmpleadosActivos} / {e.maxEmpleados >= 999999 ? "∞" : e.maxEmpleados}
              </td>
              <td>
                {e.totalAdmins} / {e.maxAdmins >= 999999 ? "∞" : e.maxAdmins}
              </td>
              <td>{e.fechaVencimiento ?? "Sin vencimiento"}</td>
              <td className="whitespace-nowrap">
                <Link
                  href={`/superadmin/empresas/${e.id}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Gestionar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
