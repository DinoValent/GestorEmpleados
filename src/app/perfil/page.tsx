import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompany } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const empresa = await getCompany(session.user.empresaId);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-1 text-slate-500">Información de tu cuenta en Puntual.</p>
      </div>

      <div className="card space-y-4">
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
      </div>

      <div className="card">
        <h2 className="font-semibold">Contraseña</h2>
        <p className="mt-1 text-sm text-slate-500">
          Por ahora, para cambiar tu contraseña volvé a cargar tu email en Usuarios con la
          contraseña nueva.
        </p>
        <Link href="/usuarios" className="btn-secondary mt-3">
          Ir a Usuarios
        </Link>
      </div>
    </div>
  );
}
