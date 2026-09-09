"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import SettingsMenu from "./SettingsMenu";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/empleados", label: "Empleados" },
  { href: "/asistencia", label: "Asistencia" },
  { href: "/resumen-pagos", label: "Resumen/Pagos" },
  { href: "/calendario", label: "Calendario" },
  { href: "/ausencias", label: "Ausencias" },
  { href: "/turnos", label: "Turnos" },
  { href: "/reportes", label: "Reportes" },
  { href: "/usuarios", label: "Usuarios" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Una sesión vieja puede tener email/rol pero no empresaId (token de antes de
  // multi-empresa). El cliente la ve "autenticada" aunque el servidor la trate
  // como inválida — eso deja la navbar mostrando links que no funcionan. Acá la
  // detectamos y forzamos un logout automático para que se pueda reloguear. El
  // SuperAdmin es la única sesión legítima sin empresaId, así que se excluye.
  const staleSession =
    status === "authenticated" &&
    !session?.user?.empresaId &&
    session?.user?.rol !== "SuperAdmin";

  useEffect(() => {
    if (staleSession) signOut({ callbackUrl: "/login" });
  }, [staleSession]);

  if (pathname === "/login" || pathname.startsWith("/superadmin")) return null;

  const authenticated = status === "authenticated" && !staleSession;
  const isAdmin = session?.user?.rol === "Admin";

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface) 85%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link
          href={!authenticated ? "/" : isAdmin ? "/" : "/mi-fichaje"}
          className="transition-opacity hover:opacity-80"
        >
          <Logo size="sm" />
        </Link>

        {!authenticated && (status === "unauthenticated" || staleSession) && (
          <div className="flex items-center gap-4 sm:gap-6">
            {pathname === "/" && (
              <nav className="hidden items-center gap-5 text-sm font-medium sm:flex">
                <a
                  href="#funciones"
                  className="transition-colors"
                  style={{ color: "var(--foreground-secondary)" }}
                >
                  Funciones
                </a>
                <a
                  href="#precios"
                  className="transition-colors"
                  style={{ color: "var(--foreground-secondary)" }}
                >
                  Precios
                </a>
                <a
                  href="#faq"
                  className="transition-colors"
                  style={{ color: "var(--foreground-secondary)" }}
                >
                  FAQ
                </a>
              </nav>
            )}
            <ThemeToggle compact />
            <Link href="/login" className="btn-secondary">
              Iniciar sesión
            </Link>
          </div>
        )}

        {authenticated && (
          <>
            {/* Desktop */}
            <div className="hidden items-center gap-3 lg:flex">
              {isAdmin && (
                <nav className="flex flex-nowrap gap-0.5 text-sm font-medium">
                  {NAV_LINKS.map((link) => {
                    const active =
                      link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`relative whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors duration-150 ${
                          active
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {link.label}
                        {active && (
                          <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              )}
              <div className="ml-1 border-l pl-3" style={{ borderColor: "var(--border)" }}>
                <SettingsMenu email={session?.user?.email} />
              </div>
            </div>

            {/* Mobile toggle */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <SettingsMenu email={session?.user?.email} />
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={open}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
              >
                {open ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile panel */}
      {authenticated && open && (
        <div
          className="animate-page border-t px-4 py-3 lg:hidden"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {isAdmin && (
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      active
                        ? "rounded-md bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                        : "rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
