import EmployeeForm from "@/components/EmployeeForm";
import { getEmployee } from "@/lib/notion";

export const revalidate = 30;

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{employee.nombre}</h1>
        <p className="mt-1 text-slate-500">Editá la ficha técnica del empleado.</p>
      </div>
      <EmployeeForm employee={employee} />
    </div>
  );
}
