import { useMemo } from "react";
import { cosine, dot, norm, softmax } from "./math";
import { useStoryCast } from "./story";
import {
  LiveCaption,
  Num,
  PeakBlendLatchBar,
  PeakBlendStats,
  Scalar,
  StoryStrip,
  fmt,
  usePeakBlendLatch,
} from "./ui";

type KeyActor = {
  id: string;
  label: string;
  vec: [number, number, number];
  x: number;
  y: number;
};

function SpotlightStage({
  keys,
  weights,
  scores,
  q,
  title,
  compact,
}: {
  keys: KeyActor[];
  weights: number[];
  scores: number[];
  q: [number, number, number];
  title: string;
  compact?: boolean;
}) {
  const qPos = { x: compact ? 160 : 320, y: compact ? 150 : 280 };
  const viewW = compact ? 320 : 640;
  const viewH = compact ? 200 : 360;
  const keyLayout = compact
    ? keys.map((k, i) => ({
        ...k,
        x: 60 + i * 100,
        y: i === 1 ? 48 : 110,
      }))
    : keys;

  return (
    <div className="overflow-x-auto rounded-xl bg-[#0f172a] p-3 shadow-sm">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full"
        role="img"
        aria-label={`${title} attention spotlight stage`}
      >
        <rect x="10" y="10" width={viewW - 20} height={viewH - 20} rx="12" fill="#172554" />
        <text
          x="24"
          y="32"
          fill="#93c5fd"
          style={{ fontSize: compact ? 10 : 12, fontWeight: 700, letterSpacing: "0.14em" }}
        >
          {title}
        </text>
        {keyLayout.map((k, i) => {
          const bright = weights[i];
          const beamOpacity = 0.08 + bright * 0.55;
          const keyGlow = 0.25 + bright * 0.75;
          const r = compact ? 12 + bright * 16 : 22 + bright * 28;
          return (
            <g key={k.id}>
              <line
                x1={qPos.x}
                y1={qPos.y}
                x2={k.x}
                y2={k.y}
                stroke="#fbbf24"
                strokeWidth={2 + bright * (compact ? 6 : 10)}
                opacity={beamOpacity}
              />
              <circle cx={k.x} cy={k.y} r={r} fill={`rgba(5,150,105,${keyGlow})`} />
              <circle cx={k.x} cy={k.y} r={compact ? 9 : 14} fill="#ecfdf5" />
              <text
                x={k.x}
                y={k.y + 3}
                textAnchor="middle"
                style={{ fontSize: compact ? 9 : 11, fontWeight: 700, fill: "#065f46" }}
              >
                {fmt(bright, 2)}
              </text>
              <text
                x={k.x}
                y={k.y + (compact ? 30 : 48)}
                textAnchor="middle"
                fill="#cbd5e1"
                style={{ fontSize: compact ? 10 : 12, fontWeight: 600 }}
              >
                {k.label}
              </text>
              {!compact ? (
                <text
                  x={k.x}
                  y={k.y + 64}
                  textAnchor="middle"
                  fill="#94a3b8"
                  style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                >
                  score {fmt(scores[i])}
                </text>
              ) : null}
            </g>
          );
        })}
        <circle cx={qPos.x} cy={qPos.y} r={compact ? 16 : 26} fill="#1d4ed8" />
        <circle cx={qPos.x} cy={qPos.y} r={compact ? 26 : 40} fill="#1d4ed8" opacity={0.2} />
        <text
          x={qPos.x}
          y={qPos.y + 3}
          textAnchor="middle"
          fill="white"
          style={{ fontSize: compact ? 11 : 13, fontWeight: 700 }}
        >
          q
        </text>
        {!compact ? (
          <text x={qPos.x} y={qPos.y + 48} textAnchor="middle" fill="#93c5fd" style={{ fontSize: 11 }}>
            ({fmt(q[0])}, {fmt(q[1])}, {fmt(q[2])})
          </text>
        ) : null}
      </svg>
    </div>
  );
}

/** Three keys on stage; q is the spotlight source. Brightness = softmax(scores). */
export function AttentionSpotlight({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast } = useStoryCast();
  const { latch } = usePeakBlendLatch();
  const d = 3;
  const sqrtD = Math.sqrt(d);
  const compare = latch.compare;
  const scaleBySqrtD = compare ? true : latch.scaleBySqrtD;

  const keys = useMemo<KeyActor[]>(
    () => [
      { id: "k0", label: "k₀ (cast)", vec: cast.k, x: 140, y: 200 },
      {
        id: "k1",
        label: "k₁",
        vec: [cast.k[1], cast.k[2], cast.k[0]],
        x: 320,
        y: 80,
      },
      {
        id: "k2",
        label: "k₂",
        vec: [cast.k[2], cast.k[0], cast.k[1]],
        x: 500,
        y: 200,
      },
    ],
    [cast.k],
  );

  const rawScores = keys.map((k) => dot(cast.x, k.vec));
  const scaledScores = rawScores.map((s) => s / sqrtD);
  const weightsRaw = softmax(rawScores);
  const weightsScaled = softmax(scaledScores);
  const weights = scaleBySqrtD ? weightsScaled : weightsRaw;
  const scores = scaleBySqrtD ? scaledScores : rawScores;

  function nudgeQuery(axis: 0 | 1 | 2, delta: number) {
    const next: [number, number, number] = [...cast.x];
    next[axis] = Math.min(3, Math.max(-3, Number((next[axis] + delta).toFixed(2))));
    patchCast({ x: next });
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Stage metaphor</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Attention Spotlight</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Same Peak↔Blend latch as #scores. Without √d one key eats the beam; with ÷√d brightness spreads. Same cast, no
        re-roll between views.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="dot" />
        <PeakBlendLatchBar onOpen={onOpen} sqrtD={sqrtD} />
      </div>

      {compare ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <SpotlightStage
              keys={keys}
              weights={weightsRaw}
              scores={rawScores}
              q={cast.x}
              title="A · RAW (no √d)"
              compact
            />
            <div className="mt-2">
              <PeakBlendStats label="A · beam eats one key?" scores={rawScores} weights={weightsRaw} tone="raw" />
            </div>
          </div>
          <div>
            <SpotlightStage
              keys={keys}
              weights={weightsScaled}
              scores={scaledScores}
              q={cast.x}
              title="B · ÷√d BLEND"
              compact
            />
            <div className="mt-2">
              <PeakBlendStats label="B · shared beam?" scores={scaledScores} weights={weightsScaled} tone="scaled" />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <SpotlightStage
            keys={keys}
            weights={weights}
            scores={scores}
            q={cast.x}
            title={scaleBySqrtD ? "STAGE · ÷√d" : "STAGE · RAW"}
          />
          <div className="mt-2 max-w-sm">
            <PeakBlendStats
              label={scaleBySqrtD ? "÷√d regime" : "Raw regime"}
              scores={scores}
              weights={weights}
              tone={scaleBySqrtD ? "scaled" : "raw"}
            />
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold">Nudge query</p>
          {([0, 1, 2] as const).map((axis) => (
            <div key={axis} className="flex items-center gap-2">
              <span className="w-8 font-mono text-xs text-slate-500">x{axis + 1}</span>
              <button type="button" className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold" onClick={() => nudgeQuery(axis, -0.2)}>
                −
              </button>
              <span className="tabular font-mono text-sm">
                <Num value={cast.x[axis]} />
              </span>
              <button type="button" className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold" onClick={() => nudgeQuery(axis, 0.2)}>
                +
              </button>
            </div>
          ))}
          <p className="mt-2 text-xs text-slate-500">
            √d regime is latched above — flip A|B or the single ÷√d checkbox; cast stays put.
          </p>
        </div>
        <LiveCaption symbol="q · k₀" value={rawScores[0]}>
          Cosine {fmt(cosine(cast.x, cast.k))}. ‖q‖={fmt(norm(cast.x))} · ‖k₀‖={fmt(norm(cast.k))}. Softmax mass on k₀
          raw={fmt(weightsRaw[0])} · ÷√d={fmt(weightsScaled[0])}.
        </LiveCaption>
        <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson links</p>
          <ul className="mt-2 space-y-1">
            {[
              ["dot", "Dot — match scores"],
              ["norm", "Norm — √d scale"],
              ["multiply", "Multiply — score matrix"],
              ["softmax", "Softmax — brightness"],
              ["scores", "Scores — A|B heat"],
              ["mixer", "Mixer — o collapse"],
            ].map(([id, label]) => (
              <li key={id}>
                <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen(id)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Scalar
              label="Studio score₀ (sync hint)"
              value={cast.scores[0]}
              min={-2}
              max={4}
              step={0.1}
              onChange={(v) => patchCast({ scores: [v, cast.scores[1], cast.scores[2]] })}
              note="Separate cast scores for Studio bars; spotlight uses q·k."
            />
          </div>
        </div>
      </div>
    </main>
  );
}
