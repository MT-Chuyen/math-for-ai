import type { ReactNode } from "react";
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
}: {
  f: (x: number) => number;
  xMin: number;
  xMax: number;
  marker?: number;
  tangent?: { x: number; slope: number };
  chord?: { x0: number; x1: number };
  trail?: number[];
  height?: number;
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-lg bg-white" role="img">
      <line x1={pad} y1={Y(0)} x2={width - pad} y2={Y(0)} stroke="#cbd5e1" />
      <polyline fill="none" stroke="#172554" strokeWidth="2.5" points={line} />
      {chordLine ? <line {...chordLine} stroke="#d97706" strokeWidth="2" /> : null}
      {tangentLine ? <line {...tangentLine} stroke="#059669" strokeWidth="2" /> : null}
      {trail.map((x, index) => (
        <circle key={index} cx={X(x)} cy={Y(f(x))} r="3" fill="#93c5fd" />
      ))}
      {marker !== undefined && marker >= xMin && marker <= xMax && Number.isFinite(f(marker)) ? (
        <circle cx={X(marker)} cy={Y(f(marker))} r="5" fill="#1d4ed8" />
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
}: {
  vectors: { x: number; y: number; color: string; label: string }[];
  polygon?: { x: number; y: number }[];
  marker?: { x: number; y: number };
  onPick?: (x: number, y: number) => void;
}) {
  const size = 360;
  const points = [
    ...vectors,
    ...(polygon ?? []),
    ...(marker ? [marker] : []),
    { x: 2.2, y: 2.2 },
    { x: -2.2, y: -2.2 },
  ];
  const max = Math.max(2.4, ...points.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)])) * 1.25;
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

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="aspect-square w-full max-w-md rounded-lg bg-white"
      role="img"
      onClick={(event) => {
        if (!onPick) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * size;
        const y = ((event.clientY - rect.top) / rect.height) * size;
        onPick((x - center) / scale, (center - y) / scale);
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
          <line x1={center} y1={center} x2={px(vector.x)} y2={py(vector.y)} stroke={vector.color} strokeWidth="3" />
          {head(vector.x, vector.y, vector.color)}
          <text x={px(vector.x) + 6} y={py(vector.y) - 6} fill={vector.color} fontSize="13">
            {vector.label}
          </text>
        </g>
      ))}
      {marker ? <circle cx={px(marker.x)} cy={py(marker.y)} r="5" fill="#0f172a" /> : null}
    </svg>
  );
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
}) {
  const cols = 28;
  const rows = 18;
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
  return (
    <div>
      <div
        className="grid overflow-hidden rounded-lg"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, 12px)` }}
      >
        {cells.map((cell, index) => {
          const t = Math.min(1, cell.value / peak);
          const selected = Math.abs(cell.cx - x) < (xMax - xMin) / cols && Math.abs(cell.cy - y) < (yMax - yMin) / rows;
          return (
            <button
              key={index}
              type="button"
              aria-label={`set inputs to ${cell.cx.toFixed(1)}, ${cell.cy.toFixed(1)}`}
              className="h-3 w-full"
              style={{ background: `rgb(${255 - t * 40}, ${255 - t * 170}, ${255 - t * 170})`, outline: selected ? "2px solid #172554" : "none" }}
              onClick={() => onPick(Number(cell.cx.toFixed(2)), Number(cell.cy.toFixed(2)))}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

export function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const peak = Math.max(...values.map((value) => Math.abs(value)), 1e-6);
  return (
    <div className="space-y-1">
      {values.map((value, index) => (
        <div key={labels[index]} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-xs">
          <span>{labels[index]}</span>
          <span className="h-3 rounded bg-slate-100">
            <span className="block h-3 rounded bg-[#1d4ed8]" style={{ width: `${(Math.abs(value) / peak) * 100}%` }} />
          </span>
          <span className="tabular text-right font-mono">{fmt(value, 2)}</span>
        </div>
      ))}
    </div>
  );
}
