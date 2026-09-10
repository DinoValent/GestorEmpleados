import Link from "next/link";
import PlanCatalogoForm from "@/components/superadmin/PlanCatalogoForm";

export default function NuevoPlanPage() {
  return (
    <div className="animate-page space-y-6">
      <div>
        <Link href="/superadmin/planes" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Volver a planes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo plan</h1>
        <p className="mt-1 text-slate-500">
          Va a aparecer en /planes, en el landing, y disponible para asignar a empresas.
        </p>
      </div>

      <PlanCatalogoForm />
    </div>
  );
}
