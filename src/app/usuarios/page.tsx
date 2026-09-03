import TutorialHint from "@/components/TutorialHint";
import UsuarioForm from "@/components/UsuarioForm";
import { listEmployees, listUsers } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";

export const revalidate = 30;

export default async function UsuariosPage() {
  const empresaId = (await getEmpresaId())!;
  const [users, employees] = await Promise.all([
    listUsers(empresaId),
    listEmployees(empresaId),
  ]);
  const employeeName = new Map(employees.map((e) => [e.id, e.nombre]));
  const activos = employees
    .filter((e) => e.estado === "Activo")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Usuarios
          <TutorialHint
            title="Usuarios"
            short="Quién puede entrar a la app y con qué rol."
            long="Un usuario Admin ve y administra todo: empleados, asistencia, turnos, reportes. Un usuario Empleado, en cambio, entra directo a su propia pantalla de fichaje y solo ve sus propias horas — para crearlo, tenés que vincularlo a una ficha de empleado existente. Si ya existe un usuario con ese email, volver a guardarlo le actualiza la contraseña y el rol."
          />
        </h1>
        <p className="mt-1 text-slate-500">
          Accesos al sistema: quién puede entrar y con qué rol.
        </p>
      </div>

      <UsuarioForm employees={activos} />

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th>Empleado vinculado</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  Todavía no hay usuarios cargados.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.email}</td>
                <td>
                  <span className={u.rol === "Admin" ? "badge-red" : "badge-gray"}>
                    {u.rol}
                  </span>
                </td>
                <td>{u.employeeId ? (employeeName.get(u.employeeId) ?? "—") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
