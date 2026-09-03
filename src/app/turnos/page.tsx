import AssignmentsTable from "@/components/AssignmentsTable";
import ShiftTemplatesTable from "@/components/ShiftTemplatesTable";
import TurnosPanel from "@/components/TurnosPanel";
import TutorialHint from "@/components/TutorialHint";
import { todayISO } from "@/lib/calendar";
import { listEmployees, listShiftAssignments, listShiftTemplates } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const revalidate = 30;

export default async function TurnosPage() {
  const empresaId = (await getEmpresaId())!;
  const [employees, shifts, assignments] = await Promise.all([
    listEmployees(empresaId),
    listShiftTemplates(empresaId),
    listShiftAssignments(empresaId),
  ]);
  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const employeeNames = Object.fromEntries(employees.map((e) => [e.id, e.nombre]));
  const shiftNames = Object.fromEntries(shifts.map((s) => [s.id, s.nombre]));
  const today = todayISO();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Turnos rotativos
          <TutorialHint
            title="Turnos rotativos"
            short="Horarios distintos según el día o el período."
            long="Primero creá los turnos que usa tu negocio (por ejemplo Mañana, Tarde, Noche) con su hora de entrada y salida. Después asigná un turno a un empleado para un rango de fechas: mientras dure ese rango, el sistema va a usar el horario del turno en vez del horario fijo de su ficha para calcular llegadas tarde y horas extra. Podés editar o eliminar un turno, y eliminar una asignación, con los botones de cada tabla."
          />
        </h1>
        <p className="mt-1 text-slate-500">
          Creá los turnos que usa el negocio y asigná a cada empleado el turno que le
          corresponde en cada período. Si un empleado no tiene ninguna asignación vigente,
          se usa el horario fijo de su ficha.
        </p>
      </div>

      <TurnosPanel employees={activos} shifts={shifts} />

      <ShiftTemplatesTable shifts={shifts} />

      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Asignaciones</h2>
        <AssignmentsTable
          assignments={assignments}
          employeeNames={employeeNames}
          shiftNames={shiftNames}
          today={today}
        />
      </div>
    </div>
  );
}
