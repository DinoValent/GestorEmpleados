"use client";

import { useState } from "react";
import { useLocalToggle } from "@/lib/useLocalToggle";

export default function TutorialHint({
  title,
  short,
  long,
}: {
  title: string;
  short: string;
  long: string;
}) {
  const [enabled] = useLocalToggle("puntual-tutorial", true);
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  return (
    <>
      <span className="group relative inline-flex align-middle">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Ayuda: ${title}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600 transition-transform duration-150 hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-300"
        >
          !
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 scale-95 rounded-lg px-3 py-2 text-xs opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-secondary)" }}
        >
          {short}
        </span>
      </span>

      {open && (
        <div
          className="animate-pop fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                {title}
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-secondary)" }}>
              {long}
            </p>
            <button className="btn-primary mt-5 w-full" onClick={() => setOpen(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
