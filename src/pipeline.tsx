import { useMemo, useState } from "react";
import { storyDerived, useStoryCast } from "./story";
import { LiveCaption, LossPassport, Num, StepControls, StoryStrip, fmt } from "./ui";

type Phase = "forward" | "backward";

type NodeDef = {
  id: string;
  label: string;
  symbol: string;
  value: (net: ReturnType<typeof storyDerived>["net"], castX0: number) => number;
  lesson: string;
  phase: Phase;
  x: number;
  y: number;
  why: string;
};

const NODES: NodeDef[] = [
  { id: "x", label: "input", symbol: "x", value: (_n, x0) => x0, lesson: "vectors", phase: "forward", x: 40, y: 110, why: "Feature from the shared cast." },
  { id: "z", label: "pre-act", symbol: "z = w₁x", value: (n) => n.z, lesson: "linear-layer", phase: "forward", x: 160, y: 110, why: "First weight scales the input." },
  { id: "h", label: "ReLU", symbol: "h = max(0,z)", value: (n) => n.hidden, lesson: "chain", phase: "forward", x: 300, y: 110, why: "Gate opens when z > 0." },
  { id: "y", label: "pred", symbol: "ŷ = w₂h", value: (n) => n.prediction, lesson: "linear-layer", phase: "forward", x: 440, y: 110, why: "Second weight scales the hidden." },
  { id: "L", label: "loss", symbol: "L = (ŷ−t)²", value: (n) => n.loss, lesson: "function", phase: "forward", x: 580, y: 110, why: "Squared error vs target." },
  { id: "dLdy", label: "∂L/∂ŷ", symbol: "2(ŷ−t)", value: (n) => n.dLossDprediction, lesson: "derivative", phase: "backward", x: 580, y: 250, why: "Upstream from the loss." },
  { id: "dLdw2", label: "∂L/∂w₂", symbol: "…·h", value: (n) => n.dLossDw2, lesson: "partials", phase: "backward", x: 440, y: 250, why: "Blame on w₂." },
  { id: "dLdh", label: "∂L/∂h", symbol: "…·w₂", value: (n) => n.dLossDhidden, lesson: "chain", phase: "backward", x: 300, y: 250, why: "Blame through w₂." },
  { id: "dLdz", label: "∂L/∂z", symbol: "…·gate", value: (n) => n.dLossDz, lesson: "chain", phase: "backward", x: 160, y: 250, why: "ReLU gate kills or passes." },
  { id: "dLdw1", label: "∂L/∂w₁", symbol: "…·x", value: (n) => n.dLossDw1, lesson: "jacobian", phase: "backward", x: 40, y: 250, why: "Blame on w₁." },
];

const FWD_EDGES: [string, string][] = [
  ["x", "z"],
  ["z", "h"],
  ["h", "y"],
  ["y", "L"],
];
const BWD_EDGES: [string, string][] = [
  ["L", "dLdy"],
  ["dLdy", "dLdw2"],
  ["dLdy", "dLdh"],
  ["dLdh", "dLdz"],
  ["dLdz", "dLdw1"],
];

export function PipelineWalk({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast } = useStoryCast();
  const derived = storyDerived(cast);
  const net = derived.net;
  const [step, setStep] = useState(0);
  const total = NODES.length;
  const active = NODES[Math.min(step, total - 1)];
  const revealed = useMemo(() => new Set(NODES.slice(0, step + 1).map((n) => n.id)), [step]);

  const nodePos = useMemo(() => {
    const map = new Map<string, NodeDef>();
    for (const n of NODES) map.set(n.id, n);
    return map;
  }, []);

  function edgePath(from: string, to: string) {
    const a = nodePos.get(from)!;
    const b = nodePos.get(to)!;
    return `M ${a.x + 48} ${a.y + 28} L ${b.x + 48} ${b.y + 28}`;
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Pipeline theater</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Forward / Backward Walk</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        One tiny net on the shared cast: walk numbers forward to the loss, then walk blame backward to the weights. Tap any lit node to open its lesson.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="chain" />
        <LossPassport cast={cast} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StepControls
          step={step}
          total={total}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(total - 1, s + 1))}
          label={active.phase === "forward" ? "forward" : "backward"}
        />
        <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={() => setStep(0)}>
          Restart
        </button>
        <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={() => setStep(4)}>
          Jump to loss
        </button>
        <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={() => setStep(total - 1)}>
          Jump to ∂L/∂w₁
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
        <svg viewBox="0 0 680 340" className="min-w-[640px] w-full" role="img" aria-label="Tiny-net forward and backward flowchart">
          <text x="40" y="28" className="fill-slate-400" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }}>
            FORWARD
          </text>
          <text x="40" y="220" className="fill-amber-700" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }}>
            BACKWARD
          </text>
          {FWD_EDGES.map(([a, b]) => {
            const lit = revealed.has(a) && revealed.has(b);
            return <path key={`${a}-${b}`} d={edgePath(a, b)} fill="none" stroke={lit ? "#1d4ed8" : "#e2e8f0"} strokeWidth={lit ? 3 : 2} markerEnd={lit ? "url(#arrowBlue)" : undefined} />;
          })}
          {BWD_EDGES.map(([a, b]) => {
            const lit = revealed.has(a) && revealed.has(b);
            return (
              <path
                key={`${a}-${b}`}
                d={edgePath(a, b)}
                fill="none"
                stroke={lit ? "#b45309" : "#f1f5f9"}
                strokeWidth={lit ? 3 : 2}
                strokeDasharray={lit ? undefined : "4 4"}
              />
            );
          })}
          <defs>
            <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" />
            </marker>
          </defs>
          {NODES.map((node) => {
            const open = revealed.has(node.id);
            const current = active.id === node.id;
            const val = open ? node.value(net, cast.x[0]) : null;
            const fill = !open ? "#f8fafc" : node.phase === "forward" ? "#eff6ff" : "#fffbeb";
            const stroke = current ? "#172554" : open ? (node.phase === "forward" ? "#1d4ed8" : "#b45309") : "#cbd5e1";
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => onOpen(node.lesson)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(node.lesson);
                  }
                }}
              >
                <rect x={node.x} y={node.y} width={96} height={56} rx={8} fill={fill} stroke={stroke} strokeWidth={current ? 3 : 1.5} />
                <text x={node.x + 48} y={node.y + 18} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}>
                  {node.label}
                </text>
                <text x={node.x + 48} y={node.y + 34} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: "#0f172a" }}>
                  {node.symbol.length > 14 ? node.label : node.symbol}
                </text>
                <text x={node.x + 48} y={node.y + 48} textAnchor="middle" style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", fill: open ? "#172554" : "#94a3b8" }}>
                  {val === null ? "—" : fmt(val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <LiveCaption symbol={active.symbol} value={active.value(net, cast.x[0])}>
          {active.why} Gate = {net.gate ? "1 (open)" : "0 (shut)"}.
        </LiveCaption>
        <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cast knobs</p>
          <p className="mt-1 font-mono text-slate-800">
            x₁=<Num value={cast.x[0]} /> · w₁=<Num value={cast.w1} /> · w₂=<Num value={cast.w2} /> · t=<Num value={cast.target} />
          </p>
          <button type="button" className="mt-2 text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen(active.lesson)}>
            Open lesson: {active.lesson}
          </button>
        </div>
      </div>
    </main>
  );
}
