import Link from "next/link";
import ContactLinks from "./ContactLinks";
import Reveal from "./Reveal";
import HeroCarousel from "./landing/HeroCarousel";
import FaqAccordion from "./landing/FaqAccordion";
import { listPlanesPublicos } from "@/lib/notion";

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

export default async function LandingPage() {
  const planesPublicos = await listPlanesPublicos();
  const PLANES_TEASER = planesPublicos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioOriginal: p.precioOriginal,
    precio: p.precio,
    resumen: `Hasta ${p.maxEmpleados} empleados · ${p.maxAdmins} administrador${p.maxAdmins === 1 ? "" : "es"}`,
    destacado: p.destacado,
  }));

  return (
    <div className="space-y-24">
      <HeroCarousel />

      {/* Próximamente */}
      <Reveal className="mx-auto max-w-4xl px-4 sm:px-0">
        <div
          className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8"
          style={{ borderStyle: "dashed", borderColor: "var(--accent)" }}
        >
          <span className="badge shrink-0 bg-amber-100 px-3 py-1 text-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            Próximamente
          </span>
          <p className="text-base sm:text-lg" style={{ color: "var(--foreground-secondary)" }}>
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
        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANES_TEASER.map((p, i) => (
            <Reveal key={p.id} delayMs={i * 80}>
              <div className={`card h-full border-2 ${p.destacado ? "border-indigo-400 shadow-md" : "border-[var(--foreground)]"}`}>
                {p.precioOriginal && (
                  <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    Descuento promocional
                  </span>
                )}
                <h3 className="mt-3 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                  {p.nombre}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--foreground-secondary)" }}>
                  {p.resumen}
                </p>
                <p className="mt-4 flex flex-wrap items-baseline gap-2">
                  {p.precioOriginal && (
                    <span className="text-base text-slate-400 line-through">{p.precioOriginal}</span>
                  )}
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
        <ContactLinks className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm" />
      </Reveal>

      <footer className="px-4 text-center text-xs sm:px-0" style={{ color: "var(--foreground-muted)" }}>
        © {new Date().getFullYear()} Puntual. Todos los derechos reservados.
      </footer>
    </div>
  );
}
