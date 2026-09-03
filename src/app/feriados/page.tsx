import FeriadosPanel from "@/components/FeriadosPanel";
import TutorialHint from "@/components/TutorialHint";
import { listHolidays } from "@/lib/notion";
import { getEmpresaId } from "@/lib/session";
import type { HolidayType } from "@/lib/types";

export const revalidate = 30;

const TIPO_STYLE: Record<HolidayType, string> = {
  Nacional: "bg-sky-100 text-sky-800",
  Provincial: "bg-purple-100 text-purple-800",
  Personalizado: "bg-slate-200 text-slate-800",
};

export default async function FeriadosPage() {
  const empresaId = (await getEmpresaId())!;
  const holidays = await listHolidays(empresaId);
  const sorted = [...holidays].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Feriados
          <TutorialHint
            title="Feriados"
            short="Días no laborables y su pago especial."
            long="Los feriados nacionales de Argentina se importan solos en el Calendario, así que normalmente no tenés que hacer nada acá. Esta página sirve para revisar la lista completa, reimportar un año si hace falta, o agregar un día no laborable propio del negocio (un cierre, un feriado provincial). Cualquier día cargado acá se paga con el multiplicador de feriado en Reportes — todas las horas trabajadas ese día, no solo las extra."
          />
        </h1>
        <p className="mt-1 text-slate-500">
          Los días acá cargados se pagan al multiplicador de feriado en Reportes, y se
          marcan en el Calendario.
        </p>
      </div>

      <FeriadosPanel />

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nombre</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  Todavía no hay feriados cargados.
                </td>
              </tr>
            )}
            {sorted.map((h) => (
              <tr key={h.id}>
                <td className="font-mono tabular-nums">{h.fecha}</td>
                <td className="font-medium">{h.nombre}</td>
                <td>
                  <span className={`badge ${TIPO_STYLE[h.tipo]}`}>{h.tipo}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
