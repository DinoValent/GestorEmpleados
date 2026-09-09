import Link from "next/link";
import { getEmpresaId } from "@/lib/session";

const PLANES = [
  {
    nombre: "Inicial",
    empleados: "Hasta 4 empleados",
    admins: "1 administrador",
    precioOriginal: "$90.000",
    precio: "$50.000",
    destacado: false,
    detalle: [
      "Fichaje con ubicación",
      "Cálculo de horas extra y llegadas tarde",
      "Calendario de asistencia",
      "Feriados argentinos automáticos",
      "Reportes y resumen de pagos",
    ],
  },
  {
    nombre: "Premium",
    empleados: "Hasta 10 empleados",
    admins: "3 administradores",
    precioOriginal: "$130.000",
    precio: "$85.000",
    destacado: true,
    detalle: [
      "Todo lo del plan Inicial",
      "Turnos rotativos",
      "Varios administradores con su propio acceso",
      "Envío de resúmenes por email",
      "Soporte prioritario",
    ],
  },
];

export default async function PlanesPage() {
  const empresaId = await getEmpresaId();

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {PLANES.map((p) => (
          <div
            key={p.nombre}
            className={`card ${p.destacado ? "border-indigo-400 shadow-md" : ""}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {p.destacado && (
                <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  Más elegido
                </span>
              )}
              <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                Descuento promocional
              </span>
            </div>
            <h2 className="text-lg font-semibold">{p.nombre}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {p.empleados} · {p.admins}
            </p>
            <p className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="text-lg text-slate-400 line-through">{p.precioOriginal}</span>
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
