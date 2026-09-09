import Link from "next/link";
import { notFound } from "next/navigation";
import PlanForm from "@/components/superadmin/PlanForm";
import UsuarioForm from "@/components/UsuarioForm";
import UsuariosTable from "@/components/UsuariosTable";
import { getCompanyWithStats, listEmployees, listUsers } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function EmpresaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let empresa;
  try {
    empresa = await getCompanyWithStats(id);
  } catch {
    notFound();
  }

  const [employees, users] = await Promise.all([listEmployees(id), listUsers(id)]);
  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const apiBase = `/api/superadmin/empresas/${id}/usuarios`;

  return (
    <div className="animate-page space-y-6">
      <div>
        <Link href="/superadmin" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Volver a empresas
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{empresa.nombre}</h1>
          {empresa.vencida ? (
            <span className="badge-red">Suscripción vencida</span>
          ) : (
            <span className={empresa.estado === "Activo" ? "badge-green" : "badge-gray"}>
              {empresa.estado}
            </span>
          )}
        </div>
        <p className="mt-1 text-slate-500">
          {empresa.totalEmpleadosActivos} empleados activos · {empresa.totalAdmins} administradores
          · {empresa.totalUsuarios} usuarios en total
        </p>
      </div>

      <PlanForm empresa={empresa} />

      <div>
        <h2 className="mb-3 font-semibold">Usuarios</h2>
        <UsuarioForm employees={activos} apiBase={apiBase} />
        <div className="mt-4">
          <UsuariosTable users={users} employees={activos} apiBase={apiBase} />
        </div>
      </div>
    </div>
  );
}
