import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { fmt } from "./ui";

export function Curve({
  f,
  xMin,
  xMax,
  marker,
  tangent,
  chord,
  trail = [],
  height = 240,
  onScrub,
}: {
  f: (x: number) => number;
  xMin: number;
  xMax: number;
  marker?: number;
  tangent?: { x: number; slope: number };
  chord?: { x0: number; x1: number };
  trail?: number[];
  height?: number;
  onScrub?: (x: number) => void;
}) {
  const width = 640;
  const pad = 28;
  const samples = Array.from({ length: 120 }, (_, index) => xMin + ((xMax - xMin) * index) / 119);
  const ys = samples.map((x) => f(x)).filter((y) => Number.isFinite(y));
  const yMax = Math.max(...ys, 1);
  const yMin = Math.min(...ys, 0);
  const span = yMax - yMin || 1;
  const X = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (width - pad * 2);
  const Y = (y: number) => height - pad - ((y - yMin) / span) * (height - pad * 2);
  const line = samples
    .map((x) => {
      const y = f(x);
      return Number.isFinite(y) ? `${X(x)},${Y(y)}` : "";
    })
    .filter(Boolean)
    .join(" ");

  function segment(x0: number, y0: number, x1: number, y1: number) {
    return { x1: X(x0), y1: Y(y0), x2: X(x1), y2: Y(y1) };
  }

  let tangentLine = null;
  if (tangent && Number.isFinite(f(tangent.x))) {
    const y = f(tangent.x);
    const reach = (xMax - xMin) * 0.18;
    tangentLine = segment(tangent.x - reach, y - tangent.slope * reach, tangent.x + reach, y + tangent.slope * reach);
  }
  let chordLine = null;
  if (chord && chord.x1 !== chord.x0 && Number.isFinite(f(chord.x0)) && Number.isFinite(f(chord.x1))) {
    const y0 = f(chord.x0);
    const y1 = f(chord.x1);
    const slope = (y1 - y0) / (chord.x1 - chord.x0);
    const reach = (xMax - xMin) * 0.22;
    const mid = (chord.x0 + chord.x1) / 2;
    const midY = f(chord.x0) + slope * (mid - chord.x0);
    chordLine = segment(mid - reach, midY - slope * reach, mid + reach, midY + slope * reach);
  }

  function scrub(event: ReactPointerEvent<SVGSVGElement>) {
    if (!onScrub) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const next = xMin + ((px - pad) / (width - pad * 2)) * (xMax - xMin);
    onScrub(Math.min(xMax, Math.max(xMin, next)));
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full rounded-lg bg-white ${onScrub ? "cursor-ew-resize touch-none select-none" : ""}`}
      role="img"
      aria-label={onScrub ? "Curve. Drag left or right to move the marker." : "Curve"}
      onPointerDown={(event) => {
        if (!onScrub) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        scrub(event);
      }}
      onPointerMove={(event) => {
        if (!onScrub || event.buttons !== 1) return;
        scrub(event);
      }}
    >
      <line x1={pad} y1={Y(0)} x2={width - pad} y2={Y(0)} stroke="#cbd5e1" />
      <polyline fill="none" stroke="#172554" strokeWidth="2.5" points={line} />
      {chordLine ? <line {...chordLine} stroke="#d97706" strokeWidth="2" /> : null}
      {tangentLine ? <line {...tangentLine} stroke="#059669" strokeWidth="2" /> : null}
      {trail.map((x, index) => (
        <circle key={index} cx={X(x)} cy={Y(f(x))} r="3" fill="#93c5fd" />
      ))}
      {marker !== undefined && marker >= xMin && marker <= xMax && Number.isFinite(f(marker)) ? (
        <g>
          {onScrub ? <circle cx={X(marker)} cy={Y(f(marker))} r="14" fill="#1d4ed8" opacity="0.12" /> : null}
          <circle cx={X(marker)} cy={Y(f(marker))} r={onScrub ? 8 : 5} fill="#1d4ed8" />
        </g>
      ) : null}
      {onScrub ? (
        <text x={width - pad - 108} y={16} fill="#64748b" fontSize="12">
          drag left / right
        </text>
      ) : null}
      <text x={pad} y={16} fill="#64748b" fontSize="12">
        high {fmt(yMax, 1)}
      </text>
      <text x={width - pad - 70} y={height - 8} fill="#64748b" fontSize="12">
        input {fmt(xMax, 1)}
      </text>
    </svg>
  );
}

export function VectorPlane({
  vectors,
  polygon,
  marker,
  onPick,
  onDrag,
  lock,
}: {
  vectors: { x: number; y: number; color: string; label: string }[];
  polygon?: { x: number; y: number }[];
  marker?: { x: number; y: number };
  onPick?: (x: number, y: number) => void;
  onDrag?: (label: string, x: number, y: number) => void;
  lock?: number;
}) {
  const size = 360;
  const points = [
    ...vectors,
    ...(polygon ?? []),
    ...(marker ? [marker] : []),
    { x: 2.2, y: 2.2 },
    { x: -2.2, y: -2.2 },
  ];
  const max = lock ?? Math.max(2.4, ...points.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)])) * 1.25;
  const center = size / 2;
  const scale = (size * 0.42) / max;
  const px = (x: number) => center + x * scale;
  const py = (y: number) => center - y * scale;

  function head(x: number, y: number, color: string) {
    const tipX = px(x);
    const tipY = py(y);
    const angle = Math.atan2(tipY - center, tipX - center);
    const len = 11;
    const spread = 0.45;
    const ax = tipX - len * Math.cos(angle - spread);
    const ay = tipY - len * Math.sin(angle - spread);
    const bx = tipX - len * Math.cos(angle + spread);
    const by = tipY - len * Math.sin(angle + spread);
    return <polygon points={`${tipX},${tipY} ${ax},${ay} ${bx},${by}`} fill={color} />;
  }

  const held = useRef<string | null>(null);

  function at(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * size;
    const sy = ((event.clientY - rect.top) / rect.height) * size;
    return { sx, sy, x: (sx - center) / scale, y: (center - sy) / scale };
  }

  function move(event: ReactPointerEvent<SVGSVGElement>, starting: boolean) {
    const point = at(event);
    if (starting && onDrag) {
      let best: string | null = null;
      let bestDist = 36;
      for (const vector of vectors) {
        const dist = Math.hypot(px(vector.x) - point.sx, py(vector.y) - point.sy);
        if (dist < bestDist) {
          best = vector.label;
          bestDist = dist;
        }
      }
      held.current = best;
    }
    if (held.current && onDrag) {
      onDrag(held.current, point.x, point.y);
      return;
    }
    onPick?.(point.x, point.y);
  }

  const interactive = Boolean(onPick || onDrag);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`aspect-square w-full max-w-md rounded-lg bg-white ${interactive ? "cursor-grab active:cursor-grabbing touch-none select-none" : ""}`}
      role="img"
      aria-label={onDrag ? "Vector plane. Drag an arrow tip." : onPick ? "Vector plane. Drag to pick a point." : "Vector plane"}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event, true);
      }}
      onPointerMove={(event) => {
        if (!interactive || event.buttons !== 1) return;
        move(event, false);
      }}
      onPointerUp={() => {
        held.current = null;
      }}
      onPointerCancel={() => {
        held.current = null;
      }}
    >
      {[-2, -1, 1, 2].map((tick) => (
        <g key={tick} stroke="#e2e8f0">
          <line x1={px(tick)} y1={20} x2={px(tick)} y2={size - 20} />
          <line x1={20} y1={py(tick)} x2={size - 20} y2={py(tick)} />
        </g>
      ))}
      <line x1={24} y1={center} x2={size - 24} y2={center} stroke="#94a3b8" />
      <line x1={center} y1={24} x2={center} y2={size - 24} stroke="#94a3b8" />
      {polygon && polygon.length > 2 ? (
        <polygon points={polygon.map((point) => `${px(point.x)},${py(point.y)}`).join(" ")} fill="#bfdbfe" opacity="0.7" />
      ) : null}
      {vectors.map((vector) => (
        <g key={vector.label}>
          {onDrag ? <circle cx={px(vector.x)} cy={py(vector.y)} r="14" fill={vector.color} opacity="0.12" /> : null}
          <line x1={center} y1={center} x2={px(vector.x)} y2={py(vector.y)} stroke={vector.color} strokeWidth="3" />
          {head(vector.x, vector.y, vector.color)}
          <text x={px(vector.x) + 6} y={py(vector.y) - 6} fill={vector.color} fontSize="13">
            {vector.label}
          </text>
        </g>
      ))}
      {marker ? <circle cx={px(marker.x)} cy={py(marker.y)} r="5" fill="#0f172a" /> : null}
      {interactive ? (
        <text x={size - 118} y={18} fill="#64748b" fontSize="12">
          {onDrag ? "drag an arrow" : "drag to pick"}
        </text>
      ) : null}
    </svg>
  );
}

/** Warm heat fill used by loss terrain and score-matrix cells. `t` in [0, 1]. */
export function heatRgb(t: number): string {
  const u = Math.min(1, Math.max(0, t));
  return `rgb(${Math.round(255 - u * 40)}, ${Math.round(255 - u * 170)}, ${Math.round(255 - u * 170)})`;
}

/**
 * Map a signed score into the same warm ramp via absolute intensity, with a cool
 * slate tint when the value is negative so QKᵀ heat stays readable.
 */
export function scoreHeatRgb(value: number, peak: number): string {
  const scale = Math.max(peak, 1e-6);
  const intensity = Math.min(1, Math.abs(value) / scale);
  if (value < 0) {
    const u = intensity;
    return `rgb(${Math.round(226 - u * 54)}, ${Math.round(232 - u * 40)}, ${Math.round(240 - u * 20)})`;
  }
  return heatRgb(intensity);
}

export function Heatmap({
  f,
  x,
  y,
  xMin,
  xMax,
  yMin,
  yMax,
  onPick,
  caption,
  gradient,
  showUphill = false,
}: {
  f: (x: number, y: number) => number;
  x: number;
  y: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  onPick: (x: number, y: number) => void;
  caption: ReactNode;
  /** Optional uphill direction in data space; rendered from the current (x, y) marker. */
  gradient?: { dx: number; dy: number };
  /** When true and gradient is set, draw an uphill arrow overlay. */
  showUphill?: boolean;
}) {
  const cols = 28;
  const rows = 18;
  const overlayW = 280;
  const overlayH = rows * 12;
  const cells = [];
  let peak = 1e-6;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = xMin + ((col + 0.5) / cols) * (xMax - xMin);
      const cy = yMax - ((row + 0.5) / rows) * (yMax - yMin);
      const value = f(cx, cy);
      peak = Math.max(peak, value);
      cells.push({ cx, cy, value });
    }
  }

  function pickHeat(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    onPick(Number((xMin + fx * (xMax - xMin)).toFixed(2)), Number((yMax - fy * (yMax - yMin)).toFixed(2)));
  }

  const markerX = ((x - xMin) / (xMax - xMin)) * overlayW;
  const markerY = ((yMax - y) / (yMax - yMin)) * overlayH;

  let arrow = null;
  if (showUphill && gradient) {
    const len = Math.hypot(gradient.dx, gradient.dy);
    if (len > 1e-9) {
      const reach = Math.min(overlayW, overlayH) * 0.22;
      const ux = (gradient.dx / len) * reach;
      // SVG y grows downward; data y grows upward, so flip dy for screen.
      const uy = (-gradient.dy / len) * reach;
      const tipX = markerX + ux;
      const tipY = markerY + uy;
      const angle = Math.atan2(uy, ux);
      const headLen = 10;
      const spread = 0.5;
      const ax = tipX - headLen * Math.cos(angle - spread);
      const ay = tipY - headLen * Math.sin(angle - spread);
      const bx = tipX - headLen * Math.cos(angle + spread);
      const by = tipY - headLen * Math.sin(angle + spread);
      arrow = (
        <g>
          <line x1={markerX} y1={markerY} x2={tipX} y2={tipY} stroke="#172554" strokeWidth="2.5" />
          <polygon points={`${tipX},${tipY} ${ax},${ay} ${bx},${by}`} fill="#172554" />
          <text x={tipX + 6} y={tipY - 4} fill="#172554" fontSize="11">
            uphill
          </text>
        </g>
      );
    }
  }

  return (
    <div>
      <div
        className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-lg"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pickHeat(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          pickHeat(event);
        }}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, 12px)` }}
        >
          {cells.map((cell, index) => {
            const t = Math.min(1, cell.value / peak);
            const selected = Math.abs(cell.cx - x) < (xMax - xMin) / cols && Math.abs(cell.cy - y) < (yMax - yMin) / rows;
            return (
              <span
                key={index}
                className="h-3 w-full"
                style={{ background: heatRgb(t), outline: selected ? "2px solid #172554" : "none" }}
              />
            );
          })}
        </div>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${overlayW} ${overlayH}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <circle cx={markerX} cy={markerY} r="5" fill="#172554" />
          {arrow}
        </svg>
        <span className="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-500">drag to move</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

export function Bars({
  values,
  labels,
  highlightIndex,
  caption,
}: {
  values: number[];
  labels: string[];
  highlightIndex?: number;
  caption?: ReactNode;
}) {
  const peak = Math.max(...values.map((value) => Math.abs(value)), 1e-6);
  return (
    <div className="space-y-1">
      {values.map((value, index) => {
        const hot = highlightIndex === index;
        return (
          <div
            key={labels[index]}
            className={`grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 rounded-md px-1 py-0.5 text-xs transition-colors duration-150 ${hot ? "bg-blue-50 ring-1 ring-[#1d4ed8]/40" : ""}`}
          >
            <span className={hot ? "font-semibold text-[#1d4ed8]" : ""}>{labels[index]}</span>
            <span className="h-3 rounded bg-slate-100">
              <span
                className={`bar-fill block h-3 rounded ${hot ? "bg-[#1d4ed8]" : "bg-[#1d4ed8]/80"}`}
                style={{ width: `${(Math.abs(value) / peak) * 100}%` }}
              />
            </span>
            <span className={`tabular text-right font-mono ${hot ? "font-semibold text-[#1d4ed8]" : ""}`}>{fmt(value, 2)}</span>
          </div>
        );
      })}
      {caption ? <p className="pt-1 text-xs text-slate-500">{caption}</p> : null}
    </div>
  );
}
