export type Estado = "Activo" | "Inactivo";

export interface Plan {
  id: string;
  nombre: string;
  precio: string;
  precioOriginal: string | null;
  maxEmpleados: number;
  maxAdmins: number;
  diasGracia: number;
  detalle: string[];
  destacado: boolean;
  /** Habilita cargar varias sucursales al crear la empresa. */
  esCorporativo: boolean;
  activo: boolean;
  orden: number;
}

export type PlanInput = Omit<Plan, "id">;

export interface Company {
  id: string;
  nombre: string;
  estado: Estado;
  planId: string | null;
  /** Nombre del plan a mostrar: el del catálogo si hay uno asignado, si no la etiqueta libre. */
  planNombre: string | null;
  planLabel: string | null;
  maxEmpleados: number;
  maxAdmins: number;
  diasGracia: number;
  /** ISO date (yyyy-mm-dd), o null si no tiene vencimiento asignado. */
  fechaVencimiento: string | null;
  /** Grupo corporativo al que pertenece esta sucursal, o null si es una empresa suelta. */
  grupoId: string | null;
  /** Dirección/etiqueta de la sucursal dentro del grupo. */
  direccion: string | null;
  /** Color hex para identificar la sucursal en el selector. */
  color: string | null;
}

export type CompanyInput = Omit<Company, "id" | "planNombre">;

/** Una sucursal dentro del selector — el mismo usuario puede ver el dashboard de cualquiera. */
export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string | null;
  color: string | null;
  activa: boolean;
}

export interface Employee {
  id: string;
  empresaId: string;
  nombre: string;
  legajo: string;
  dni: string;
  puesto: string;
  area: string;
  email: string;
  telefono: string;
  fechaIngreso: string | null;
  shiftId: string | null;
  estado: Estado;
  salarioBase: number | null;
}

export type EmployeeInput = Omit<Employee, "id">;

export interface AttendanceRecord {
  id: string;
  empresaId: string;
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
  latitudSalida: number | null;
  longitudSalida: number | null;
  precisionSalida: number | null;
}

export type Rol = "Admin" | "Empleado" | "SuperAdmin";

export interface AppUser {
  id: string;
  /** null para un SuperAdmin, que no pertenece a ninguna empresa. */
  empresaId: string | null;
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
  empresaId: string;
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
  empresaId: string;
  nombre: string;
  fecha: string;
  tipo: HolidayType;
}

export type HolidayInput = Omit<Holiday, "id">;

export interface ShiftTemplate {
  id: string;
  empresaId: string;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
}

export type ShiftTemplateInput = Omit<ShiftTemplate, "id">;

export const DIAS_SEMANA = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface ShiftAssignment {
  id: string;
  empresaId: string;
  employeeId: string;
  shiftId: string;
  fechaInicio: string;
  fechaFin: string | null;
  /** Días de la semana en que rige (vacío = todos los días del rango). */
  diasSemana: DiaSemana[];
  /** true = es el horario fijo del empleado (no cuenta como rotativo); false = cobertura temporal/rotativa. */
  esFijo: boolean;
}

export type ShiftAssignmentInput = Omit<ShiftAssignment, "id">;
