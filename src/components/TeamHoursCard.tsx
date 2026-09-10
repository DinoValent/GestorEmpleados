"use client";

import { useLocalToggle } from "@/lib/useLocalToggle";
import StackedHoursChart, { type HoursBar } from "./charts/StackedHoursChart";

const STORAGE_KEY = "puntual-show-team-chart";

export default function TeamHoursCard({
  data,
  label,
  totalHoras,
}: {
  data: HoursBar[];
  label: string;
  totalHoras: number;
}) {
  const [visible, setVisible] = useLocalToggle(STORAGE_KEY, true);

  function toggle() {
    setVisible(!visible);
  }

  return (
    <div className="card hidden animate-page lg:block">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
            Horas del equipo esta semana
          </h2>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            {label} · {totalHoras.toFixed(1)} hs en total
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100"
          style={{ color: "var(--foreground-muted)" }}
        >
          {visible ? (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.958 9.958 0 01-1.816 3.19M6.223 6.223A9.953 9.953 0 002.458 12c1.274 4.057 5.064 7 9.542 7a9.99 9.99 0 004.478-1.042"
                />
              </svg>
              Ocultar
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Mostrar gráfico
            </>
          )}
        </button>
      </div>

      {visible && (
        <div className="animate-pop mt-4">
          <StackedHoursChart data={data} emptyLabel="Todavía no hay fichajes esta semana." />
        </div>
      )}
    </div>
  );
}
