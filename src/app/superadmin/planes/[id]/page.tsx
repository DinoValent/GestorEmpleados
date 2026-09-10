import Link from "next/link";
import { notFound } from "next/navigation";
import PlanCatalogoForm from "@/components/superadmin/PlanCatalogoForm";
import { getPlan } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function EditarPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let plan;
  try {
    plan = await getPlan(id);
  } catch {
    notFound();
  }

  return (
    <div className="animate-page space-y-6">
      <div>
        <Link href="/superadmin/planes" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Volver a planes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{plan.nombre}</h1>
      </div>

      <PlanCatalogoForm plan={plan} />
    </div>
  );
}
