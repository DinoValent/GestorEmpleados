import Link from "next/link";
import { redirect } from "next/navigation";
import EmpresasTable from "@/components/superadmin/EmpresasTable";
import { auth } from "@/lib/auth";
import { listCompaniesWithStats } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const session = await auth();
  if (session?.user?.rol !== "SuperAdmin") redirect("/");

  const empresas = await listCompaniesWithStats();
  const vencidas = empresas.filter((e) => e.vencida).length;

  return (
    <div className="animate-page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-slate-500">
            Clientes de Puntual: planes, límites y vigencia de la suscripción.
          </p>
        </div>
        <Link href="/superadmin/empresas/nueva" className="btn-primary">
          Nueva empresa
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card stat-tile p-4 sm:p-6">
          <p className="text-xs text-slate-500 sm:text-sm">Empresas totales</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: "var(--accent)" }}>
            {empresas.length}
          </p>
        </div>
        <div className="card stat-tile p-4 sm:p-6">
          <p className="text-xs text-slate-500 sm:text-sm">Suscripciones vencidas</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: "var(--accent)" }}>
            {vencidas}
          </p>
        </div>
        <div className="card stat-tile p-4 sm:p-6">
          <p className="text-xs text-slate-500 sm:text-sm">Empresas activas</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: "var(--accent)" }}>
            {empresas.filter((e) => e.estado === "Activo" && !e.vencida).length}
          </p>
        </div>
      </div>

      <EmpresasTable empresas={empresas} />
    </div>
  );
}
