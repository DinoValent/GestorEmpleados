"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";

interface Slide {
  eyebrow: string;
  title: string;
  text: string;
  gradient: string;
}

// Contenido 100% provisorio: gradientes de marca en vez de fotos reales.
// Se reemplaza por imágenes del producto/negocio más adelante — la mecánica
// del carrusel (snap, dots, flechas, autoplay) no cambia.
const SLIDES: Slide[] = [
  {
    eyebrow: "Fichaje simple",
    title: "Tu equipo ficha desde el celular",
    text: "Entrada y salida con verificación de ubicación, sin planillas ni relojes biométricos.",
    gradient: "linear-gradient(135deg, #1c02ab 0%, #0a0148 55%, #000000 100%)",
  },
  {
    eyebrow: "Horas al día",
    title: "Horas extra y llegadas tarde, solas",
    text: "Todo se calcula automáticamente apenas se ficha — nada de cuentas a mano a fin de mes.",
    gradient: "linear-gradient(135deg, #000000 0%, #140060 50%, #1c02ab 100%)",
  },
  {
    eyebrow: "Equipo organizado",
    title: "Turnos rotativos sin dolores de cabeza",
    text: "Fijos, rotativos, o una mezcla de varios por semana — Puntual se adapta a tu operación.",
    gradient: "linear-gradient(135deg, #1c02ab 0%, #3d1fd6 45%, #000000 100%)",
  },
  {
    eyebrow: "Al momento de pagar",
    title: "Reportes listos para liquidar sueldos",
    text: "Costo estimado por período, exportación a Excel y feriados argentinos ya cargados.",
    gradient: "linear-gradient(135deg, #0a0148 0%, #1c02ab 60%, #000000 100%)",
  },
];

const AUTOPLAY_MS = 5500;

export default function HeroCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slideEls = Array.from(track.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(slideEls.indexOf(entry.target as HTMLElement));
          }
        }
      },
      { root: track, threshold: 0.6 }
    );
    slideEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Se mueve el track directamente con scrollTo (scroll horizontal propio del
  // carrusel) en vez de scrollIntoView: ese método le pide al navegador "traer
  // el elemento a la vista" recorriendo TODOS los contenedores con scroll en
  // la cadena, incluida la página — y en algunos navegadores eso termina
  // moviendo el scroll vertical entero, aunque se le pida block: "nearest".
  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      goTo((active + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [active, reducedMotion]);

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 w-screen overflow-hidden sm:-mt-8">
      <div
        ref={trackRef}
        className="flex h-[calc(100dvh-4rem)] snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            className="relative flex h-[calc(100dvh-4rem)] w-screen shrink-0 snap-center snap-always items-center justify-center overflow-hidden px-4 sm:px-6"
            style={{ background: slide.gradient }}
          >
            {/* Arcos decorativos, mismo lenguaje visual que BrandHeroBackground */}
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
            >
              {Array.from({ length: 14 }).map((_, arc) => (
                <circle
                  key={arc}
                  cx="1720"
                  cy="-140"
                  r={300 + arc * 42}
                  fill="none"
                  stroke="white"
                  strokeOpacity={0.14}
                />
              ))}
            </svg>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(700px 500px at 30% 65%, rgba(255,255,255,0.14), transparent 60%)",
              }}
            />

            <div className="relative mx-auto max-w-2xl text-center">
              {i === 0 && (
                <div className="mx-auto mb-6 flex justify-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                  <Logo invert size="lg" />
                </div>
              )}
              <span className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-xs font-medium tracking-wide text-white/80 uppercase">
                {slide.eyebrow}
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {slide.title}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{slide.text}</p>

              {i === 0 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-base font-medium text-[#1c02ab] shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
                  >
                    Iniciar sesión
                  </Link>
                  <a
                    href="#precios"
                    className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-2.5 text-base font-medium text-white transition-all duration-150 hover:border-white/60 hover:bg-white/10"
                  >
                    Ver planes
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-2 sm:bottom-8">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Ir a la diapositiva ${i + 1}`}
            onClick={() => goTo(i)}
            className={`pointer-events-auto relative h-2 overflow-hidden rounded-full bg-white/40 transition-all duration-200 hover:bg-white/60 ${
              active === i ? "w-8" : "w-2"
            }`}
          >
            {active === i &&
              (reducedMotion ? (
                <span className="absolute inset-0 rounded-full bg-white" />
              ) : (
                <span
                  key={active}
                  className="animate-dot-progress absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white"
                  style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                />
              ))}
          </button>
        ))}
      </div>

      {/* Flechas */}
      <button
        type="button"
        aria-label="Diapositiva anterior"
        onClick={() => goTo((active - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute top-1/2 left-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 sm:flex"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Siguiente diapositiva"
        onClick={() => goTo((active + 1) % SLIDES.length)}
        className="absolute top-1/2 right-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 sm:flex"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </section>
  );
}
