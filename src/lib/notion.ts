import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { PropertyFilter } from "@notionhq/client/build/src/api-endpoints/common";
import type {
  Absence,
  AbsenceInput,
  AbsenceType,
  AppUser,
  AttendanceRecord,
  Company,
  CompanyInput,
  Employee,
  EmployeeInput,
  Estado,
  Holiday,
  HolidayInput,
  HolidayType,
  Rol,
  ShiftAssignment,
  ShiftAssignmentInput,
  ShiftTemplate,
  ShiftTemplateInput,
} from "./types";
import { nowHHMM, todayISO } from "./timezone";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const EMPLOYEES_DB = process.env.NOTION_EMPLOYEES_DB_ID as string;
const ATTENDANCE_DB = process.env.NOTION_ATTENDANCE_DB_ID as string;
const EMPLOYEES_DS = process.env.NOTION_EMPLOYEES_DATA_SOURCE_ID as string;
const ATTENDANCE_DS = process.env.NOTION_ATTENDANCE_DATA_SOURCE_ID as string;
const ABSENCES_DB = process.env.NOTION_ABSENCES_DB_ID as string;
const ABSENCES_DS = process.env.NOTION_ABSENCES_DATA_SOURCE_ID as string;
const USERS_DB = process.env.NOTION_USERS_DB_ID as string;
const USERS_DS = process.env.NOTION_USERS_DATA_SOURCE_ID as string;
const HOLIDAYS_DB = process.env.NOTION_HOLIDAYS_DB_ID as string;
const HOLIDAYS_DS = process.env.NOTION_HOLIDAYS_DATA_SOURCE_ID as string;
const SHIFTS_DB = process.env.NOTION_SHIFTS_DB_ID as string;
const SHIFTS_DS = process.env.NOTION_SHIFTS_DATA_SOURCE_ID as string;
const SHIFT_ASSIGNMENTS_DB = process.env.NOTION_SHIFT_ASSIGNMENTS_DB_ID as string;
const SHIFT_ASSIGNMENTS_DS = process.env.NOTION_SHIFT_ASSIGNMENTS_DATA_SOURCE_ID as string;
const COMPANIES_DB = process.env.NOTION_COMPANIES_DB_ID as string;
const COMPANIES_DS = process.env.NOTION_COMPANIES_DATA_SOURCE_ID as string;

// ---------- helpers ----------

function text(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  if (!p) return "";
  if (p.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("");
  if (p.type === "title") return p.title.map((t) => t.plain_text).join("");
  return "";
}

function selectVal(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  if (p?.type === "select") return p.select?.name ?? "";
  return "";
}

function emailVal(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  return p?.type === "email" ? p.email ?? "" : "";
}

function phoneVal(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  return p?.type === "phone_number" ? p.phone_number ?? "" : "";
}

function dateVal(page: PageObjectResponse, prop: string): string | null {
  const p = page.properties[prop];
  return p?.type === "date" ? p.date?.start ?? null : null;
}

function numberVal(page: PageObjectResponse, prop: string): number | null {
  const p = page.properties[prop];
  return p?.type === "number" ? p.number : null;
}

function checkboxVal(page: PageObjectResponse, prop: string): boolean {
  const p = page.properties[prop];
  return p?.type === "checkbox" ? p.checkbox : false;
}

function relationFirstId(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  if (p?.type === "relation" && p.relation.length > 0) return p.relation[0].id;
  return "";
}

/** Filtro de propiedad para restringir cualquier consulta a los datos de una empresa. */
function empresaFilter(empresaId: string): PropertyFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { property: "Empresa", relation: { contains: empresaId } } as any;
}

function withEmpresaFilter(empresaId: string, extra: PropertyFilter[]) {
  const all = [empresaFilter(empresaId), ...extra];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (all.length === 1 ? all[0] : { and: all }) as any;
}

function mapEmployee(page: PageObjectResponse): Employee {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    nombre: text(page, "Nombre completo"),
    legajo: text(page, "Legajo"),
    dni: text(page, "DNI"),
    puesto: text(page, "Puesto"),
    area: selectVal(page, "Area"),
    email: emailVal(page, "Email"),
    telefono: phoneVal(page, "Telefono"),
    fechaIngreso: dateVal(page, "Fecha de ingreso"),
    horarioEntrada: text(page, "Horario entrada habitual"),
    horarioSalida: text(page, "Horario salida habitual"),
    estado: (selectVal(page, "Estado") || "Activo") as Employee["estado"],
    salarioBase: numberVal(page, "Salario base"),
  };
}

function mapAttendance(page: PageObjectResponse): AttendanceRecord {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    registro: text(page, "Registro"),
    employeeId: relationFirstId(page, "Empleado"),
    fecha: dateVal(page, "Fecha") ?? "",
    horaEntrada: text(page, "Hora entrada"),
    horaSalida: text(page, "Hora salida") || null,
    horasTrabajadas: numberVal(page, "Horas trabajadas"),
    horasExtra: numberVal(page, "Horas extra"),
    llegadaTarde: checkboxVal(page, "Llegada tarde"),
    minutosTardanza: numberVal(page, "Minutos de tardanza"),
    observaciones: text(page, "Observaciones"),
    latitud: numberVal(page, "Latitud"),
    longitud: numberVal(page, "Longitud"),
    precision: numberVal(page, "Precision"),
  };
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export { nowHHMM, todayISO };

// ---------- companies (empresas) ----------

function mapCompany(page: PageObjectResponse): Company {
  return {
    id: page.id,
    nombre: text(page, "Nombre"),
    estado: (selectVal(page, "Estado") || "Activo") as Estado,
  };
}

/** Lista TODAS las empresas, sin filtrar — solo para altas de clientes y el cron multi-empresa. */
export async function listCompanies(): Promise<Company[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: COMPANIES_DS,
      start_cursor: cursor ?? undefined,
      sorts: [{ property: "Nombre", direction: "ascending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapCompany);
}

export async function getCompany(id: string): Promise<Company> {
  const page = (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
  return mapCompany(page);
}

export async function createCompany(data: CompanyInput): Promise<Company> {
  const page = (await notion.pages.create({
    parent: { database_id: COMPANIES_DB },
    properties: {
      Nombre: { title: [{ text: { content: data.nombre } }] },
      Estado: { select: { name: data.estado || "Activo" } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapCompany(page);
}

// ---------- employees ----------

export async function listEmployees(empresaId: string): Promise<Employee[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: EMPLOYEES_DS,
      start_cursor: cursor ?? undefined,
      filter: empresaFilter(empresaId),
      sorts: [{ property: "Nombre completo", direction: "ascending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapEmployee);
}

export async function getEmployee(id: string, empresaId: string): Promise<Employee> {
  const page = (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
  const employee = mapEmployee(page);
  if (employee.empresaId !== empresaId) throw new Error("No autorizado");
  return employee;
}

function employeeProperties(data: EmployeeInput) {
  return {
    "Nombre completo": { title: [{ text: { content: data.nombre } }] },
    Legajo: { rich_text: [{ text: { content: data.legajo } }] },
    DNI: { rich_text: [{ text: { content: data.dni } }] },
    Puesto: { rich_text: [{ text: { content: data.puesto } }] },
    Area: data.area ? { select: { name: data.area } } : { select: null },
    Email: { email: data.email || null },
    Telefono: { phone_number: data.telefono || null },
    "Fecha de ingreso": data.fechaIngreso
      ? { date: { start: data.fechaIngreso } }
      : { date: null },
    "Horario entrada habitual": {
      rich_text: [{ text: { content: data.horarioEntrada } }],
    },
    "Horario salida habitual": {
      rich_text: [{ text: { content: data.horarioSalida } }],
    },
    Estado: { select: { name: data.estado || "Activo" } },
    "Salario base":
      data.salarioBase === null || data.salarioBase === undefined
        ? { number: null }
        : { number: data.salarioBase },
    Empresa: { relation: [{ id: data.empresaId }] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export async function createEmployee(data: EmployeeInput): Promise<Employee> {
  const page = (await notion.pages.create({
    parent: { database_id: EMPLOYEES_DB },
    properties: employeeProperties(data),
  })) as PageObjectResponse;
  return mapEmployee(page);
}

export async function updateEmployee(
  id: string,
  empresaId: string,
  data: EmployeeInput
): Promise<Employee> {
  await getEmployee(id, empresaId); // lanza si el empleado no es de esta empresa
  const page = (await notion.pages.update({
    page_id: id,
    properties: employeeProperties(data),
  })) as PageObjectResponse;
  return mapEmployee(page);
}

// ---------- attendance ----------

export interface AttendanceFilters {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAttendance(
  empresaId: string,
  filters: AttendanceFilters = {}
): Promise<AttendanceRecord[]> {
  const andFilters: PropertyFilter[] = [];
  if (filters.employeeId) {
    andFilters.push({ property: "Empleado", relation: { contains: filters.employeeId } });
  }
  if (filters.dateFrom) {
    andFilters.push({ property: "Fecha", date: { on_or_after: filters.dateFrom } });
  }
  if (filters.dateTo) {
    andFilters.push({ property: "Fecha", date: { on_or_before: filters.dateTo } });
  }

  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: ATTENDANCE_DS,
      start_cursor: cursor ?? undefined,
      filter: withEmpresaFilter(empresaId, andFilters),
      sorts: [{ property: "Fecha", direction: "descending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapAttendance);
}

export async function getAttendanceRecord(id: string, empresaId: string): Promise<AttendanceRecord> {
  const page = (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
  const record = mapAttendance(page);
  if (record.empresaId !== empresaId) throw new Error("No autorizado");
  return record;
}

async function findOpenAttendance(
  empresaId: string,
  employeeId: string,
  date: string
): Promise<AttendanceRecord | null> {
  const res = await notion.dataSources.query({
    data_source_id: ATTENDANCE_DS,
    filter: {
      and: [
        { property: "Empresa", relation: { contains: empresaId } },
        { property: "Empleado", relation: { contains: employeeId } },
        { property: "Fecha", date: { equals: date } },
        { property: "Hora salida", rich_text: { is_empty: true } },
      ],
    },
  });
  const page = res.results[0] as PageObjectResponse | undefined;
  return page ? mapAttendance(page) : null;
}

export async function checkIn(
  empresaId: string,
  employeeId: string,
  coords?: { lat: number; lon: number; accuracy?: number }
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

  const page = (await notion.pages.create({
    parent: { database_id: ATTENDANCE_DB },
    properties: {
      Registro: { title: [{ text: { content: `${employee.nombre} - ${date}` } }] },
      Empleado: { relation: [{ id: employeeId }] },
      Empresa: { relation: [{ id: empresaId }] },
      Fecha: { date: { start: date } },
      "Hora entrada": { rich_text: [{ text: { content: horaEntrada } }] },
      "Llegada tarde": { checkbox: llegadaTarde },
      "Minutos de tardanza": { number: minutosTardanza },
      Latitud: { number: coords?.lat ?? null },
      Longitud: { number: coords?.lon ?? null },
      Precision: { number: coords?.accuracy ?? null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;

  return mapAttendance(page);
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
  horaSalida: string | null
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
  const salidaMin = horaSalida ? toMinutes(horaSalida) : null;
  if (entradaMin !== null && salidaMin !== null) {
    horasTrabajadas = Math.max(0, Math.round(((salidaMin - entradaMin) / 60) * 100) / 100);
    const habitualSalidaMin = toMinutes(schedule.horaSalida);
    const jornadaEstandar =
      habitualEntradaMin !== null && habitualSalidaMin !== null
        ? Math.max(0, (habitualSalidaMin - habitualEntradaMin) / 60)
        : 8;
    horasExtra = Math.max(0, Math.round((horasTrabajadas - jornadaEstandar) * 100) / 100);
  }

  return { llegadaTarde, minutosTardanza, horasTrabajadas, horasExtra };
}

export async function checkOut(empresaId: string, recordId: string): Promise<AttendanceRecord> {
  const record = await getAttendanceRecord(recordId, empresaId);
  const employee = await getEmployee(record.employeeId, empresaId);
  const horaSalida = nowHHMM();
  const schedule = await resolveEmployeeSchedule(empresaId, record.employeeId, record.fecha, employee);
  const derived = computeDerived(schedule, record.horaEntrada, horaSalida);

  const updated = (await notion.pages.update({
    page_id: recordId,
    properties: {
      "Hora salida": { rich_text: [{ text: { content: horaSalida } }] },
      "Horas trabajadas": { number: derived.horasTrabajadas },
      "Horas extra": { number: derived.horasExtra },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;

  return mapAttendance(updated);
}

export async function updateAttendanceTimes(
  empresaId: string,
  recordId: string,
  horaEntrada: string,
  horaSalida: string | null
): Promise<AttendanceRecord> {
  const record = await getAttendanceRecord(recordId, empresaId);
  const employee = await getEmployee(record.employeeId, empresaId);
  const schedule = await resolveEmployeeSchedule(empresaId, record.employeeId, record.fecha, employee);
  const derived = computeDerived(schedule, horaEntrada, horaSalida);

  const updated = (await notion.pages.update({
    page_id: recordId,
    properties: {
      "Hora entrada": { rich_text: [{ text: { content: horaEntrada } }] },
      "Hora salida": horaSalida ? { rich_text: [{ text: { content: horaSalida } }] } : { rich_text: [] },
      "Horas trabajadas": { number: derived.horasTrabajadas },
      "Horas extra": { number: derived.horasExtra },
      "Llegada tarde": { checkbox: derived.llegadaTarde },
      "Minutos de tardanza": { number: derived.minutosTardanza },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;

  return mapAttendance(updated);
}

export async function updateAttendanceNotes(
  empresaId: string,
  recordId: string,
  observaciones: string
): Promise<AttendanceRecord> {
  await getAttendanceRecord(recordId, empresaId);
  const updated = (await notion.pages.update({
    page_id: recordId,
    properties: {
      Observaciones: { rich_text: [{ text: { content: observaciones } }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapAttendance(updated);
}

// ---------- absences ----------

function mapAbsence(page: PageObjectResponse): Absence {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    employeeId: relationFirstId(page, "Empleado"),
    fechaInicio: dateVal(page, "Fecha inicio") ?? "",
    fechaFin: dateVal(page, "Fecha fin") ?? "",
    tipo: (selectVal(page, "Tipo") || "Vacaciones") as AbsenceType,
    observaciones: text(page, "Observaciones"),
  };
}

export interface AbsenceFilters {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAbsences(
  empresaId: string,
  filters: AbsenceFilters = {}
): Promise<Absence[]> {
  const andFilters: PropertyFilter[] = [];
  if (filters.employeeId) {
    andFilters.push({ property: "Empleado", relation: { contains: filters.employeeId } });
  }
  if (filters.dateFrom) {
    andFilters.push({ property: "Fecha fin", date: { on_or_after: filters.dateFrom } });
  }
  if (filters.dateTo) {
    andFilters.push({ property: "Fecha inicio", date: { on_or_before: filters.dateTo } });
  }

  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: ABSENCES_DS,
      start_cursor: cursor ?? undefined,
      filter: withEmpresaFilter(empresaId, andFilters),
      sorts: [{ property: "Fecha inicio", direction: "descending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapAbsence);
}

export async function createAbsence(data: AbsenceInput): Promise<Absence> {
  const page = (await notion.pages.create({
    parent: { database_id: ABSENCES_DB },
    properties: {
      Titulo: { title: [{ text: { content: `${data.tipo} · ${data.fechaInicio}` } }] },
      Empleado: { relation: [{ id: data.employeeId }] },
      Empresa: { relation: [{ id: data.empresaId }] },
      "Fecha inicio": { date: { start: data.fechaInicio } },
      "Fecha fin": { date: { start: data.fechaFin } },
      Tipo: { select: { name: data.tipo } },
      Observaciones: { rich_text: [{ text: { content: data.observaciones } }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapAbsence(page);
}

// ---------- users ----------

function mapUser(page: PageObjectResponse): AppUser {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    email: text(page, "Email").toLowerCase(),
    passwordHash: text(page, "Password hash"),
    rol: (selectVal(page, "Rol") || "Empleado") as Rol,
    employeeId: relationFirstId(page, "Empleado") || null,
  };
}

/** Busca un usuario por email en TODAS las empresas (así funciona el login, sin pedir "empresa"). */
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const res = await notion.dataSources.query({
    data_source_id: USERS_DS,
    filter: {
      property: "Email",
      title: { equals: email.toLowerCase() },
    },
  });
  const page = res.results[0] as PageObjectResponse | undefined;
  return page ? mapUser(page) : null;
}

export async function listUsers(empresaId: string): Promise<AppUser[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: USERS_DS,
      start_cursor: cursor ?? undefined,
      filter: empresaFilter(empresaId),
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapUser);
}

export async function upsertUser(
  empresaId: string,
  data: {
    email: string;
    passwordHash: string;
    rol: Rol;
    employeeId: string | null;
  }
): Promise<AppUser> {
  const existing = await getUserByEmail(data.email);
  if (existing && existing.empresaId !== empresaId) {
    throw new Error("Ya existe un usuario con ese email en otra empresa");
  }
  const properties = {
    Email: { title: [{ text: { content: data.email.toLowerCase() } }] },
    "Password hash": { rich_text: [{ text: { content: data.passwordHash } }] },
    Rol: { select: { name: data.rol } },
    Empleado: data.employeeId ? { relation: [{ id: data.employeeId }] } : { relation: [] },
    Empresa: { relation: [{ id: empresaId }] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const page = existing
    ? ((await notion.pages.update({ page_id: existing.id, properties })) as PageObjectResponse)
    : ((await notion.pages.create({
        parent: { database_id: USERS_DB },
        properties,
      })) as PageObjectResponse);
  return mapUser(page);
}

// ---------- holidays (feriados) ----------

function mapHoliday(page: PageObjectResponse): Holiday {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    nombre: text(page, "Nombre"),
    fecha: dateVal(page, "Fecha") ?? "",
    tipo: (selectVal(page, "Tipo") || "Nacional") as HolidayType,
  };
}

export async function listHolidays(
  empresaId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Holiday[]> {
  const andFilters: PropertyFilter[] = [];
  if (dateFrom) andFilters.push({ property: "Fecha", date: { on_or_after: dateFrom } });
  if (dateTo) andFilters.push({ property: "Fecha", date: { on_or_before: dateTo } });

  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: HOLIDAYS_DS,
      start_cursor: cursor ?? undefined,
      filter: withEmpresaFilter(empresaId, andFilters),
      sorts: [{ property: "Fecha", direction: "ascending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapHoliday);
}

export async function createHoliday(data: HolidayInput): Promise<Holiday> {
  const page = (await notion.pages.create({
    parent: { database_id: HOLIDAYS_DB },
    properties: {
      Nombre: { title: [{ text: { content: data.nombre } }] },
      Fecha: { date: { start: data.fecha } },
      Tipo: { select: { name: data.tipo } },
      Empresa: { relation: [{ id: data.empresaId }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapHoliday(page);
}

/** Crea feriados salteando fechas que ya existen (para poder reimportar sin duplicar). */
export async function createHolidaysBulk(empresaId: string, items: HolidayInput[]): Promise<number> {
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

function mapShiftTemplate(page: PageObjectResponse): ShiftTemplate {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    nombre: text(page, "Nombre"),
    horaEntrada: text(page, "Hora entrada"),
    horaSalida: text(page, "Hora salida"),
  };
}

export async function listShiftTemplates(empresaId: string): Promise<ShiftTemplate[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: SHIFTS_DS,
      start_cursor: cursor ?? undefined,
      filter: empresaFilter(empresaId),
      sorts: [{ property: "Nombre", direction: "ascending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapShiftTemplate);
}

export async function createShiftTemplate(data: ShiftTemplateInput): Promise<ShiftTemplate> {
  const page = (await notion.pages.create({
    parent: { database_id: SHIFTS_DB },
    properties: {
      Nombre: { title: [{ text: { content: data.nombre } }] },
      "Hora entrada": { rich_text: [{ text: { content: data.horaEntrada } }] },
      "Hora salida": { rich_text: [{ text: { content: data.horaSalida } }] },
      Empresa: { relation: [{ id: data.empresaId }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapShiftTemplate(page);
}

// ---------- shift assignments (asignaciones de turno) ----------

function mapShiftAssignment(page: PageObjectResponse): ShiftAssignment {
  return {
    id: page.id,
    empresaId: relationFirstId(page, "Empresa"),
    employeeId: relationFirstId(page, "Empleado"),
    shiftId: relationFirstId(page, "Turno"),
    fechaInicio: dateVal(page, "Fecha inicio") ?? "",
    fechaFin: dateVal(page, "Fecha fin"),
  };
}

export async function listShiftAssignments(
  empresaId: string,
  employeeId?: string
): Promise<ShiftAssignment[]> {
  const andFilters: PropertyFilter[] = [];
  if (employeeId) {
    andFilters.push({ property: "Empleado", relation: { contains: employeeId } });
  }
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: SHIFT_ASSIGNMENTS_DS,
      start_cursor: cursor ?? undefined,
      filter: withEmpresaFilter(empresaId, andFilters),
      sorts: [{ property: "Fecha inicio", direction: "descending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapShiftAssignment);
}

export async function createShiftAssignment(
  data: ShiftAssignmentInput,
  employeeName: string,
  shiftName: string
): Promise<ShiftAssignment> {
  const page = (await notion.pages.create({
    parent: { database_id: SHIFT_ASSIGNMENTS_DB },
    properties: {
      Titulo: {
        title: [{ text: { content: `${employeeName} - ${shiftName} desde ${data.fechaInicio}` } }],
      },
      Empleado: { relation: [{ id: data.employeeId }] },
      Turno: { relation: [{ id: data.shiftId }] },
      Empresa: { relation: [{ id: data.empresaId }] },
      "Fecha inicio": { date: { start: data.fechaInicio } },
      "Fecha fin": data.fechaFin ? { date: { start: data.fechaFin } } : { date: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapShiftAssignment(page);
}

/**
 * Resuelve qué horario le toca a un empleado en una fecha puntual: si tiene una
 * asignación de turno vigente ese día, usa ese turno; si no, cae al horario fijo
 * de su ficha (para clientes que no usan turnos rotativos, nada cambia).
 */
export async function resolveEmployeeSchedule(
  empresaId: string,
  employeeId: string,
  date: string,
  employee: Employee
): Promise<{ horaEntrada: string; horaSalida: string; rotativo: boolean }> {
  const assignments = await listShiftAssignments(empresaId, employeeId);
  const match = assignments.find(
    (a) => date >= a.fechaInicio && (a.fechaFin === null || date <= a.fechaFin)
  );
  if (!match) {
    return { horaEntrada: employee.horarioEntrada, horaSalida: employee.horarioSalida, rotativo: false };
  }
  const shifts = await listShiftTemplates(empresaId);
  const shift = shifts.find((s) => s.id === match.shiftId);
  if (!shift) {
    return { horaEntrada: employee.horarioEntrada, horaSalida: employee.horarioSalida, rotativo: false };
  }
  return { horaEntrada: shift.horaEntrada, horaSalida: shift.horaSalida, rotativo: true };
}

/** True si el empleado tiene alguna asignación de turno cargada (usa rotativos). */
export async function employeeUsesRotatingShifts(empresaId: string, employeeId: string): Promise<boolean> {
  const assignments = await listShiftAssignments(empresaId, employeeId);
  return assignments.length > 0;
}
