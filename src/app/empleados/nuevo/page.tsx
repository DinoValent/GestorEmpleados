import EmployeeForm from "@/components/EmployeeForm";
import { listShiftTemplates } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NuevoEmpleadoPage() {
  const empresaId = (await getEmpresaId())!;
  const shifts = await listShiftTemplates(empresaId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo empleado</h1>
        <p className="mt-1 text-slate-500">Cargá la ficha técnica del empleado.</p>
      </div>
      <EmployeeForm shifts={shifts} />
    </div>
  );
}
