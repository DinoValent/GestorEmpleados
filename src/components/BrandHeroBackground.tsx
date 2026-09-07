const ARCS = Array.from({ length: 24 }, (_, i) => 300 + i * 42);

export default function BrandHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="brand-base" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1c02ab" />
            <stop offset="52%" stopColor="#0a0148" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <radialGradient id="brand-spot" cx="30%" cy="62%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#1c02ab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="brand-vignette" cx="78%" cy="8%" r="45%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#brand-base)" />
        <rect width="1600" height="900" fill="url(#brand-spot)" />
        <rect width="1600" height="900" fill="url(#brand-vignette)" />
        <g stroke="#ffffff" strokeOpacity="0.16" fill="none" strokeWidth="1.5">
          {ARCS.map((r) => (
            <circle key={r} cx="1720" cy="-140" r={r} />
          ))}
        </g>
      </svg>
    </div>
  );
}
