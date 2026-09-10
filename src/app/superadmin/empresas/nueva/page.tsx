import Link from "next/link";
import NuevaEmpresaForm from "@/components/superadmin/NuevaEmpresaForm";
import { listPlanes } from "@/lib/notion";

export default async function NuevaEmpresaPage() {
  const planes = await listPlanes();

  return (
    <div className="animate-page space-y-6">
      <div>
        <Link href="/superadmin" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Volver a empresas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nueva empresa</h1>
        <p className="mt-1 text-slate-500">
          Creá el cliente y su primer administrador, con el plan y los límites que le corresponden.
        </p>
      </div>

      <NuevaEmpresaForm planes={planes} />
    </div>
  );
}
