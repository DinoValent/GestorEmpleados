import EmployeeForm from "@/components/EmployeeForm";

export default function NuevoEmpleadoPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo empleado</h1>
        <p className="mt-1 text-slate-500">Cargá la ficha técnica del empleado.</p>
      </div>
      <EmployeeForm />
    </div>
  );
}
