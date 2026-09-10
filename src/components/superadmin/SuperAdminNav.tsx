"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/superadmin", label: "Empresas" },
  { href: "/superadmin/planes", label: "Planes" },
];

export default function SuperAdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-sm font-medium">
      {LINKS.map((link) => {
        const active =
          link.href === "/superadmin" ? pathname === "/superadmin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-2.5 py-1.5 transition-colors duration-150 ${
              active
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            style={active ? { background: "var(--accent-soft)" } : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
