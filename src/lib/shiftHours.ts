/** Horas entre dos horarios "HH:MM", soportando turnos que cruzan la medianoche. */
export function shiftHours(horaEntrada: string, horaSalida: string): number {
  const [eh, em] = horaEntrada.split(":").map(Number);
  const [sh, sm] = horaSalida.split(":").map(Number);
  if ([eh, em, sh, sm].some((n) => Number.isNaN(n))) return 0;
  const start = eh * 60 + em;
  let end = sh * 60 + sm;
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}
