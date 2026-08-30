export interface CostParams {
  horasBase: number;
  multiplicador: number;
}

export const DEFAULT_COST_PARAMS: CostParams = { horasBase: 200, multiplicador: 1.5 };

export function estimateCost(
  salarioBase: number | null,
  horasTrabajadas: number,
  horasExtra: number,
  params: CostParams
): number | null {
  if (!salarioBase || salarioBase <= 0 || params.horasBase <= 0) return null;
  const hourlyRate = salarioBase / params.horasBase;
  const horasNormales = Math.max(0, horasTrabajadas - horasExtra);
  const cost = horasNormales * hourlyRate + horasExtra * hourlyRate * params.multiplicador;
  return Math.round(cost * 100) / 100;
}
