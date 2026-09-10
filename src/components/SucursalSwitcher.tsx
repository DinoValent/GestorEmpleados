"use client";

import { useEffect, useRef, useState } from "react";
import type { Sucursal } from "@/lib/types";

function Dot({ color }: { color: string | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: color ?? "var(--foreground-muted)" }}
    />
  );
}

export default function SucursalSwitcher() {
  const [sucursales, setSucursales] = useState<Sucursal[] | null>(null);
  const [switching, setSwitching] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mi-empresa/sucursales")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Sucursal[]) => {
        if (!cancelled) setSucursales(data);
      })
      .catch(() => {
        if (!cancelled) setSucursales([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!sucursales || sucursales.length <= 1) return null;

  async function handleChange(id: string) {
    setOpen(false);
    setSwitching(true);
    try {
      const res = await fetch("/api/mi-empresa/sucursal-activa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId: id }),
      });
      // router.refresh() no siempre vuelve a pintar el dashboard con la sucursal
      // nueva (queda "pegado" hasta recargar a mano) — un reload real garantiza
      // que la próxima carga ya lea la cookie de sucursal activa que acabamos de setear.
      if (res.ok) window.location.reload();
    } finally {
      setSwitching(false);
    }
  }

  const activa = sucursales.find((s) => s.activa) ?? sucursales[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        title="Cambiar de sucursal"
        className={`flex max-w-[13rem] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          open ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50"
        }`}
        style={{ borderColor: "var(--border)" }}
      >
        <Dot color={activa.color} />
        <span className="truncate">{activa.nombre}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-pop absolute left-0 z-50 mt-2 w-64 origin-top-left overflow-hidden rounded-xl border shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="border-b px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
              Sucursales
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {sucursales.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleChange(s.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <Dot color={s.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium" style={{ color: "var(--foreground)" }}>
                    {s.nombre}
                  </span>
                  {s.direccion && (
                    <span className="block truncate text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {s.direccion}
                    </span>
                  )}
                </span>
                {s.activa && (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="var(--accent)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
