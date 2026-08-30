import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_COST_PARAMS, estimateCost } from "@/lib/cost";
import { toCsv } from "@/lib/csv";
import { listAttendance, listEmployees } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const employeeId = searchParams.get("employeeId") ?? undefined;
    const horasBase = Number(searchParams.get("horasBase")) || DEFAULT_COST_PARAMS.horasBase;
    const multiplicador =
      Number(searchParams.get("multiplicador")) || DEFAULT_COST_PARAMS.multiplicador;

    const [employees, records] = await Promise.all([
      listEmployees(),
      listAttendance({ dateFrom, dateTo, employeeId }),
    ]);
    const employeeName = new Map(employees.map((e) => [e.id, e.nombre]));
    const employeeSalario = new Map(employees.map((e) => [e.id, e.salarioBase]));

    type Row = {
      nombre: string;
      horasTrabajadas: number;
      horasExtra: number;
      tardanzas: number;
      minutosTardanza: number;
    };
    const summary = new Map<string, Row>();
    for (const r of records) {
      const row = summary.get(r.employeeId) ?? {
        nombre: employeeName.get(r.employeeId) ?? r.registro,
        horasTrabajadas: 0,
        horasExtra: 0,
        tardanzas: 0,
        minutosTardanza: 0,
      };
      row.horasTrabajadas += r.horasTrabajadas ?? 0;
      row.horasExtra += r.horasExtra ?? 0;
      if (r.llegadaTarde) {
        row.tardanzas += 1;
        row.minutosTardanza += r.minutosTardanza ?? 0;
      }
      summary.set(r.employeeId, row);
    }

    const rows = Array.from(summary.entries())
      .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))
      .map(([employeeId, row]) => {
        const costo = estimateCost(
          employeeSalario.get(employeeId) ?? null,
          row.horasTrabajadas,
          row.horasExtra,
          { horasBase, multiplicador }
        );
        return [
          row.nombre,
          row.horasTrabajadas.toFixed(2),
          row.horasExtra.toFixed(2),
          row.tardanzas,
          row.minutosTardanza,
          costo === null ? "" : costo.toFixed(2),
        ];
      });

    const csv = toCsv(
      [
        "Empleado",
        "Horas trabajadas",
        "Horas extra",
        "Llegadas tarde",
        "Minutos de tardanza",
        "Costo estimado",
      ],
      rows
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte_${dateFrom}_a_${dateTo}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo exportar" }, { status: 500 });
  }
}
