import EmployeeForm from "@/components/EmployeeForm";
import { getEmployee, listShiftTemplates } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const empresaId = (await getEmpresaId())!;
  const { id } = await params;
  const [employee, shifts] = await Promise.all([
    getEmployee(id, empresaId),
    listShiftTemplates(empresaId),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{employee.nombre}</h1>
        <p className="mt-1 text-slate-500">Editá la ficha técnica del empleado.</p>
      </div>
      <EmployeeForm employee={employee} shifts={shifts} />
    </div>
  );
}
