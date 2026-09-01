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
  latitud: number | null;
  longitud: number | null;
  precision: number | null;
}

export type Rol = "Admin" | "Empleado";

export interface AppUser {
  id: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  employeeId: string | null;
}

export const ABSENCE_TYPES = [
  "Vacaciones",
  "Licencia medica",
  "Licencia personal",
  "Falta justificada",
  "Falta injustificada",
] as const;

export type AbsenceType = (typeof ABSENCE_TYPES)[number];

export interface Absence {
  id: string;
  employeeId: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: AbsenceType;
  observaciones: string;
}

export type AbsenceInput = Omit<Absence, "id">;

export const HOLIDAY_TYPES = ["Nacional", "Provincial", "Personalizado"] as const;
export type HolidayType = (typeof HOLIDAY_TYPES)[number];

export interface Holiday {
  id: string;
  nombre: string;
  fecha: string;
  tipo: HolidayType;
}

export type HolidayInput = Omit<Holiday, "id">;

export interface ShiftTemplate {
  id: string;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
}

export type ShiftTemplateInput = Omit<ShiftTemplate, "id">;

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  fechaInicio: string;
  fechaFin: string | null;
}

export type ShiftAssignmentInput = Omit<ShiftAssignment, "id">;
