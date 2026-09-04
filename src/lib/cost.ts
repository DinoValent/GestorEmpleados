export interface CostParams {
  horasBase: number;
  multiplicador: number;
  multiplicadorFeriado: number;
  /** Si es > 0, se usa directo como valor hora y se ignora sueldo base / horas base. */
  pagoPorHora: number;
}

export const DEFAULT_COST_PARAMS: CostParams = {
  horasBase: 200,
  multiplicador: 1.5,
  multiplicadorFeriado: 2,
  pagoPorHora: 0,
};

interface CostableRecord {
  fecha: string;
  horasTrabajadas: number | null;
  horasExtra: number | null;
}

/**
 * Estima el costo de un empleado en un período, registro por registro, para
 * poder aplicar la regla de feriado (todas las horas de ese día pagadas al
 * multiplicador de feriado) en vez de la regla normal de hora extra.
 *
 * El valor hora sale de "Pago por hora" si se cargó uno (más simple, no
 * depende de la ficha del empleado); si no, se calcula como sueldo base ÷
 * horas base mensuales.
 */
export function estimateCost(
  salarioBase: number | null,
  records: CostableRecord[],
  holidayDates: Set<string>,
  params: CostParams
): number | null {
  let hourlyRate: number;
  if (params.pagoPorHora > 0) {
    hourlyRate = params.pagoPorHora;
  } else if (salarioBase && salarioBase > 0 && params.horasBase > 0) {
    hourlyRate = salarioBase / params.horasBase;
  } else {
    return null;
  }

  let cost = 0;
  for (const r of records) {
    const trabajadas = r.horasTrabajadas ?? 0;
    const extra = r.horasExtra ?? 0;
    if (holidayDates.has(r.fecha)) {
      cost += trabajadas * hourlyRate * params.multiplicadorFeriado;
    } else {
      const normales = Math.max(0, trabajadas - extra);
      cost += normales * hourlyRate + extra * hourlyRate * params.multiplicador;
    }
  }
  return Math.round(cost * 100) / 100;
}
