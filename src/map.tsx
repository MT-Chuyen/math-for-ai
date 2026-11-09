import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { lessons } from "./curriculum";
import {
  EDGES,
  MAP_VIEWBOX,
  ROUTES,
  STATIONS,
  TRANSFERS,
  type Edge,
  type RouteId,
  type Station,
  routeById,
  stationById,
} from "./mapGraph";
import { chapterTitle } from "./storyChapters";

export type IdeaMapProps = {
  done: Record<string, boolean>;
  /** Last / current lesson id for “you are here”. */
  hereId: string | null;
  onOpen: (id: string) => void;
  /** When true, emphasize cosine ↔ √d ↔ softmax transfer arcs (Iter 7). */
  showTransfers?: boolean;
};

type SegKey = string;

function segKey(from: string, to: string): SegKey {
  return from < to ? `${from}|${to}` : `${to}|${from}`;
}

/** Bundle parallel route strokes so multi-line segments stay readable. */
function strokePath(from: Station, to: Station, lane: number, laneCount: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const spread = 5;
  const offset = laneCount <= 1 ? 0 : (lane - (laneCount - 1) / 2) * spread;
  const x1 = from.x + nx * offset;
  const y1 = from.y + ny * offset;
  const x2 = to.x + nx * offset;
  const y2 = to.y + ny * offset;
  const mx = (x1 + x2) / 2;
  const orth = Math.abs(dx) < 8 || Math.abs(dy) < 8;
  if (orth) return `M ${x1} ${y1} L ${x2} ${y2}`;
  // Orthogonal subway kink
  return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
}

function fieldLabel(id: string): string {
  return lessons.find((l) => l.id === id)?.field ?? id;
}

function transferArc(from: Station, to: Station, bend: number): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function IdeaMap({ done, hereId, onOpen, showTransfers = true }: IdeaMapProps) {
  const [focusRoute, setFocusRoute] = useState<RouteId | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverTransfer, setHoverTransfer] = useState<string | null>(null);
  const [transfersOn, setTransfersOn] = useState(showTransfers);
  const viewportRef = useRef<HTMLDivElement>(null);

  const bundles = useMemo(() => {
    const map = new Map<SegKey, Edge[]>();
    for (const edge of EDGES) {
      const key = segKey(edge.from, edge.to);
      const list = map.get(key) ?? [];
      if (!list.some((e) => e.route === edge.route)) list.push(edge);
      map.set(key, list);
    }
    return map;
  }, []);

  const strokes = useMemo(() => {
    const out: { key: string; d: string; color: string; route: RouteId; muted: boolean }[] = [];
    for (const [, edges] of bundles) {
      edges.forEach((edge, lane) => {
        const a = stationById(edge.from);
        const b = stationById(edge.to);
        if (!a || !b) return;
        const meta = routeById(edge.route);
        const muted = focusRoute !== null && focusRoute !== edge.route;
        out.push({
          key: `${edge.from}-${edge.to}-${edge.route}`,
          d: strokePath(a, b, lane, edges.length),
          color: meta.color,
          route: edge.route,
          muted,
        });
      });
    }
    return out;
  }, [bundles, focusRoute]);

  useEffect(() => {
    if (!hereId || !viewportRef.current) return;
    const station = stationById(hereId);
    if (!station) return;
    const el = viewportRef.current;
    const scaleX = el.clientWidth / MAP_VIEWBOX.width;
    const scaleY = Math.min(1, el.clientHeight / MAP_VIEWBOX.height);
    const scale = Math.min(scaleX, scaleY) || scaleX;
    const targetX = station.x * scale - el.clientWidth / 2;
    const targetY = station.y * scale - el.clientHeight / 2;
    el.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  }, [hereId]);

  const here = hereId ? stationById(hereId) : undefined;
  const hover = hoverId ? stationById(hoverId) : undefined;
  const tip = hover ?? here;
  const transferTip = hoverTransfer ? TRANSFERS.find((t) => t.id === hoverTransfer) : null;

  function onStationKey(e: KeyboardEvent, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(id);
    }
  }

  return (
    <section className="idea-map rounded-xl bg-white p-4 shadow-sm" aria-label="Idea subway map">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#172554]">Idea subway map</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Stations are fields. Colored lines are teaching routes — click a station to open it.
            {here ? (
              <>
                {" "}
                You are here: <span className="font-semibold text-[#172554]">{fieldLabel(here.id)}</span>.
              </>
            ) : null}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {Object.values(done).filter(Boolean).length}/{STATIONS.length} marked
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Routes">
        {ROUTES.map((route) => {
          const active = focusRoute === route.id;
          return (
            <li key={route.id}>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold transition"
                style={{
                  borderColor: active ? route.color : "#e2e8f0",
                  background: active ? `${route.color}14` : "#fff",
                  color: route.color,
                  opacity: focusRoute && !active ? 0.45 : 1,
                }}
                aria-pressed={active}
                onClick={() => setFocusRoute((cur) => (cur === route.id ? null : route.id))}
                title={route.intent}
              >
                <span className="inline-block h-2 w-5 rounded-full" style={{ background: route.color }} />
                {route.name}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold"
            style={{
              borderColor: transfersOn ? "#059669" : "#e2e8f0",
              background: transfersOn ? "#05966914" : "#fff",
              color: "#059669",
            }}
            aria-pressed={transfersOn}
            title="Show cosine ↔ √d ↔ softmax transfer arcs"
            onClick={() => setTransfersOn((v) => !v)}
          >
            <span className="inline-block h-2 w-5 rounded-full border border-dashed border-current" />
            Transfers
          </button>
        </li>
      </ul>

      <div
        ref={viewportRef}
        className="idea-map-viewport mt-3 overflow-auto rounded-lg border border-slate-200 bg-[#f4f7fb]"
        style={{ maxHeight: "min(62vh, 420px)" }}
      >
        <svg
          className="idea-map-svg block max-w-none"
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          width={MAP_VIEWBOX.width}
          height={MAP_VIEWBOX.height}
          role="img"
          aria-label="Transit-style map of algebra and calculus fields"
        >
          <defs>
            <filter id="here-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#1d4ed8" floodOpacity="0.55" />
            </filter>
          </defs>

          <g opacity="0.3" stroke="#cbd5e1" strokeWidth="1">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={40 + i * 100} y1={20} x2={40 + i * 100} y2={500} />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={`h${i}`} x1={20} y1={40 + i * 100} x2={900} y2={40 + i * 100} />
            ))}
          </g>

          <text x="70" y="36" className="idea-map-band" fill="#172554">
            Algebra
          </text>
          <text x="70" y="300" className="idea-map-band" fill="#b45309">
            Calculus
          </text>

          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((s) => (
              <path
                key={s.key}
                d={s.d}
                stroke={s.color}
                strokeWidth={focusRoute === s.route ? 6.5 : 4.5}
                strokeDasharray={s.route === "training" ? "10 6" : undefined}
                opacity={s.muted ? 0.18 : 0.92}
                className="idea-map-line"
              />
            ))}
          </g>

          {transfersOn
            ? TRANSFERS.map((tr, index) => {
                const a = stationById(tr.from);
                const b = stationById(tr.to);
                if (!a || !b) return null;
                const bend = 36 + (index % 3) * 14;
                const d = transferArc(a, b, bend);
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2 - bend * 0.45;
                const hot = hoverTransfer === tr.id;
                const muted = focusRoute !== null && focusRoute !== "attention";
                return (
                  <g
                    key={tr.id}
                    opacity={muted ? 0.2 : 1}
                    className="idea-map-transfer"
                    onMouseEnter={() => setHoverTransfer(tr.id)}
                    onMouseLeave={() => setHoverTransfer(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Transfer ${tr.label}: ${tr.diff}`}
                    onClick={() => onOpen(tr.to)}
                    onKeyDown={(e) => onStationKey(e, tr.to)}
                  >
                    <path
                      d={d}
                      fill="none"
                      stroke={hot ? "#047857" : "#059669"}
                      strokeWidth={hot ? 3.5 : 2.25}
                      strokeDasharray="5 5"
                      opacity={0.95}
                    />
                    <rect x={mx - 28} y={my - 10} width={56} height={18} rx={4} fill={hot ? "#059669" : "#ecfdf5"} stroke="#059669" strokeWidth="1" />
                    <text x={mx} y={my + 3} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: hot ? "#fff" : "#065f46" }}>
                      {tr.label}
                    </text>
                  </g>
                );
              })
            : null}

          {STATIONS.map((station) => {
            const ready = !!done[station.id];
            const isHere = hereId === station.id;
            const isHover = hoverId === station.id;
            const onFocusedRoute =
              focusRoute === null ||
              EDGES.some((e) => e.route === focusRoute && (e.from === station.id || e.to === station.id));
            const fill = ready ? "#059669" : station.part === "calculus" ? "#fff7ed" : "#eff6ff";
            const stroke = isHere ? "#1d4ed8" : station.part === "calculus" ? "#b45309" : "#172554";
            return (
              <g
                key={station.id}
                className="idea-map-station"
                opacity={onFocusedRoute ? 1 : 0.28}
                transform={`translate(${station.x}, ${station.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${fieldLabel(station.id)}${ready ? ", marked ready" : ""}${isHere ? ", you are here" : ""}`}
                onClick={() => onOpen(station.id)}
                onKeyDown={(e) => onStationKey(e, station.id)}
                onMouseEnter={() => setHoverId(station.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(station.id)}
                onBlur={() => setHoverId(null)}
              >
                {isHere ? (
                  <circle
                    r="16"
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth="2"
                    className="idea-map-here-ring"
                    filter="url(#here-glow)"
                  />
                ) : null}
                <circle r={isHover || isHere ? 11 : 9} fill={fill} stroke={stroke} strokeWidth={isHere ? 3 : 2.25} />
                {ready ? <circle r="3.2" fill="#fff" /> : <circle r="2.4" fill={stroke} opacity="0.85" />}
                <text y={isHere ? 28 : 24} textAnchor="middle" className="idea-map-label" fill="#0f172a">
                  {station.label}
                </text>
                {isHere ? (
                  <text y={-22} textAnchor="middle" className="idea-map-here-tag" fill="#1d4ed8">
                    you are here
                  </text>
                ) : null}
                {/* Larger invisible hit target */}
                <circle r="18" fill="transparent" />
              </g>
            );
          })}
        </svg>
      </div>

      {transferTip ? (
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-emerald-800">Transfer · {transferTip.label}</span>
          {" — "}
          {transferTip.diff}
        </p>
      ) : tip ? (
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{fieldLabel(tip.id)}</span>
          {chapterTitle(tip.id) ? (
            <>
              {" · "}
              <span className="text-[#172554]">{chapterTitle(tip.id)}</span>
            </>
          ) : null}
          {" — "}
          {lessons.find((l) => l.id === tip.id)?.title}
          {done[tip.id] ? <span className="ml-2 text-xs font-semibold text-emerald-700">ready</span> : null}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Hover or tap a station. Toggle Transfers for cosine ↔ √d ↔ softmax bridges.</p>
      )}
    </section>
  );
}

/** Re-export graph for Agent 3 / tooling. */
export { mapGraphExport } from "./mapGraph";
