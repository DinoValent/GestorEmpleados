import Link from "next/link";
import { redirect } from "next/navigation";
import PreferencesCard from "@/components/PreferencesCard";
import SignOutButton from "@/components/SignOutButton";
import { auth } from "@/lib/auth";
import { getCompany, listEmployees, listUsers } from "@/lib/notion";

export const dynamic = "force-dynamic";

function initialsOf(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [empresa, employees, users] = await Promise.all([
    getCompany(session.user.empresaId),
    listEmployees(session.user.empresaId),
    listUsers(session.user.empresaId),
  ]);

  const empleadosActivos = employees.filter((e) => e.estado === "Activo").length;
  const admins = users.filter((u) => u.rol === "Admin").length;
  const initials = initialsOf(session.user.email ?? "?");

  return (
    <div className="animate-page stagger max-w-3xl space-y-6">
      {/* Header */}
      <div className="card flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{session.user.email}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={session.user.rol === "Admin" ? "badge-red" : "badge-gray"}>
              {session.user.rol}
            </span>
            <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              {empresa.nombre}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Link href="/empleados" className="card stat-tile p-4 hover:border-slate-300 sm:p-6">
          <span className="stat-tile-icon">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-2.13a4 4 0 100-8 4 4 0 000 8zm6-1a4 4 0 10-1.32-7.78"
              />
            </svg>
          </span>
          <p className="text-xs text-slate-500 sm:text-sm">Empleados activos</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: "var(--accent)" }}>
            {empleadosActivos}
          </p>
        </Link>
        <Link href="/usuarios" className="card stat-tile p-4 hover:border-slate-300 sm:p-6">
          <span className="stat-tile-icon">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15c-3.314 0-6 1.79-6 4v1h12v-1c0-2.21-2.686-4-6-4zm0-2a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
              />
            </svg>
          </span>
          <p className="text-xs text-slate-500 sm:text-sm">Administradores</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: "var(--accent)" }}>
            {admins}
          </p>
        </Link>
        <div className="card stat-tile p-4 sm:p-6">
          <span className="stat-tile-icon">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
          </span>
          <p className="text-xs text-slate-500 sm:text-sm">Tu empresa</p>
          <p className="mt-1 truncate text-2xl font-semibold sm:text-3xl">{empresa.nombre}</p>
        </div>
      </div>

      {/* Datos de la cuenta */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Datos de la cuenta</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="label">Email</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          <div>
            <p className="label">Rol</p>
            <span className={session.user.rol === "Admin" ? "badge-red" : "badge-gray"}>
              {session.user.rol}
            </span>
          </div>
          <div>
            <p className="label">Empresa</p>
            <p className="font-medium">{empresa.nombre}</p>
          </div>
          <div>
            <p className="label">Estado de la empresa</p>
            <span className={empresa.estado === "Activo" ? "badge-green" : "badge-gray"}>
              {empresa.estado}
            </span>
          </div>
        </div>
      </div>

      <PreferencesCard />

      {/* Seguridad */}
      <div className="card">
        <h2 className="flex items-center gap-2 font-semibold">
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Contraseña
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Por ahora, para cambiar tu contraseña volvé a cargar tu email en Usuarios con la
          contraseña nueva.
        </p>
        <Link href="/usuarios" className="btn-secondary mt-3">
          Ir a Usuarios
        </Link>
      </div>

      <div className="flex justify-end">
        <SignOutButton className="btn-danger" />
      </div>
    </div>
  );
}
