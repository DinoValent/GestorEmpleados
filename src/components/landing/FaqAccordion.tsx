"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Necesito instalar algo para usar Puntual?",
    a: "No. Es una aplicación web: vos y tu equipo entran desde el navegador del celular o la computadora, sin descargar nada.",
  },
  {
    q: "¿Cómo fichan mis empleados?",
    a: "Cada empleado tiene su propio acceso. Al fichar entrada o salida, Puntual verifica la ubicación para que el registro sea confiable.",
  },
  {
    q: "¿Puedo cambiar de plan más adelante?",
    a: "Sí, en cualquier momento. Escribinos y ajustamos tu plan al tamaño real de tu equipo.",
  },
  {
    q: "¿Qué pasa si mi negocio tiene turnos rotativos?",
    a: "Puntual se adapta: turnos fijos, rotativos, o una combinación de varios por semana para cada empleado.",
  },
  {
    q: "¿Los feriados se cargan solos?",
    a: "Sí, los feriados nacionales argentinos se cargan automáticamente en el calendario, con su recargo correspondiente ya calculado.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="card border-2 p-0" style={{ borderColor: "var(--foreground)" }}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium" style={{ color: "var(--foreground)" }}>
                {item.q}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
              >
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {isOpen && (
              <p
                className="animate-page px-5 pb-4 text-sm"
                style={{ color: "var(--foreground-secondary)" }}
              >
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
