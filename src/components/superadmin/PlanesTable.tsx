import Link from "next/link";
import type { Plan } from "@/lib/types";

export default function PlanesTable({ planes }: { planes: Plan[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>Plan</th>
            <th>Precio</th>
            <th>Límites</th>
            <th>Días de gracia</th>
            <th>Visible</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {planes.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Todavía no hay planes cargados.
              </td>
            </tr>
          )}
          {planes.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">
                {p.nombre}
                {p.destacado && <span className="badge bg-indigo-100 text-indigo-700 ml-2 dark:bg-indigo-500/15 dark:text-indigo-300">Destacado</span>}
                {p.esCorporativo && <span className="badge bg-purple-100 text-purple-800 ml-2 dark:bg-purple-500/15 dark:text-purple-300">Corporativo</span>}
              </td>
              <td>
                {p.precioOriginal && <span className="mr-1 text-slate-400 line-through">{p.precioOriginal}</span>}
                {p.precio}/mes
              </td>
              <td>
                {p.maxEmpleados} empleados · {p.maxAdmins} admins
              </td>
              <td>{p.diasGracia} días</td>
              <td>
                <span className={p.activo ? "badge-green" : "badge-gray"}>{p.activo ? "Sí" : "No"}</span>
              </td>
              <td className="whitespace-nowrap">
                <Link href={`/superadmin/planes/${p.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
