import Link from "next/link";
import { redirect } from "next/navigation";
import PlanesTable from "@/components/superadmin/PlanesTable";
import { auth } from "@/lib/auth";
import { listPlanes } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function SuperAdminPlanesPage() {
  const session = await auth();
  if (session?.user?.rol !== "SuperAdmin") redirect("/");

  const planes = await listPlanes();

  return (
    <div className="animate-page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planes</h1>
          <p className="mt-1 text-slate-500">
            Los planes que se muestran en /planes, en el landing, y que podés asignar al crear una empresa.
          </p>
        </div>
        <Link href="/superadmin/planes/nuevo" className="btn-primary">
          Nuevo plan
        </Link>
      </div>

      <PlanesTable planes={planes} />
    </div>
  );
}
