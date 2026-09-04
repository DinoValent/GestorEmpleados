import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_COST_PARAMS, estimateCost } from "@/lib/cost";
import { listAttendance, listEmployees, listHolidays } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { AttendanceRecord } from "@/lib/types";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4F46E5" },
};

const TOTAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEEF2FF" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
};

export async function GET(req: NextRequest) {
  const empresaId = await getEmpresaId();
  if (!empresaId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const horasBase = Number(searchParams.get("horasBase")) || DEFAULT_COST_PARAMS.horasBase;
    const multiplicador =
      Number(searchParams.get("multiplicador")) || DEFAULT_COST_PARAMS.multiplicador;
    const multiplicadorFeriado =
      Number(searchParams.get("multiplicadorFeriado")) || DEFAULT_COST_PARAMS.multiplicadorFeriado;
    const pagoPorHora =
      Number(searchParams.get("pagoPorHora")) || DEFAULT_COST_PARAMS.pagoPorHora;

    const [employees, records, holidays] = await Promise.all([
      listEmployees(empresaId),
      listAttendance(empresaId, { dateFrom, dateTo, employeeId }),
      listHolidays(empresaId, dateFrom, dateTo),
    ]);
    const employeeName = new Map(employees.map((e) => [e.id, e.nombre]));
    const employeeSalario = new Map(employees.map((e) => [e.id, e.salarioBase]));
    const holidayDates = new Set(holidays.map((h) => h.fecha));

    type Row = {
      nombre: string;
      horasTrabajadas: number;
      horasExtra: number;
      tardanzas: number;
      minutosTardanza: number;
      registros: AttendanceRecord[];
    };
    const summary = new Map<string, Row>();
    for (const r of records) {
      const row = summary.get(r.employeeId) ?? {
        nombre: employeeName.get(r.employeeId) ?? r.registro,
        horasTrabajadas: 0,
        horasExtra: 0,
        tardanzas: 0,
        minutosTardanza: 0,
        registros: [],
      };
      row.horasTrabajadas += r.horasTrabajadas ?? 0;
      row.horasExtra += r.horasExtra ?? 0;
      if (r.llegadaTarde) {
        row.tardanzas += 1;
        row.minutosTardanza += r.minutosTardanza ?? 0;
      }
      row.registros.push(r);
      summary.set(r.employeeId, row);
    }

    const rows = Array.from(summary.entries())
      .map(([employeeId, row]) => ({
        employeeId,
        ...row,
        costo: estimateCost(employeeSalario.get(employeeId) ?? null, row.registros, holidayDates, {
          horasBase,
          multiplicador,
          multiplicadorFeriado,
          pagoPorHora,
        }),
      }))
      .sort((a, b) => b.horasExtra - a.horasExtra);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Puntual";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Reporte de horas", {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    sheet.mergeCells("A1:F1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `Reporte de horas — ${dateFrom} a ${dateTo}`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
    sheet.getRow(1).height = 26;

    sheet.mergeCells("A2:F2");
    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value =
      holidays.length > 0
        ? `Feriados en el período: ${holidays.map((h) => `${h.fecha} (${h.nombre})`).join(", ")}`
        : "Generado desde Puntual — control de asistencia y horas";
    subtitleCell.font = { italic: true, size: 10, color: { argb: "FF64748B" } };

    const headerRow = sheet.addRow([
      "Empleado",
      "Horas trabajadas",
      "Horas extra",
      "Llegadas tarde",
      "Minutos de tardanza",
      "Costo estimado",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = HEADER_FILL;
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow.height = 20;

    sheet.columns = [
      { width: 26 },
      { width: 18 },
      { width: 14 },
      { width: 16 },
      { width: 20 },
      { width: 18 },
    ];

    let totalHoras = 0;
    let totalExtra = 0;
    let totalCosto = 0;

    for (const r of rows) {
      const row = sheet.addRow([
        r.nombre,
        Number(r.horasTrabajadas.toFixed(2)),
        Number(r.horasExtra.toFixed(2)),
        r.tardanzas,
        r.minutosTardanza,
        r.costo,
      ]);
      row.getCell(2).numFmt = "0.00";
      row.getCell(3).numFmt = "0.00";
      row.getCell(6).numFmt = '"$"#,##0.00;[RED]-"$"#,##0.00';
      if (r.costo === null) row.getCell(6).value = null;
      row.eachCell((cell) => {
        cell.border = THIN_BORDER;
      });
      totalHoras += r.horasTrabajadas;
      totalExtra += r.horasExtra;
      totalCosto += r.costo ?? 0;
    }

    if (rows.length === 0) {
      const emptyRow = sheet.addRow(["No hay fichajes en el período seleccionado."]);
      sheet.mergeCells(`A${emptyRow.number}:F${emptyRow.number}`);
      emptyRow.getCell(1).alignment = { horizontal: "center" };
      emptyRow.getCell(1).font = { italic: true, color: { argb: "FF94A3B8" } };
    } else {
      const totalRow = sheet.addRow([
        "Total",
        Number(totalHoras.toFixed(2)),
        Number(totalExtra.toFixed(2)),
        "",
        "",
        Number(totalCosto.toFixed(2)),
      ]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = TOTAL_FILL;
        cell.border = { top: { style: "medium", color: { argb: "FF4F46E5" } } };
      });
      totalRow.getCell(2).numFmt = "0.00";
      totalRow.getCell(3).numFmt = "0.00";
      totalRow.getCell(6).numFmt = '"$"#,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reporte_${dateFrom}_a_${dateTo}.xlsx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo exportar" }, { status: 500 });
  }
}
