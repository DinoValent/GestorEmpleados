import Link from "next/link";
import ContactLinks from "@/components/ContactLinks";
import { getEmpresaId } from "@/lib/session";
import { listPlanesPublicos } from "@/lib/notion";

export default async function PlanesPage() {
  const [empresaId, PLANES] = await Promise.all([getEmpresaId(), listPlanesPublicos()]);

  return (
    <div className="space-y-8">
      {!empresaId && (
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          ← Volver al inicio
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Planes</h1>
        <p className="mt-1 text-slate-500">
          Elegí el paquete que mejor se adapte al tamaño de tu equipo.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Precios sugeridos — a confirmar según el cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANES.map((p) => (
          <div
            key={p.id}
            className={`card border-2 ${p.destacado ? "border-indigo-400 shadow-md" : "border-[var(--foreground)]"}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {p.destacado && (
                <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  Más elegido
                </span>
              )}
              {p.precioOriginal && (
                <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  Descuento promocional
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold">{p.nombre}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Hasta {p.maxEmpleados} empleados · {p.maxAdmins} administrador{p.maxAdmins === 1 ? "" : "es"}
            </p>
            <p className="mt-4 flex flex-wrap items-baseline gap-2">
              {p.precioOriginal && (
                <span className="text-lg text-slate-400 line-through">{p.precioOriginal}</span>
              )}
              <span className="text-3xl font-semibold">{p.precio}</span>
              <span className="text-sm font-normal text-slate-400">/mes</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {p.detalle.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="card mx-auto flex max-w-2xl flex-col items-start gap-3 text-left sm:flex-row sm:items-center"
        style={{ borderStyle: "dashed", borderColor: "var(--accent)" }}
      >
        <span className="badge shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          Próximamente
        </span>
        <p className="text-sm text-slate-500">
          Estamos construyendo <strong className="text-slate-700 dark:text-slate-200">Puntual Stock</strong>,
          una nueva app para controlar el inventario de tu negocio — y no es lo único que viene.
          Si necesitás algo específico, contanos y lo construimos.
        </p>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">¿Tenés dudas o querés una demo?</h2>
        <p className="mt-1 text-sm text-slate-500">Escribinos y te ayudamos a elegir el plan justo para tu equipo.</p>
        <ContactLinks className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm" />
      </div>

      {!empresaId && (
        <div className="text-center">
          <p className="text-sm text-slate-500">¿Ya sos cliente?</p>
          <Link href="/login" className="btn-primary mt-2 inline-flex px-6">
            Iniciar sesión
          </Link>
        </div>
      )}
    </div>
  );
}
