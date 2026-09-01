import TurnosPanel from "@/components/TurnosPanel";
import { todayISO } from "@/lib/calendar";
import { listEmployees, listShiftAssignments, listShiftTemplates } from "@/lib/notion";

export const revalidate = 30;

export default async function TurnosPage() {
  const [employees, shifts, assignments] = await Promise.all([
    listEmployees(),
    listShiftTemplates(),
    listShiftAssignments(),
  ]);
  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const employeeById = new Map(employees.map((e) => [e.id, e]));
  const shiftById = new Map(shifts.map((s) => [s.id, s]));
  const today = todayISO();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Turnos rotativos</h1>
        <p className="mt-1 text-slate-500">
          Creá los turnos que usa el negocio y asigná a cada empleado el turno que le
          corresponde en cada período. Si un empleado no tiene ninguna asignación vigente,
          se usa el horario fijo de su ficha.
        </p>
      </div>

      <TurnosPanel employees={activos} shifts={shifts} />

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Turno</th>
              <th>Entrada</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  Todavía no hay turnos cargados.
                </td>
              </tr>
            )}
            {shifts.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.nombre}</td>
                <td className="font-mono tabular-nums">{s.horaEntrada}</td>
                <td className="font-mono tabular-nums">{s.horaSalida}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Asignaciones</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Turno</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Todavía no hay asignaciones cargadas.
                  </td>
                </tr>
              )}
              {assignments.map((a) => {
                const vigente = today >= a.fechaInicio && (a.fechaFin === null || today <= a.fechaFin);
                return (
                  <tr key={a.id}>
                    <td className="font-medium">{employeeById.get(a.employeeId)?.nombre ?? "—"}</td>
                    <td>{shiftById.get(a.shiftId)?.nombre ?? "—"}</td>
                    <td className="font-mono tabular-nums">{a.fechaInicio}</td>
                    <td className="font-mono tabular-nums">{a.fechaFin ?? "Indefinido"}</td>
                    <td>
                      <span
                        className={`badge ${
                          vigente ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {vigente ? "Vigente" : "No vigente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
