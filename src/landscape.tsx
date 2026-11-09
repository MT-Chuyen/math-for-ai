import { useMemo, useState } from "react";
import { gdStep } from "./math";
import { useStoryCast } from "./story";
import { LiveCaption, Num, Scalar, StoryStrip, fmt } from "./ui";

/** 2D bowl: L(u,v) = cᵤ(u−u*)² + cᵥ(v−v*)² — same idea as Studio bowl, two knobs. */
function lossAt(u: number, v: number, cu: number, cv: number, uStar: number, vStar: number) {
  return cu * (u - uStar) ** 2 + cv * (v - vStar) ** 2;
}

function gradAt(u: number, v: number, cu: number, cv: number, uStar: number, vStar: number) {
  return { du: 2 * cu * (u - uStar), dv: 2 * cv * (v - vStar) };
}

export function LandscapeJourney({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast } = useStoryCast();
  const [u, setU] = useState(() => cast.weight);
  const [v, setV] = useState(1.2);
  const [trail, setTrail] = useState<{ u: number; v: number }[]>([{ u: cast.weight, v: 1.2 }]);
  const cu = 1;
  const cv = 0.35 + cast.eta; // mild link: η-ish curvature contrast
  const uStar = 3;
  const vStar = 0.5;
  const L = lossAt(u, v, cu, cv, uStar, vStar);
  const g = gradAt(u, v, cu, cv, uStar, vStar);

  const width = 560;
  const height = 360;
  const pad = 28;
  const uMin = -1;
  const uMax = 7;
  const vMin = -2;
  const vMax = 4;
  const X = (uu: number) => pad + ((uu - uMin) / (uMax - uMin)) * (width - pad * 2);
  const Y = (vv: number) => height - pad - ((vv - vMin) / (vMax - vMin)) * (height - pad * 2);

  const contours = useMemo(() => {
    const levels = [0.5, 2, 5, 10, 18, 28];
    return levels.map((level) => {
      // Ellipses: cu(u-u*)² + cv(v-v*)² = level
      const pts: string[] = [];
      for (let t = 0; t <= 64; t += 1) {
        const ang = (t / 64) * Math.PI * 2;
        const ru = Math.sqrt(level / cu);
        const rv = Math.sqrt(level / cv);
        const uu = uStar + ru * Math.cos(ang);
        const vv = vStar + rv * Math.sin(ang);
        pts.push(`${X(uu)},${Y(vv)}`);
      }
      return { level, d: pts.join(" ") };
    });
  }, [cu, cv]);

  function stepOnce() {
    const nextU = u - cast.eta * g.du;
    const nextV = v - cast.eta * g.dv;
    const clampedU = Math.min(uMax, Math.max(uMin, nextU));
    const clampedV = Math.min(vMax, Math.max(vMin, nextV));
    setU(Number(clampedU.toFixed(3)));
    setV(Number(clampedV.toFixed(3)));
    setTrail((t) => [...t.slice(-40), { u: clampedU, v: clampedV }]);
    // Keep Studio bowl weight in sync on the u-axis hike
    patchCast({ weight: Number(gdStep(cast.weight, cast.eta).toFixed(3)) });
  }

  function resetHike() {
    setU(0.2);
    setV(2.4);
    setTrail([{ u: 0.2, v: 2.4 }]);
    patchCast({ weight: 0.2 });
  }

  const trailPts = trail.map((p) => `${X(p.u)},${Y(p.v)}`).join(" ");

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Terrain hike</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Loss Landscape Journey</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Two weights on an elliptic bowl. Contours are level sets of L; the path is gradient descent with the cast η. Steeper axis = larger curvature.
      </p>
      <div className="mt-3">
        <StoryStrip lessonId="descent" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px]" role="img" aria-label="2D loss landscape with gradient path">
          <rect x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} fill="#f8fafc" stroke="#e2e8f0" />
          {contours.map((c) => (
            <polyline key={c.level} points={c.d} fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity={0.85} />
          ))}
          <circle cx={X(uStar)} cy={Y(vStar)} r={5} fill="#059669" />
          <text x={X(uStar) + 8} y={Y(vStar) - 8} style={{ fontSize: 11, fill: "#059669", fontWeight: 700 }}>
            min
          </text>
          {trail.length > 1 ? <polyline points={trailPts} fill="none" stroke="#b45309" strokeWidth="2.5" /> : null}
          {trail.map((p, i) => (
            <circle key={i} cx={X(p.u)} cy={Y(p.v)} r={i === trail.length - 1 ? 0 : 2.5} fill="#fdba74" />
          ))}
          <circle cx={X(u)} cy={Y(v)} r={8} fill="#1d4ed8" />
          {/* gradient arrow */}
          <line x1={X(u)} y1={Y(v)} x2={X(u) - g.du * 0.15} y2={Y(v) - g.dv * 0.15} stroke="#172554" strokeWidth="2" markerEnd="url(#gradArrow)" />
          <defs>
            <marker id="gradArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#172554" />
            </marker>
          </defs>
          <text x={pad} y={height - 8} style={{ fontSize: 11, fill: "#64748b" }}>
            u (weight axis) →
          </text>
          <text x={12} y={pad + 8} style={{ fontSize: 11, fill: "#64748b" }} transform={`rotate(-90 12 ${pad + 40})`}>
            v →
          </text>
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <LiveCaption symbol="L(u,v)" value={L}>
          ∂L/∂u = <Num value={g.du} /> · ∂L/∂v = <Num value={g.dv} />.
        </LiveCaption>
        <div className="space-y-2">
          <Scalar label="η (shared cast)" value={cast.eta} min={0.02} max={0.6} step={0.02} onChange={(eta) => patchCast({ eta })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white" onClick={stepOnce}>
              One hike step
            </button>
            <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={resetHike}>
              Reset trail
            </button>
          </div>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson links</p>
          <ul className="mt-2 space-y-1">
            <li>
              <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen("partials")}>
                Partials — one knob at a time
              </button>
            </li>
            <li>
              <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen("descent")}>
                Descent — the η step
              </button>
            </li>
            <li>
              <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen("curvature")}>
                Curvature — ellipse stretch
              </button>
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Position ({fmt(u)}, {fmt(v)}). Curvatures cᵤ={cu}, cᵥ={fmt(cv)}.
          </p>
        </div>
      </div>
    </main>
  );
}
