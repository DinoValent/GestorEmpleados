import Link from "next/link";
import Reveal from "./Reveal";
import HeroCarousel from "./landing/HeroCarousel";
import FaqAccordion from "./landing/FaqAccordion";

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

const PLANES_TEASER = [
  {
    nombre: "Inicial",
    precioOriginal: "$90.000",
    precio: "$50.000",
    resumen: "Hasta 4 empleados · 1 administrador",
    destacado: false,
  },
  {
    nombre: "Premium",
    precioOriginal: "$130.000",
    precio: "$85.000",
    resumen: "Hasta 10 empleados · 3 administradores",
    destacado: true,
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24">
      <HeroCarousel />

      {/* Próximamente */}
      <Reveal className="mx-auto max-w-3xl px-4 sm:px-0">
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
      </Reveal>

      {/* Qué es */}
      <Reveal className="mx-auto max-w-2xl px-4 text-center sm:px-0">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          ¿Qué es Puntual?
        </h2>
        <p className="mt-3" style={{ color: "var(--foreground-secondary)" }}>
          Una aplicación web que reemplaza las planillas y el control manual de asistencia.
          Tus empleados fichan desde el celular, y vos tenés en tiempo real las horas
          trabajadas, las horas extra y el costo de cada período — todo listo para liquidar
          sueldos sin hacer cuentas a mano.
        </p>
      </Reveal>

      {/* Funciones */}
      <section id="funciones" className="scroll-mt-20 px-4 sm:px-0">
        <Reveal>
          <h2
            className="text-center text-2xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Funciones
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delayMs={i * 60}>
              <div className="card h-full">
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm" style={{ color: "var(--foreground-secondary)" }}>
                  {f.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Precios (teaser, los planes completos viven en /planes) */}
      <section id="precios" className="scroll-mt-20 px-4 sm:px-0">
        <Reveal>
          <h2
            className="text-center text-2xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Precios
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center" style={{ color: "var(--foreground-secondary)" }}>
            Descuento promocional por tiempo limitado.
          </p>
        </Reveal>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {PLANES_TEASER.map((p, i) => (
            <Reveal key={p.nombre} delayMs={i * 80}>
              <div className={`card h-full ${p.destacado ? "border-indigo-400 shadow-md" : ""}`}>
                <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  Descuento promocional
                </span>
                <h3 className="mt-3 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                  {p.nombre}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--foreground-secondary)" }}>
                  {p.resumen}
                </p>
                <p className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-base text-slate-400 line-through">{p.precioOriginal}</span>
                  <span className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                    {p.precio}
                  </span>
                  <span className="text-sm text-slate-400">/mes</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-6 text-center">
          <Link href="/planes" className="btn-primary inline-flex px-6">
            Ver todos los planes
          </Link>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 px-4 sm:px-0">
        <Reveal>
          <h2
            className="text-center text-2xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Preguntas frecuentes
          </h2>
        </Reveal>
        <div className="mt-8">
          <Reveal>
            <FaqAccordion />
          </Reveal>
        </div>
      </section>

      {/* A medida */}
      <Reveal className="px-4 sm:px-0">
        <div className="card mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            ¿Necesitás algo distinto?
          </h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ color: "var(--foreground-secondary)" }}>
            Puntual es nuestro producto insignia, pero no es lo único que hacemos. También
            desarrollamos aplicaciones a medida para cualquier tipo de negocio — sea cual sea
            el rubro o el estilo que necesites, podemos construir la herramienta que tu
            negocio necesita, adaptada 100% a tu forma de trabajar.
          </p>
        </div>
      </Reveal>

      {/* Contacto */}
      <Reveal className="mx-auto max-w-2xl px-4 text-center sm:px-0">
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
      </Reveal>

      <footer className="px-4 text-center text-xs sm:px-0" style={{ color: "var(--foreground-muted)" }}>
        © {new Date().getFullYear()} Puntual. Todos los derechos reservados.
      </footer>
    </div>
  );
}
