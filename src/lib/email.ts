import nodemailer from "nodemailer";
import type { AttendanceRecord, Employee } from "./types";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Falta configurar GMAIL_USER y GMAIL_APP_PASSWORD");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function rowsHtml(records: Pick<AttendanceRecord, "fecha" | "horaEntrada" | "horaSalida" | "observaciones">[]) {
  return records
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.fecha}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.horaEntrada} - ${r.horaSalida ?? "—"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.observaciones || "—"}</td>
      </tr>`
    )
    .join("");
}

function wrapHtml(title: string, bodyHtml: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#171717;max-width:560px;margin:0 auto;">
      <div style="padding:16px 0;border-bottom:3px solid #1c02ab;margin-bottom:20px;">
        <span style="font-size:20px;font-weight:700;color:#1c02ab;letter-spacing:-0.02em;">Puntual</span>
      </div>
      <h2 style="margin-bottom:4px;color:#171717;">${title}</h2>
      ${bodyHtml}
      <p style="color:#737373;font-size:12px;margin-top:24px;border-top:1px solid #e5e5e5;padding-top:12px;">
        Este mensaje fue generado automáticamente por Puntual.
      </p>
    </div>`;
}

export async function sendSingleObservationEmail(
  employee: Employee,
  record: AttendanceRecord
): Promise<void> {
  if (!employee.email) throw new Error("El empleado no tiene email cargado");

  const html = wrapHtml(
    `Observación del ${record.fecha}`,
    `
    <p>Hola ${employee.nombre},</p>
    <p>Te compartimos la observación registrada en tu fichaje del día <strong>${record.fecha}</strong>
    (${record.horaEntrada} - ${record.horaSalida ?? "en curso"}):</p>
    <blockquote style="border-left:3px solid #1c02ab;margin:12px 0;padding:8px 14px;background:#fafafa;">
      ${record.observaciones || "(sin observaciones)"}
    </blockquote>`
  );

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: employee.email,
    subject: `Observación de asistencia - ${record.fecha}`,
    html,
  });
}

export async function sendSummaryEmail(
  employee: Employee,
  records: AttendanceRecord[],
  dateFrom: string,
  dateTo: string
): Promise<void> {
  if (!employee.email) throw new Error("El empleado no tiene email cargado");

  const html = wrapHtml(
    `Resumen de asistencia (${dateFrom} a ${dateTo})`,
    `
    <p>Hola ${employee.nombre},</p>
    <p>Este es el resumen de tus fichajes y observaciones entre <strong>${dateFrom}</strong> y <strong>${dateTo}</strong>:</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <thead>
        <tr style="text-align:left;background:#f5f5f5;">
          <th style="padding:6px 10px;">Fecha</th>
          <th style="padding:6px 10px;">Horario</th>
          <th style="padding:6px 10px;">Observaciones</th>
        </tr>
      </thead>
      <tbody>${rowsHtml(records)}</tbody>
    </table>`
  );

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: employee.email,
    subject: `Resumen de asistencia (${dateFrom} a ${dateTo})`,
    html,
  });
}

export interface WeeklySummaryRow {
  nombre: string;
  horasTrabajadas: number;
  horasExtra: number;
  fichajes: number;
  tardanzas: number;
}

export async function sendWeeklyAdminSummary(
  rows: WeeklySummaryRow[],
  weekLabel: string
): Promise<void> {
  const to = process.env.GMAIL_USER;
  if (!to) throw new Error("Falta configurar GMAIL_USER");

  const totalHoras = rows.reduce((acc, r) => acc + r.horasTrabajadas, 0);
  const totalExtra = rows.reduce((acc, r) => acc + r.horasExtra, 0);

  const body = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.nombre}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.fichajes}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.horasTrabajadas.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.horasExtra.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${r.tardanzas}</td>
      </tr>`
    )
    .join("");

  const html = wrapHtml(
    `Resumen de horas — ${weekLabel}`,
    `
    <p>Este es el resumen de horas de tu equipo para <strong>${weekLabel}</strong>:</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <thead>
        <tr style="text-align:left;background:#f5f5f5;">
          <th style="padding:6px 10px;">Empleado</th>
          <th style="padding:6px 10px;">Fichajes</th>
          <th style="padding:6px 10px;">Horas trabajadas</th>
          <th style="padding:6px 10px;">Horas extra</th>
          <th style="padding:6px 10px;">Llegadas tarde</th>
        </tr>
      </thead>
      <tbody>${body || `<tr><td colspan="5" style="padding:10px;color:#737373;">Sin fichajes esta semana.</td></tr>`}</tbody>
      <tfoot>
        <tr style="font-weight:600;">
          <td style="padding:6px 10px;">Total</td>
          <td></td>
          <td style="padding:6px 10px;">${totalHoras.toFixed(2)}</td>
          <td style="padding:6px 10px;">${totalExtra.toFixed(2)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>`
  );

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `Resumen de horas — ${weekLabel}`,
    html,
  });
}
