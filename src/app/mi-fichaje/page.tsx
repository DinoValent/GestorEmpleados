import CheckInWidget from "@/components/CheckInWidget";
import { auth } from "@/lib/auth";
import { getEmployee, listAttendance, todayISO } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function MiFichajePage() {
  const session = await auth();
  const employeeId = session?.user?.employeeId;

  if (!employeeId) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <p className="text-slate-600">
            Tu cuenta no está vinculada a un empleado. Pedile al administrador que la
            asocie desde la sección Usuarios.
          </p>
        </div>
      </div>
    );
  }

  const [employee, records] = await Promise.all([
    getEmployee(employeeId),
    listAttendance({ employeeId, dateFrom: todayISO(), dateTo: todayISO() }),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <CheckInWidget employeeName={employee.nombre} records={records} />
    </div>
  );
}
