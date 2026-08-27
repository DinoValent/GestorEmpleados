export type Estado = "Activo" | "Inactivo";

export interface Employee {
  id: string;
  nombre: string;
  legajo: string;
  dni: string;
  puesto: string;
  area: string;
  email: string;
  telefono: string;
  fechaIngreso: string | null;
  horarioEntrada: string;
  horarioSalida: string;
  estado: Estado;
  salarioBase: number | null;
}

export type EmployeeInput = Omit<Employee, "id">;

export interface AttendanceRecord {
  id: string;
  registro: string;
  employeeId: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  horasTrabajadas: number | null;
  horasExtra: number | null;
  llegadaTarde: boolean;
  minutosTardanza: number | null;
  observaciones: string;
}
