import type {
  Absence,
  AbsenceInput,
  AbsenceType,
  AppUser,
  AttendanceRecord,
  Company,
  CompanyInput,
  DiaSemana,
  Employee,
  EmployeeInput,
  Estado,
  Holiday,
  HolidayInput,
  HolidayType,
  Plan,
  PlanInput,
  Rol,
  ShiftAssignment,
  ShiftAssignmentInput,
  ShiftTemplate,
  ShiftTemplateInput,
  Sucursal,
} from "./types";
import { nowHHMM, todayISO } from "./timezone";
import { prisma } from "./prisma";

export { nowHHMM, todayISO };

// ---------- helpers ----------

function toISODate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function toDateOrNull(iso: string | null | undefined): Date | null {
  return iso ? new Date(iso) : null;
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// ---------- planes (catálogo) ----------

function mapPlan(row: {
  id: string;
  nombre: string;
  precio: string;
  precioOriginal: string | null;
  maxEmpleados: number;
  maxAdmins: number;
  diasGracia: number;
  detalle: string[];
  destacado: boolean;
  esCorporativo: boolean;
  activo: boolean;
  orden: number;
}): Plan {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: row.precio,
    precioOriginal: row.precioOriginal,
    maxEmpleados: row.maxEmpleados,
    maxAdmins: row.maxAdmins,
    diasGracia: row.diasGracia,
    detalle: row.detalle,
    destacado: row.destacado,
    esCorporativo: row.esCorporativo,
    activo: row.activo,
    orden: row.orden,
  };
}

const MIN_DIAS_GRACIA = 5;

/** Todos los planes, para el panel de SuperAdmin (incluye los que ya no se muestran públicamente). */
export async function listPlanes(): Promise<Plan[]> {
  const rows = await prisma.plan.findMany({ orderBy: [{ orden: "asc" }, { createdAt: "asc" }] });
  return rows.map(mapPlan);
}

/** Solo los planes activos, para /planes y el landing. */
export async function listPlanesPublicos(): Promise<Plan[]> {
  const rows = await prisma.plan.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapPlan);
}

export async function getPlan(id: string): Promise<Plan> {
  const row = await prisma.plan.findUniqueOrThrow({ where: { id } });
  return mapPlan(row);
}

export async function createPlan(data: PlanInput): Promise<Plan> {
  const row = await prisma.plan.create({
    data: {
      nombre: data.nombre,
      precio: data.precio,
      precioOriginal: data.precioOriginal || null,
      maxEmpleados: data.maxEmpleados,
      maxAdmins: data.maxAdmins,
      diasGracia: Math.max(MIN_DIAS_GRACIA, data.diasGracia),
      detalle: data.detalle,
      destacado: data.destacado,
      esCorporativo: data.esCorporativo,
      activo: data.activo,
      orden: data.orden,
    },
  });
  return mapPlan(row);
}

export async function updatePlan(id: string, data: Partial<PlanInput>): Promise<Plan> {
  const row = await prisma.plan.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.precio !== undefined ? { precio: data.precio } : {}),
      ...(data.precioOriginal !== undefined ? { precioOriginal: data.precioOriginal || null } : {}),
      ...(data.maxEmpleados !== undefined ? { maxEmpleados: data.maxEmpleados } : {}),
      ...(data.maxAdmins !== undefined ? { maxAdmins: data.maxAdmins } : {}),
      ...(data.diasGracia !== undefined
        ? { diasGracia: Math.max(MIN_DIAS_GRACIA, data.diasGracia) }
        : {}),
      ...(data.detalle !== undefined ? { detalle: data.detalle } : {}),
      ...(data.destacado !== undefined ? { destacado: data.destacado } : {}),
      ...(data.esCorporativo !== undefined ? { esCorporativo: data.esCorporativo } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
      ...(data.orden !== undefined ? { orden: data.orden } : {}),
    },
  });
  return mapPlan(row);
}

/** Borrar un plan no afecta a las empresas que ya lo tenían: sus límites y días
 * de gracia quedan copiados en la propia empresa (planId simplemente queda null). */
export async function deletePlan(id: string): Promise<void> {
  await prisma.plan.delete({ where: { id } });
}

// ---------- companies (empresas) ----------

const companyInclude = { plan: { select: { nombre: true } } } as const;

function mapCompany(row: {
  id: string;
  nombre: string;
  estado: string;
  planId: string | null;
  planLabel: string | null;
  plan: { nombre: string } | null;
  maxEmpleados: number;
  maxAdmins: number;
  diasGracia: number;
  fechaVencimiento: Date | null;
  grupoId: string | null;
  direccion: string | null;
  color: string | null;
}): Company {
  return {
    id: row.id,
    nombre: row.nombre,
    estado: row.estado as Estado,
    planId: row.planId,
    planNombre: row.plan?.nombre ?? row.planLabel,
    planLabel: row.planLabel,
    maxEmpleados: row.maxEmpleados,
    maxAdmins: row.maxAdmins,
    diasGracia: row.diasGracia,
    fechaVencimiento: toISODate(row.fechaVencimiento),
    grupoId: row.grupoId,
    direccion: row.direccion,
    color: row.color,
  };
}

/** Lista TODAS las empresas, sin filtrar — solo para altas de clientes y el cron multi-empresa. */
export async function listCompanies(): Promise<Company[]> {
  const rows = await prisma.company.findMany({
    orderBy: { nombre: "asc" },
    include: companyInclude,
  });
  return rows.map(mapCompany);
}

export async function getCompany(id: string): Promise<Company> {
  const row = await prisma.company.findUniqueOrThrow({ where: { id }, include: companyInclude });
  return mapCompany(row);
}

export async function createCompany(data: CompanyInput): Promise<Company> {
  const row = await prisma.company.create({
    data: {
      nombre: data.nombre,
      estado: data.estado || "Activo",
      planId: data.planId ?? null,
      planLabel: data.planLabel ?? null,
      maxEmpleados: data.maxEmpleados ?? 999999,
      maxAdmins: data.maxAdmins ?? 999999,
      diasGracia: data.diasGracia ?? MIN_DIAS_GRACIA,
      fechaVencimiento: toDateOrNull(data.fechaVencimiento),
      grupoId: data.grupoId ?? null,
      direccion: data.direccion ?? null,
      color: data.color ?? null,
    },
    include: companyInclude,
  });
  return mapCompany(row);
}

/** Todas las sucursales del grupo al que pertenece `empresaId` (o solo ella
 * misma, si no pertenece a ningún grupo), marcando cuál es la activa. */
export async function listSucursales(empresaId: string, activaId: string): Promise<Sucursal[]> {
  const home = await prisma.company.findUniqueOrThrow({
    where: { id: empresaId },
    select: { id: true, nombre: true, direccion: true, color: true, grupoId: true },
  });
  if (!home.grupoId) {
    return [
      { id: home.id, nombre: home.nombre, direccion: home.direccion, color: home.color, activa: true },
    ];
  }
  const sucursales = await prisma.company.findMany({
    where: { grupoId: home.grupoId },
    select: { id: true, nombre: true, direccion: true, color: true },
    orderBy: { nombre: "asc" },
  });
  return sucursales.map((s) => ({ ...s, activa: s.id === activaId }));
}

/** true si `candidatoId` es una sucursal del mismo grupo que `homeId` (o es la propia). */
export async function esSucursalValida(homeId: string, candidatoId: string): Promise<boolean> {
  if (homeId === candidatoId) return true;
  const home = await prisma.company.findUnique({ where: { id: homeId }, select: { grupoId: true } });
  if (!home?.grupoId) return false;
  const candidato = await prisma.company.findUnique({
    where: { id: candidatoId },
    select: { grupoId: true },
  });
  return candidato?.grupoId === home.grupoId;
}

export interface CompanyWithStats extends Company {
  totalEmpleadosActivos: number;
  totalAdmins: number;
  totalUsuarios: number;
  /** Ya pasó fechaVencimiento pero todavía está dentro de los días de gracia. */
  pagoVencido: boolean;
  /** Pasaron fechaVencimiento + diasGracia: la empresa ya está en modo solo lectura. */
  vencida: boolean;
}

export function computeVencimiento(fechaVencimiento: string | null, diasGracia: number) {
  const pagoVencido = !!fechaVencimiento && fechaVencimiento < todayISO();
  if (!pagoVencido) return { pagoVencido: false, vencida: false };
  const limite = new Date(fechaVencimiento!);
  limite.setDate(limite.getDate() + diasGracia);
  const vencida = toISODate(limite)! < todayISO();
  return { pagoVencido, vencida };
}

async function withStats(c: Company): Promise<CompanyWithStats> {
  const [totalEmpleadosActivos, totalAdmins, totalUsuarios] = await Promise.all([
    countActiveEmployees(c.id),
    countAdmins(c.id),
    prisma.appUser.count({ where: { empresaId: c.id } }),
  ]);
  return { ...c, totalEmpleadosActivos, totalAdmins, totalUsuarios, ...computeVencimiento(c.fechaVencimiento, c.diasGracia) };
}

/** Igual que `withStats`, pero para todas las empresas de una — 3 consultas
 * agregadas en total en vez de 3 por empresa (evita el N+1 en el panel de SuperAdmin). */
export async function listCompaniesWithStats(): Promise<CompanyWithStats[]> {
  const companies = await listCompanies();
  const [empleadosPorEmpresa, adminsPorEmpresa, usuariosPorEmpresa] = await Promise.all([
    prisma.employee.groupBy({ by: ["empresaId"], where: { estado: "Activo" }, _count: true }),
    prisma.appUser.groupBy({ by: ["empresaId"], where: { rol: "Admin" }, _count: true }),
    prisma.appUser.groupBy({ by: ["empresaId"], _count: true }),
  ]);
  const empleadosById = new Map(empleadosPorEmpresa.map((r) => [r.empresaId, r._count]));
  const adminsById = new Map(adminsPorEmpresa.map((r) => [r.empresaId, r._count]));
  const usuariosById = new Map(
    usuariosPorEmpresa.filter((r) => r.empresaId !== null).map((r) => [r.empresaId as string, r._count])
  );
  return companies.map((c) => ({
    ...c,
    totalEmpleadosActivos: empleadosById.get(c.id) ?? 0,
    totalAdmins: adminsById.get(c.id) ?? 0,
    totalUsuarios: usuariosById.get(c.id) ?? 0,
    ...computeVencimiento(c.fechaVencimiento, c.diasGracia),
  }));
}

export async function getCompanyWithStats(id: string): Promise<CompanyWithStats> {
  const c = await getCompany(id);
  return withStats(c);
}

export async function updateCompanyPlan(
  id: string,
  data: {
    estado?: Estado;
    planId?: string | null;
    planLabel?: string | null;
    maxEmpleados?: number;
    maxAdmins?: number;
    diasGracia?: number;
    fechaVencimiento?: string | null;
    direccion?: string | null;
    color?: string | null;
  }
): Promise<Company> {
  const row = await prisma.company.update({
    where: { id },
    data: {
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
      ...(data.planId !== undefined ? { planId: data.planId } : {}),
      ...(data.planLabel !== undefined ? { planLabel: data.planLabel } : {}),
      ...(data.maxEmpleados !== undefined ? { maxEmpleados: data.maxEmpleados } : {}),
      ...(data.maxAdmins !== undefined ? { maxAdmins: data.maxAdmins } : {}),
      ...(data.diasGracia !== undefined
        ? { diasGracia: Math.max(MIN_DIAS_GRACIA, data.diasGracia) }
        : {}),
      ...(data.fechaVencimiento !== undefined
        ? { fechaVencimiento: toDateOrNull(data.fechaVencimiento) }
        : {}),
      ...(data.direccion !== undefined ? { direccion: data.direccion } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    },
    include: companyInclude,
  });
  return mapCompany(row);
}

export async function countActiveEmployees(empresaId: string): Promise<number> {
  return prisma.employee.count({ where: { empresaId, estado: "Activo" } });
}

export async function countAdmins(empresaId: string, excludeUserId?: string): Promise<number> {
  return prisma.appUser.count({
    where: {
      empresaId,
      rol: "Admin",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

// ---------- employees ----------

function mapEmployee(row: {
  id: string;
  empresaId: string;
  nombre: string;
  legajo: string;
  dni: string;
  puesto: string;
  area: string;
  email: string;
  telefono: string;
  fechaIngreso: Date | null;
  shiftId: string | null;
  estado: string;
  salarioBase: number | null;
}): Employee {
  return {
    id: row.id,
    empresaId: row.empresaId,
    nombre: row.nombre,
    legajo: row.legajo,
    dni: row.dni,
    puesto: row.puesto,
    area: row.area,
    email: row.email,
    telefono: row.telefono,
    fechaIngreso: toISODate(row.fechaIngreso),
    shiftId: row.shiftId,
    estado: row.estado as Estado,
    salarioBase: row.salarioBase,
  };
}

export async function listEmployees(empresaId: string): Promise<Employee[]> {
  const rows = await prisma.employee.findMany({
    where: { empresaId },
    orderBy: { nombre: "asc" },
  });
  return rows.map(mapEmployee);
}

export async function getEmployee(id: string, empresaId: string): Promise<Employee> {
  const row = await prisma.employee.findUniqueOrThrow({ where: { id } });
  const employee = mapEmployee(row);
  if (employee.empresaId !== empresaId) throw new Error("No autorizado");
  return employee;
}

function employeeData(data: EmployeeInput) {
  return {
    nombre: data.nombre,
    legajo: data.legajo,
    dni: data.dni,
    puesto: data.puesto,
    area: data.area,
    email: data.email,
    telefono: data.telefono,
    fechaIngreso: toDateOrNull(data.fechaIngreso),
    shiftId: data.shiftId || null,
    estado: data.estado || "Activo",
    salarioBase: data.salarioBase ?? null,
  };
}

export async function createEmployee(data: EmployeeInput): Promise<Employee> {
  const row = await prisma.employee.create({
    data: { ...employeeData(data), empresaId: data.empresaId },
  });
  return mapEmployee(row);
}

export async function updateEmployee(
  id: string,
  empresaId: string,
  data: EmployeeInput,
): Promise<Employee> {
  await getEmployee(id, empresaId); // lanza si el empleado no es de esta empresa
  const row = await prisma.employee.update({ where: { id }, data: employeeData(data) });
  return mapEmployee(row);
}

// ---------- attendance ----------

export interface AttendanceFilters {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function mapAttendance(row: {
  id: string;
  empresaId: string;
  employeeId: string;
  registro: string;
  fecha: Date;
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
}): AttendanceRecord {
  return {
    id: row.id,
    empresaId: row.empresaId,
    registro: row.registro,
    employeeId: row.employeeId,
    fecha: toISODate(row.fecha) ?? "",
    horaEntrada: row.horaEntrada,
    horaSalida: row.horaSalida,
    horasTrabajadas: row.horasTrabajadas,
    horasExtra: row.horasExtra,
    llegadaTarde: row.llegadaTarde,
    minutosTardanza: row.minutosTardanza,
    observaciones: row.observaciones,
    latitud: row.latitud,
    longitud: row.longitud,
    precision: row.precision,
    latitudSalida: row.latitudSalida,
    longitudSalida: row.longitudSalida,
    precisionSalida: row.precisionSalida,
  };
}

export async function listAttendance(
  empresaId: string,
  filters: AttendanceFilters = {},
): Promise<AttendanceRecord[]> {
  const fecha: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) fecha.gte = new Date(filters.dateFrom);
  if (filters.dateTo) fecha.lte = new Date(filters.dateTo);

  const rows = await prisma.attendanceRecord.findMany({
    where: {
      empresaId,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters.dateFrom || filters.dateTo ? { fecha } : {}),
    },
    orderBy: { fecha: "desc" },
  });
  return rows.map(mapAttendance);
}

export async function getAttendanceRecord(
  id: string,
  empresaId: string,
): Promise<AttendanceRecord> {
  const row = await prisma.attendanceRecord.findUniqueOrThrow({ where: { id } });
  const record = mapAttendance(row);
  if (record.empresaId !== empresaId) throw new Error("No autorizado");
  return record;
}

async function findOpenAttendance(
  empresaId: string,
  employeeId: string,
  date: string,
): Promise<AttendanceRecord | null> {
  const row = await prisma.attendanceRecord.findFirst({
    where: { empresaId, employeeId, fecha: new Date(date), horaSalida: null },
  });
  return row ? mapAttendance(row) : null;
}

export async function checkIn(
  empresaId: string,
  employeeId: string,
  coords?: { lat: number; lon: number; accuracy?: number },
): Promise<AttendanceRecord> {
  const employee = await getEmployee(employeeId, empresaId);
  const date = todayISO();

  const existing = await findOpenAttendance(empresaId, employeeId, date);
  if (existing) return existing;

  const horaEntrada = nowHHMM();
  const entradaMin = toMinutes(horaEntrada)!;
  const schedule = await resolveEmployeeSchedule(empresaId, employeeId, date, employee);
  const habitualMin = toMinutes(schedule.horaEntrada);

  let llegadaTarde = false;
  let minutosTardanza = 0;
  if (habitualMin !== null) {
    const diff = entradaMin - habitualMin;
    if (diff > 0) {
      llegadaTarde = true;
      minutosTardanza = diff;
    }
  }

  const row = await prisma.attendanceRecord.create({
    data: {
      empresaId,
      employeeId,
      registro: `${employee.nombre} - ${date}`,
      fecha: new Date(date),
      horaEntrada,
      llegadaTarde,
      minutosTardanza,
      latitud: coords?.lat ?? null,
      longitud: coords?.lon ?? null,
      precision: coords?.accuracy ?? null,
    },
  });
  return mapAttendance(row);
}

interface DerivedAttendance {
  llegadaTarde: boolean;
  minutosTardanza: number;
  horasTrabajadas: number | null;
  horasExtra: number | null;
}

function computeDerived(
  schedule: { horaEntrada: string; horaSalida: string },
  horaEntrada: string,
  horaSalida: string | null,
): DerivedAttendance {
  const entradaMin = toMinutes(horaEntrada);
  const habitualEntradaMin = toMinutes(schedule.horaEntrada);

  let llegadaTarde = false;
  let minutosTardanza = 0;
  if (entradaMin !== null && habitualEntradaMin !== null) {
    const diff = entradaMin - habitualEntradaMin;
    if (diff > 0) {
      llegadaTarde = true;
      minutosTardanza = diff;
    }
  }

  let horasTrabajadas: number | null = null;
  let horasExtra: number | null = null;
  let salidaMin = horaSalida ? toMinutes(horaSalida) : null;
  if (entradaMin !== null && salidaMin !== null) {
    // Turnos que cruzan la medianoche (ej. 22:00 a 06:00): si la salida da un
    // horario estrictamente menor a la entrada, ocurrió al día siguiente. Si
    // son iguales (entrada y salida a la misma hora) son 0 horas, no 24.
    if (salidaMin < entradaMin) salidaMin += 24 * 60;
    horasTrabajadas = Math.max(0, Math.round(((salidaMin - entradaMin) / 60) * 100) / 100);
    let habitualSalidaMin = toMinutes(schedule.horaSalida);
    if (
      habitualEntradaMin !== null &&
      habitualSalidaMin !== null &&
      habitualSalidaMin < habitualEntradaMin
    ) {
      habitualSalidaMin += 24 * 60;
    }
    const jornadaEstandar =
      habitualEntradaMin !== null && habitualSalidaMin !== null
        ? Math.max(0, (habitualSalidaMin - habitualEntradaMin) / 60)
        : 8;
    horasExtra = Math.max(0, Math.round((horasTrabajadas - jornadaEstandar) * 100) / 100);
  }

  return { llegadaTarde, minutosTardanza, horasTrabajadas, horasExtra };
}

export async function checkOut(
  empresaId: string,
  recordId: string,
  coords?: { lat: number; lon: number; accuracy?: number },
): Promise<AttendanceRecord> {
  const record = await getAttendanceRecord(recordId, empresaId);
  const employee = await getEmployee(record.employeeId, empresaId);
  const horaSalida = nowHHMM();
  const schedule = await resolveEmployeeSchedule(
    empresaId,
    record.employeeId,
    record.fecha,
    employee,
  );
  const derived = computeDerived(schedule, record.horaEntrada, horaSalida);

  const row = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      horaSalida,
      horasTrabajadas: derived.horasTrabajadas,
      horasExtra: derived.horasExtra,
      latitudSalida: coords?.lat ?? null,
      longitudSalida: coords?.lon ?? null,
      precisionSalida: coords?.accuracy ?? null,
    },
  });
  return mapAttendance(row);
}

export async function updateAttendanceTimes(
  empresaId: string,
  recordId: string,
  horaEntrada: string,
  horaSalida: string | null,
): Promise<AttendanceRecord> {
  const record = await getAttendanceRecord(recordId, empresaId);
  const employee = await getEmployee(record.employeeId, empresaId);
  const schedule = await resolveEmployeeSchedule(
    empresaId,
    record.employeeId,
    record.fecha,
    employee,
  );
  const derived = computeDerived(schedule, horaEntrada, horaSalida);

  const row = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      horaEntrada,
      horaSalida: horaSalida || null,
      horasTrabajadas: derived.horasTrabajadas,
      horasExtra: derived.horasExtra,
      llegadaTarde: derived.llegadaTarde,
      minutosTardanza: derived.minutosTardanza,
    },
  });
  return mapAttendance(row);
}

export async function updateAttendanceNotes(
  empresaId: string,
  recordId: string,
  observaciones: string,
): Promise<AttendanceRecord> {
  await getAttendanceRecord(recordId, empresaId);
  const row = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: { observaciones },
  });
  return mapAttendance(row);
}

// ---------- absences ----------

function mapAbsence(row: {
  id: string;
  empresaId: string;
  employeeId: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: string;
  observaciones: string;
}): Absence {
  return {
    id: row.id,
    empresaId: row.empresaId,
    employeeId: row.employeeId,
    fechaInicio: toISODate(row.fechaInicio) ?? "",
    fechaFin: toISODate(row.fechaFin) ?? "",
    tipo: row.tipo as AbsenceType,
    observaciones: row.observaciones,
  };
}

export interface AbsenceFilters {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAbsences(
  empresaId: string,
  filters: AbsenceFilters = {},
): Promise<Absence[]> {
  const rows = await prisma.absence.findMany({
    where: {
      empresaId,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters.dateFrom ? { fechaFin: { gte: new Date(filters.dateFrom) } } : {}),
      ...(filters.dateTo ? { fechaInicio: { lte: new Date(filters.dateTo) } } : {}),
    },
    orderBy: { fechaInicio: "desc" },
  });
  return rows.map(mapAbsence);
}

export async function createAbsence(data: AbsenceInput): Promise<Absence> {
  const row = await prisma.absence.create({
    data: {
      empresaId: data.empresaId,
      employeeId: data.employeeId,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      tipo: data.tipo,
      observaciones: data.observaciones,
    },
  });
  return mapAbsence(row);
}

// ---------- users ----------

function mapUser(row: {
  id: string;
  empresaId: string | null;
  email: string;
  passwordHash: string;
  rol: string;
  employeeId: string | null;
}): AppUser {
  return {
    id: row.id,
    empresaId: row.empresaId,
    email: row.email,
    passwordHash: row.passwordHash,
    rol: row.rol as Rol,
    employeeId: row.employeeId,
  };
}

/** Busca un usuario por email en TODAS las empresas (así funciona el login, sin pedir "empresa"). */
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const row = await prisma.appUser.findUnique({ where: { email: email.toLowerCase() } });
  return row ? mapUser(row) : null;
}

export async function listUsers(empresaId: string): Promise<AppUser[]> {
  const rows = await prisma.appUser.findMany({ where: { empresaId } });
  return rows.map(mapUser);
}

export async function getUser(id: string, empresaId: string): Promise<AppUser> {
  const row = await prisma.appUser.findUniqueOrThrow({ where: { id } });
  const user = mapUser(row);
  if (user.empresaId !== empresaId) throw new Error("No autorizado");
  return user;
}

export async function updateUser(
  id: string,
  empresaId: string,
  data: { email: string; rol: Rol; employeeId: string | null; passwordHash?: string },
): Promise<AppUser> {
  await getUser(id, empresaId); // valida que el usuario sea de esta empresa

  const existing = await getUserByEmail(data.email);
  if (existing && existing.id !== id) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const row = await prisma.appUser.update({
    where: { id },
    data: {
      email: data.email.toLowerCase(),
      rol: data.rol,
      employeeId: data.employeeId,
      ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
    },
  });
  return mapUser(row);
}

export async function upsertUser(
  empresaId: string,
  data: { email: string; passwordHash: string; rol: Rol; employeeId: string | null },
): Promise<AppUser> {
  const existing = await getUserByEmail(data.email);
  if (existing && existing.empresaId !== empresaId) {
    throw new Error("Ya existe un usuario con ese email en otra empresa");
  }

  const fields = {
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    rol: data.rol,
    employeeId: data.employeeId,
    empresaId,
  };

  const row = existing
    ? await prisma.appUser.update({ where: { id: existing.id }, data: fields })
    : await prisma.appUser.create({ data: fields });
  return mapUser(row);
}

// ---------- holidays (feriados) ----------

function mapHoliday(row: {
  id: string;
  empresaId: string;
  nombre: string;
  fecha: Date;
  tipo: string;
}): Holiday {
  return {
    id: row.id,
    empresaId: row.empresaId,
    nombre: row.nombre,
    fecha: toISODate(row.fecha) ?? "",
    tipo: row.tipo as HolidayType,
  };
}

export async function listHolidays(
  empresaId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<Holiday[]> {
  const fecha: { gte?: Date; lte?: Date } = {};
  if (dateFrom) fecha.gte = new Date(dateFrom);
  if (dateTo) fecha.lte = new Date(dateTo);

  const rows = await prisma.holiday.findMany({
    where: { empresaId, ...(dateFrom || dateTo ? { fecha } : {}) },
    orderBy: { fecha: "asc" },
  });
  return rows.map(mapHoliday);
}

export async function createHoliday(data: HolidayInput): Promise<Holiday> {
  const row = await prisma.holiday.create({
    data: {
      empresaId: data.empresaId,
      nombre: data.nombre,
      fecha: new Date(data.fecha),
      tipo: data.tipo,
    },
  });
  return mapHoliday(row);
}

/** Crea feriados salteando fechas que ya existen (para poder reimportar sin duplicar). */
export async function createHolidaysBulk(
  empresaId: string,
  items: HolidayInput[],
): Promise<number> {
  const existing = await listHolidays(empresaId);
  const existingDates = new Set(existing.map((h) => h.fecha));
  let created = 0;
  for (const item of items) {
    if (existingDates.has(item.fecha)) continue;
    await createHoliday(item);
    existingDates.add(item.fecha);
    created += 1;
  }
  return created;
}

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

/**
 * Si el año todavía no tiene feriados nacionales cargados para esta empresa, los trae
 * automáticamente desde la API pública de feriados de Argentina y los guarda. Si la API
 * externa falla o no responde, no rompe nada: el calendario sigue funcionando sin esos feriados.
 */
export async function ensureHolidaysForYear(empresaId: string, year: number): Promise<void> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const existing = await listHolidays(empresaId, from, to);
  if (existing.some((h) => h.tipo === "Nacional")) return;

  try {
    const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/AR`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as NagerHoliday[];
    const items: HolidayInput[] = data.map((h) => ({
      nombre: h.localName || h.name,
      fecha: h.date,
      tipo: "Nacional",
      empresaId,
    }));
    await createHolidaysBulk(empresaId, items);
  } catch (err) {
    console.error("No se pudo auto-importar feriados", err);
  }
}

// ---------- shift templates (turnos) ----------

function mapShiftTemplate(row: {
  id: string;
  empresaId: string;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
}): ShiftTemplate {
  return {
    id: row.id,
    empresaId: row.empresaId,
    nombre: row.nombre,
    horaEntrada: row.horaEntrada,
    horaSalida: row.horaSalida,
  };
}

export async function listShiftTemplates(empresaId: string): Promise<ShiftTemplate[]> {
  const rows = await prisma.shiftTemplate.findMany({
    where: { empresaId },
    orderBy: { nombre: "asc" },
  });
  return rows.map(mapShiftTemplate);
}

export async function createShiftTemplate(data: ShiftTemplateInput): Promise<ShiftTemplate> {
  const row = await prisma.shiftTemplate.create({
    data: {
      empresaId: data.empresaId,
      nombre: data.nombre,
      horaEntrada: data.horaEntrada,
      horaSalida: data.horaSalida,
    },
  });
  return mapShiftTemplate(row);
}

export async function getShiftTemplate(id: string, empresaId: string): Promise<ShiftTemplate> {
  const row = await prisma.shiftTemplate.findUniqueOrThrow({ where: { id } });
  const shift = mapShiftTemplate(row);
  if (shift.empresaId !== empresaId) throw new Error("No autorizado");
  return shift;
}

export async function updateShiftTemplate(
  id: string,
  empresaId: string,
  data: Omit<ShiftTemplateInput, "empresaId">,
): Promise<ShiftTemplate> {
  await getShiftTemplate(id, empresaId); // lanza si el turno no es de esta empresa
  const row = await prisma.shiftTemplate.update({
    where: { id },
    data: { nombre: data.nombre, horaEntrada: data.horaEntrada, horaSalida: data.horaSalida },
  });
  return mapShiftTemplate(row);
}

export async function deleteShiftTemplate(id: string, empresaId: string): Promise<void> {
  await getShiftTemplate(id, empresaId); // lanza si el turno no es de esta empresa
  // Si hay asignaciones que todavía usan este turno, la base rechaza el borrado
  // (a diferencia de Notion, acá no hay forma de "tirar a la papelera" sin romper
  // el historial) — el llamador debe mostrar ese error al usuario.
  await prisma.shiftTemplate.delete({ where: { id } });
}

// ---------- shift assignments (asignaciones de turno) ----------

function mapShiftAssignment(row: {
  id: string;
  empresaId: string;
  employeeId: string;
  shiftId: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  diasSemana: string[];
  esFijo: boolean;
}): ShiftAssignment {
  return {
    id: row.id,
    empresaId: row.empresaId,
    employeeId: row.employeeId,
    shiftId: row.shiftId,
    fechaInicio: toISODate(row.fechaInicio) ?? "",
    fechaFin: toISODate(row.fechaFin),
    diasSemana: row.diasSemana as DiaSemana[],
    esFijo: row.esFijo,
  };
}

export async function listShiftAssignments(
  empresaId: string,
  employeeId?: string,
): Promise<ShiftAssignment[]> {
  const rows = await prisma.shiftAssignment.findMany({
    where: { empresaId, ...(employeeId ? { employeeId } : {}) },
    orderBy: { fechaInicio: "desc" },
  });
  return rows.map(mapShiftAssignment);
}

export async function createShiftAssignment(
  data: ShiftAssignmentInput,
): Promise<ShiftAssignment> {
  const row = await prisma.shiftAssignment.create({
    data: {
      empresaId: data.empresaId,
      employeeId: data.employeeId,
      shiftId: data.shiftId,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: toDateOrNull(data.fechaFin),
      diasSemana: data.diasSemana,
      esFijo: data.esFijo,
    },
  });
  return mapShiftAssignment(row);
}

export async function deleteShiftAssignment(id: string, empresaId: string): Promise<void> {
  const row = await prisma.shiftAssignment.findUniqueOrThrow({ where: { id } });
  if (row.empresaId !== empresaId) throw new Error("No autorizado");
  await prisma.shiftAssignment.delete({ where: { id } });
}

const DIAS_SEMANA_ORDEN = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"] as const;

/** Código de día (LUN..DOM) para una fecha ISO, en hora local (sin corrimiento UTC). */
function diaSemanaOf(dateISO: string): (typeof DIAS_SEMANA_ORDEN)[number] {
  const day = new Date(`${dateISO}T00:00:00`).getDay();
  return DIAS_SEMANA_ORDEN[(day + 6) % 7];
}

interface ResolvedSchedule {
  horaEntrada: string;
  horaSalida: string;
  rotativo: boolean;
}

/** Misma lógica de resolución, pero en memoria — para poder resolver el horario
 * de N empleados con las asignaciones/turnos de la empresa ya traídos una sola vez,
 * en vez de una consulta por empleado (ver `resolveSchedulesForEmployees`). */
function resolveScheduleFromLists(
  assignments: ShiftAssignment[],
  shifts: ShiftTemplate[],
  employeeId: string,
  date: string,
  employee: Employee,
): ResolvedSchedule {
  const dia = diaSemanaOf(date);
  const match = assignments.find(
    (a) =>
      a.employeeId === employeeId &&
      date >= a.fechaInicio &&
      (a.fechaFin === null || date <= a.fechaFin) &&
      (a.diasSemana.length === 0 || a.diasSemana.includes(dia)),
  );
  if (match) {
    const shift = shifts.find((s) => s.id === match.shiftId);
    if (shift) {
      return { horaEntrada: shift.horaEntrada, horaSalida: shift.horaSalida, rotativo: !match.esFijo };
    }
  }

  const defaultShift = employee.shiftId ? shifts.find((s) => s.id === employee.shiftId) : undefined;
  if (defaultShift) {
    return { horaEntrada: defaultShift.horaEntrada, horaSalida: defaultShift.horaSalida, rotativo: false };
  }

  return { horaEntrada: "", horaSalida: "", rotativo: false };
}

/**
 * Resuelve qué horario le toca a un empleado en una fecha puntual: si tiene una
 * asignación de turno rotativo vigente ese día (y que incluya ese día de la semana),
 * usa ese turno; si no, cae al turno fijo asignado en su ficha; si tampoco tiene uno,
 * queda sin horario de referencia.
 *
 * Pensada para un solo empleado (ej. al fichar). Para resolver varios a la vez
 * (una página con toda la nómina), usar `resolveSchedulesForEmployees` — evita
 * repetir la consulta de turnos/asignaciones de la empresa por cada empleado.
 */
export async function resolveEmployeeSchedule(
  empresaId: string,
  employeeId: string,
  date: string,
  employee: Employee,
): Promise<ResolvedSchedule> {
  const [assignments, shifts] = await Promise.all([
    listShiftAssignments(empresaId, employeeId),
    listShiftTemplates(empresaId),
  ]);
  return resolveScheduleFromLists(assignments, shifts, employeeId, date, employee);
}

/** Resuelve el horario de varios empleados para una misma fecha con una sola
 * consulta de asignaciones y una de turnos, en vez de dos por empleado. */
export async function resolveSchedulesForEmployees(
  empresaId: string,
  employees: Employee[],
  date: string,
): Promise<Map<string, ResolvedSchedule>> {
  const [assignments, shifts] = await Promise.all([
    listShiftAssignments(empresaId),
    listShiftTemplates(empresaId),
  ]);
  return new Map(
    employees.map((e) => [e.id, resolveScheduleFromLists(assignments, shifts, e.id, date, e)]),
  );
}

/** True si el empleado tiene alguna asignación de turno cargada (usa rotativos). */
export async function employeeUsesRotatingShifts(
  empresaId: string,
  employeeId: string,
): Promise<boolean> {
  const assignments = await listShiftAssignments(empresaId, employeeId);
  return assignments.length > 0;
}
