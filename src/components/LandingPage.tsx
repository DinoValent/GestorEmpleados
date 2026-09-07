import Link from "next/link";
import Logo from "./Logo";
import BrandHeroBackground from "./BrandHeroBackground";

const FEATURES = [
  {
    title: "Fichaje con ubicación",
    text: "Tus empleados fichan entrada y salida desde el celular, con verificación de ubicación para que el registro sea confiable.",
  },
  {
    title: "Horas y llegadas tarde, solas",
    text: "Horas trabajadas, horas extra y llegadas tarde se calculan automáticamente — sin planillas ni Excel.",
  },
  {
    title: "Turnos rotativos",
    text: "Se adapta a cualquier modalidad de horario: turnos fijos, rotativos, o una combinación de varios por semana.",
  },
  {
    title: "Feriados argentinos, solos",
    text: "Los feriados nacionales se cargan automáticamente en el calendario, con su recargo correspondiente ya calculado.",
  },
  {
    title: "Reportes y resumen de pagos",
    text: "Todo lo que necesitás para el momento de liquidar sueldos, con estimación de costo y exportación a CSV.",
  },
  {
    title: "Varios administradores",
    text: "Cada negocio tiene su propio espacio aislado, con los accesos que necesite para su equipo.",
  },
];

export default function LandingPage() {
  return (
    <div className="animate-page space-y-20">
      {/* Hero */}
      <section className="relative -mx-4 -mt-6 overflow-hidden px-4 py-20 text-center sm:-mx-6 sm:-mt-8 sm:px-6 sm:py-28">
        <BrandHeroBackground />
        <div className="relative">
          <div className="mx-auto flex justify-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            <Logo invert size="lg" />
          </div>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Control de asistencia y horas para tu equipo, sin planillas ni dolores de cabeza.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-base font-medium text-[#1c02ab] shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-2.5 text-base font-medium text-white transition-all duration-150 hover:border-white/60 hover:bg-white/10"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* Próximamente */}
      <section className="mx-auto max-w-3xl">
        <div
          className="card flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          style={{ borderStyle: "dashed", borderColor: "var(--accent)" }}
        >
          <span className="badge shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            Próximamente
          </span>
          <p className="text-sm" style={{ color: "var(--foreground-secondary)" }}>
            Estamos construyendo{" "}
            <strong style={{ color: "var(--foreground)" }}>Puntual Stock</strong>, una nueva
            app para controlar el inventario de tu negocio — y no es lo único que viene.
            Si necesitás algo específico, contanos y lo construimos.
          </p>
        </div>
      </section>

      {/* Qué es */}
      <section className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          ¿Qué es Puntual?
        </h2>
        <p className="mt-3" style={{ color: "var(--foreground-secondary)" }}>
          Una aplicación web que reemplaza las planillas y el control manual de asistencia.
          Tus empleados fichan desde el celular, y vos tenés en tiempo real las horas
          trabajadas, las horas extra y el costo de cada período — todo listo para liquidar
          sueldos sin hacer cuentas a mano.
        </p>
      </section>

      {/* Features */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: "var(--foreground-secondary)" }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* A medida */}
      <section className="card mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          ¿Necesitás algo distinto?
        </h2>
        <p className="mx-auto mt-3 max-w-xl" style={{ color: "var(--foreground-secondary)" }}>
          Puntual es nuestro producto insignia, pero no es lo único que hacemos. También
          desarrollamos aplicaciones a medida para cualquier tipo de negocio — sea cual sea
          el rubro o el estilo que necesites, podemos construir la herramienta que tu
          negocio necesita, adaptada 100% a tu forma de trabajar.
        </p>
      </section>

      {/* Contacto */}
      <section className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Hablemos
        </h2>
        <p className="mt-3" style={{ color: "var(--foreground-secondary)" }}>
          ¿Tenés dudas, querés una demo, o contarnos qué necesita tu negocio?
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          <a
            href="mailto:puntual.org@gmail.com"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            puntual.org@gmail.com
          </a>
          <a
            href="https://wa.me/5493400446008"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            +54 9 3400 44-6008
          </a>
          <a
            href="https://wa.me/5493364693823"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            +54 9 3364 69-3823
          </a>
          <a
            href="https://instagram.com/puntual.servicio"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            @puntual.servicio
          </a>
        </div>
      </section>

      <footer className="text-center text-xs" style={{ color: "var(--foreground-muted)" }}>
        © {new Date().getFullYear()} Puntual. Todos los derechos reservados.
      </footer>
    </div>
  );
}
