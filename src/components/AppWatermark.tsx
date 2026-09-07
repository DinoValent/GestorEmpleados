/** Marca de agua decorativa: el ícono del logo, gigante y muy tenue, fijo en
 * una esquina detrás del contenido — para que las pantallas internas (tablas,
 * formularios) no se sientan tan lisas/genéricas. */
export default function AppWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -right-28 -bottom-20 -z-10 opacity-[0.05] dark:opacity-[0.09]"
    >
      <svg viewBox="0 0 400 220" className="h-[260px] w-[480px]" style={{ color: "var(--accent)" }}>
        <rect x="0" y="0" width="400" height="220" rx="110" fill="currentColor" />
        <circle cx="295" cy="110" r="78" fill="var(--background)" />
      </svg>
    </div>
  );
}
