import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { PropertyFilter } from "@notionhq/client/build/src/api-endpoints/common";
import type { AttendanceRecord, Employee, EmployeeInput } from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const EMPLOYEES_DB = process.env.NOTION_EMPLOYEES_DB_ID as string;
const ATTENDANCE_DB = process.env.NOTION_ATTENDANCE_DB_ID as string;
const EMPLOYEES_DS = process.env.NOTION_EMPLOYEES_DATA_SOURCE_ID as string;
const ATTENDANCE_DS = process.env.NOTION_ATTENDANCE_DATA_SOURCE_ID as string;

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

function mapEmployee(page: PageObjectResponse): Employee {
  return {
    id: page.id,
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
  };
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayISO(): string {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

// ---------- employees ----------

export async function listEmployees(): Promise<Employee[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: EMPLOYEES_DS,
      start_cursor: cursor ?? undefined,
      sorts: [{ property: "Nombre completo", direction: "ascending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const page = (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
  return mapEmployee(page);
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
  data: EmployeeInput
): Promise<Employee> {
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

  const filter =
    andFilters.length === 0
      ? undefined
      : andFilters.length === 1
        ? andFilters[0]
        : { and: andFilters };

  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: ATTENDANCE_DS,
      start_cursor: cursor ?? undefined,
      filter,
      sorts: [{ property: "Fecha", direction: "descending" }],
    });
    results.push(...(res.results as PageObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(mapAttendance);
}

export async function getAttendanceRecord(id: string): Promise<AttendanceRecord> {
  const page = (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
  return mapAttendance(page);
}

export async function findOpenAttendance(
  employeeId: string,
  date: string
): Promise<AttendanceRecord | null> {
  const res = await notion.dataSources.query({
    data_source_id: ATTENDANCE_DS,
    filter: {
      and: [
        { property: "Empleado", relation: { contains: employeeId } },
        { property: "Fecha", date: { equals: date } },
        { property: "Hora salida", rich_text: { is_empty: true } },
      ],
    },
  });
  const page = res.results[0] as PageObjectResponse | undefined;
  return page ? mapAttendance(page) : null;
}

export async function checkIn(employeeId: string): Promise<AttendanceRecord> {
  const employee = await getEmployee(employeeId);
  const date = todayISO();

  const existing = await findOpenAttendance(employeeId, date);
  if (existing) return existing;

  const horaEntrada = nowHHMM();
  const entradaMin = toMinutes(horaEntrada)!;
  const habitualMin = toMinutes(employee.horarioEntrada);

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
      Fecha: { date: { start: date } },
      "Hora entrada": { rich_text: [{ text: { content: horaEntrada } }] },
      "Llegada tarde": { checkbox: llegadaTarde },
      "Minutos de tardanza": { number: minutosTardanza },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;

  return mapAttendance(page);
}

export async function checkOut(recordId: string): Promise<AttendanceRecord> {
  const page = (await notion.pages.retrieve({ page_id: recordId })) as PageObjectResponse;
  const record = mapAttendance(page);
  const employee = await getEmployee(record.employeeId);

  const horaSalida = nowHHMM();
  const entradaMin = toMinutes(record.horaEntrada)!;
  const salidaMin = toMinutes(horaSalida)!;
  const horasTrabajadas = Math.max(0, Math.round(((salidaMin - entradaMin) / 60) * 100) / 100);

  const habitualEntradaMin = toMinutes(employee.horarioEntrada);
  const habitualSalidaMin = toMinutes(employee.horarioSalida);
  const jornadaEstandar =
    habitualEntradaMin !== null && habitualSalidaMin !== null
      ? Math.max(0, (habitualSalidaMin - habitualEntradaMin) / 60)
      : 8;

  const horasExtra = Math.max(0, Math.round((horasTrabajadas - jornadaEstandar) * 100) / 100);

  const updated = (await notion.pages.update({
    page_id: recordId,
    properties: {
      "Hora salida": { rich_text: [{ text: { content: horaSalida } }] },
      "Horas trabajadas": { number: horasTrabajadas },
      "Horas extra": { number: horasExtra },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;

  return mapAttendance(updated);
}

export async function updateAttendanceNotes(
  recordId: string,
  observaciones: string
): Promise<AttendanceRecord> {
  const updated = (await notion.pages.update({
    page_id: recordId,
    properties: {
      Observaciones: { rich_text: [{ text: { content: observaciones } }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })) as PageObjectResponse;
  return mapAttendance(updated);
}
