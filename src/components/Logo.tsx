interface LogoProps {
  /** Fuerza la versión clara (texto e ícono blancos) sin importar el modo del sitio —
   * para usar sobre el fondo oscuro fijo del login y del hero del inicio. */
  invert?: boolean;
  /** Tamaño del texto — el ícono escala junto con la tipografía (unidades em). */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl sm:text-5xl",
};

export default function Logo({ invert, size = "md", className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-[0.3em] font-bold tracking-tight ${SIZES[size]} ${invert ? "logo-invert" : ""} ${className}`}
      style={{ color: "var(--logo-fg)" }}
    >
      Puntual
      <svg viewBox="0 0 40 22" className="h-[0.5em] w-[0.9em]" aria-hidden>
        <rect width="40" height="22" rx="11" fill="var(--logo-fg)" />
        <circle cx="29" cy="11" r="8" fill="var(--logo-dot)" />
      </svg>
    </span>
  );
}
