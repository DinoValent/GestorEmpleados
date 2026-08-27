"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/empleados", label: "Empleados" },
  { href: "/asistencia", label: "Asistencia" },
  { href: "/quincena", label: "Quincena" },
  { href: "/calendario", label: "Calendario" },
  { href: "/reportes", label: "Reportes" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Control de Empleados
        </Link>
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
      </div>
    </header>
  );
}
