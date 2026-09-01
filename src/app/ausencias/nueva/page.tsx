import AbsenceForm from "@/components/AbsenceForm";
import { listEmployees } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const revalidate = 30;

export default async function NuevaAusenciaPage() {
  const empresaId = (await getEmpresaId())!;
  const employees = await listEmployees(empresaId);
  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva ausencia</h1>
        <p className="mt-1 text-slate-500">
          Cargá vacaciones, licencias o faltas de un empleado.
        </p>
      </div>
      <AbsenceForm employees={activos} />
    </div>
  );
}
