"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/empleados", label: "Empleados" },
  { href: "/asistencia", label: "Asistencia" },
  { href: "/quincena", label: "Quincena" },
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

  if (pathname === "/login") return null;

  const isAdmin = session?.user?.rol === "Admin";

  return (
    <header className="relative border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href={isAdmin ? "/" : "/mi-fichaje"}
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Puntual
        </Link>

        {status === "authenticated" && (
          <>
            {/* Desktop */}
            <div className="hidden items-center gap-4 lg:flex">
              {isAdmin && (
                <nav className="flex flex-nowrap gap-0.5 text-sm font-medium">
                  {NAV_LINKS.map((link) => {
                    const active =
                      link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={
                          active
                            ? "whitespace-nowrap rounded-md bg-indigo-50 px-2.5 py-1.5 text-indigo-700"
                            : "whitespace-nowrap rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <span className="hidden text-sm text-slate-500 xl:inline">
                  {session?.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  Salir
                </button>
              </div>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
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
          </>
        )}
      </div>

      {/* Mobile panel */}
      {status === "authenticated" && open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
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
                        ? "rounded-md bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700"
                        : "rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-3 pt-3">
            <span className="truncate text-sm text-slate-500">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
