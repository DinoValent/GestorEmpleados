"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/empleados", label: "Empleados" },
  { href: "/asistencia", label: "Asistencia" },
  { href: "/quincena", label: "Quincena" },
  { href: "/calendario", label: "Calendario" },
  { href: "/ausencias", label: "Ausencias" },
  { href: "/reportes", label: "Reportes" },
  { href: "/usuarios", label: "Usuarios" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login") return null;

  const isAdmin = session?.user?.rol === "Admin";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={isAdmin ? "/" : "/mi-fichaje"}
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Control de Empleados
        </Link>
        {status === "authenticated" && (
          <div className="flex items-center gap-4">
            {isAdmin && (
              <nav className="flex gap-1 text-sm font-medium">
                {NAV_LINKS.map((link) => {
                  const active =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        active
                          ? "rounded-md bg-indigo-50 px-3 py-1.5 text-indigo-700"
                          : "rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <span className="text-sm text-slate-500">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
