"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocalToggle } from "@/lib/useLocalToggle";
import MiniSwitch from "./MiniSwitch";
import ThemeToggle from "./ThemeToggle";

export default function SettingsMenu({ email }: { email?: string | null }) {
  const [open, setOpen] = useState(false);
  const [tutorial, setTutorial] = useLocalToggle("puntual-tutorial", true);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Configuración"
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
          open ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-pop absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl border shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              Conectado como
            </p>
            <p className="truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {email ?? "—"}
            </p>
          </div>

          <nav className="border-b py-1.5" style={{ borderColor: "var(--border-subtle)" }}>
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              style={{ color: "var(--foreground)" }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Mi perfil
            </Link>
            <Link
              href="/planes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              style={{ color: "var(--foreground)" }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3 .672 3 1.5-1.343 1.5-3 1.5m0-6V6m0 1v6m0 0v1m0-7c1.11 0 2.08.402 2.599 1M9.4 13.5c.519.598 1.488 1 2.6 1"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
              Planes
            </Link>
          </nav>

          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Modo oscuro
            </span>
            <ThemeToggle compact />
          </div>

          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Modo tutorial
              </p>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                Íconos de ayuda en la app
              </p>
            </div>
            <MiniSwitch checked={tutorial} onChange={setTutorial} />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 8H5a2 2 0 01-2-2V6a2 2 0 012-2h8"
              />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
