"use client";

import { useState } from "react";

export interface HoursBar {
  key: string;
  label: string;
  regular: number;
  extra: number;
}

const COLOR_REGULAR = "#2a78d6";
const COLOR_EXTRA = "#eb6834";

const CHART_HEIGHT = 220;
const SLOT_WIDTH = 56;
const BAR_WIDTH = 24;
const PADDING_LEFT = 40;
const PADDING_BOTTOM = 28;
const PADDING_TOP = 12;

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const steps = [1, 2, 4, 5, 10, 20, 25, 50, 100];
  for (const step of steps) {
    const candidate = Math.ceil(value / step) * step;
    if (candidate / step <= 5) return candidate;
  }
  return Math.ceil(value / 50) * 50;
}

export default function StackedHoursChart({
  data,
  emptyLabel = "No hay fichajes en este período.",
}: {
  data: HoursBar[];
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const maxTotal = Math.max(0, ...data.map((d) => d.regular + d.extra));
  const top = niceMax(maxTotal);
  const ticks = [0, top * 0.25, top * 0.5, top * 0.75, top];
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const chartWidth = PADDING_LEFT + Math.max(data.length, 1) * SLOT_WIDTH + 16;

  if (data.length === 0 || maxTotal === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_REGULAR }} />
          Horas regulares
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_EXTRA }} />
          Horas extra
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          width={chartWidth}
          height={CHART_HEIGHT}
          role="img"
          aria-label="Gráfico de horas trabajadas y horas extra"
        >
          {ticks.map((t, i) => {
            const y = PADDING_TOP + plotHeight - (t / top) * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={PADDING_LEFT}
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                  className="stroke-slate-200"
                  strokeWidth={1}
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-slate-400 font-mono"
                  fontSize={10}
                >
                  {t.toFixed(t < 10 ? 1 : 0)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const slotX = PADDING_LEFT + i * SLOT_WIDTH;
            const barX = slotX + (SLOT_WIDTH - BAR_WIDTH) / 2;
            const regularH = (d.regular / top) * plotHeight;
            const extraH = (d.extra / top) * plotHeight;
            const gap = d.extra > 0 && d.regular > 0 ? 2 : 0;
            const baseY = PADDING_TOP + plotHeight;
            const regularY = baseY - regularH;
            const extraY = regularY - gap - extraH;
            const isHover = hover === i;

            return (
              <g
                key={d.key}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={slotX}
                  y={PADDING_TOP}
                  width={SLOT_WIDTH}
                  height={plotHeight}
                  fill="transparent"
                />
                {d.regular > 0 && (
                  <rect
                    x={barX}
                    y={regularY}
                    width={BAR_WIDTH}
                    height={Math.max(regularH, 1)}
                    rx={d.extra > 0 ? 0 : 4}
                    fill={COLOR_REGULAR}
                    opacity={isHover ? 1 : 0.92}
                  />
                )}
                {d.extra > 0 && (
                  <rect
                    x={barX}
                    y={extraY}
                    width={BAR_WIDTH}
                    height={Math.max(extraH, 3)}
                    rx={4}
                    fill={COLOR_EXTRA}
                    opacity={isHover ? 1 : 0.92}
                  />
                )}
                <text
                  x={slotX + SLOT_WIDTH / 2}
                  y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                  textAnchor="middle"
                  className={isHover ? "fill-slate-900 font-medium" : "fill-slate-500"}
                  fontSize={11}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-slate-800">{hovered.label}</p>
            <p className="text-slate-600">
              Regulares: <span className="font-mono">{hovered.regular.toFixed(2)}</span> hs
            </p>
            <p className="text-slate-600">
              Extra: <span className="font-mono">{hovered.extra.toFixed(2)}</span> hs
            </p>
            <p className="font-medium text-slate-800">
              Total: <span className="font-mono">{(hovered.regular + hovered.extra).toFixed(2)}</span> hs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
