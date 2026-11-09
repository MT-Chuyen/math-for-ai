import { useMemo, useState } from "react";
import { add, scale, softmax } from "./math";
import {
  attentionScoreRow,
  attentionValuesFromCast,
  useStoryCast,
} from "./story";
import {
  LiveCaption,
  Num,
  PeakBlendLatchBar,
  PeakBlendStats,
  StepControls,
  StoryStrip,
  fmt,
  maxAlpha,
  usePeakBlendLatch,
} from "./ui";

type Triple = [number, number, number];

const PHASES = ["pour", "scale", "stack"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_LABEL: Record<Phase, string> = {
  pour: "Pour value rods",
  scale: "Scale by αᵢ",
  stack: "Stack into o",
};

const ROD_COLORS = ["#1d4ed8", "#b45309", "#059669"] as const;

function asTriple(v: number[]): Triple {
  return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0];
}

function MixerStage({
  title,
  phaseId,
  values,
  alpha,
  scaledParts,
  output,
  dominate,
  peakAbs,
  compact,
}: {
  title: string;
  phaseId: Phase;
  values: Triple[];
  alpha: Triple;
  scaledParts: Triple[];
  output: Triple;
  dominate: number;
  peakAbs: number;
  compact?: boolean;
}) {
  function rodHeight(entry: number, factor = 1) {
    return Math.max(4, (Math.abs(entry) / peakAbs) * (compact ? 70 : 110) * factor);
  }

  const viewW = compact ? 320 : 640;
  const viewH = compact ? 240 : 340;
  const rodGap = compact ? 70 : 130;
  const rodStart = compact ? 55 : 110;
  const outX = compact ? 240 : 480;
  const baseY = compact ? 190 : 260;

  return (
    <div className="overflow-x-auto rounded-xl bg-[#0f172a] p-3 shadow-sm">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full" role="img" aria-label={`${title} value mixer`}>
        <rect x="10" y="10" width={viewW - 20} height={viewH - 20} rx="12" fill="#172554" />
        <text
          x="22"
          y="32"
          fill="#93c5fd"
          style={{ fontSize: compact ? 9 : 12, fontWeight: 700, letterSpacing: "0.12em" }}
        >
          {title} · {PHASE_LABEL[phaseId].toUpperCase()}
        </text>

        {values.map((v, i) => {
          const cx = rodStart + i * rodGap;
          const showScaled = phaseId === "scale" || phaseId === "stack";
          const dimPour = phaseId === "pour" ? 1 : 0.35;
          const alphaFactor = showScaled ? alpha[i] : 1;
          const opacity = phaseId === "stack" ? 0.25 : phaseId === "scale" ? 0.55 + alpha[i] * 0.45 : dimPour;
          const entries = showScaled ? scaledParts[i] : v;
          return (
            <g key={`rod-${i}`} opacity={opacity}>
              {[0, 1, 2].map((axis) => {
                const h = rodHeight(entries[axis], showScaled ? Math.max(0.15, alphaFactor) : 1);
                const x = cx - (compact ? 18 : 28) + axis * (compact ? 14 : 22);
                const y = baseY - h;
                const positive = entries[axis] >= 0;
                return (
                  <g key={axis}>
                    <rect
                      x={x}
                      y={y}
                      width={compact ? 12 : 18}
                      height={h}
                      rx={3}
                      fill={ROD_COLORS[i]}
                      opacity={positive ? 0.95 : 0.55}
                    />
                  </g>
                );
              })}
              <text
                x={cx}
                y={compact ? 52 : 78}
                textAnchor="middle"
                fill="#e2e8f0"
                style={{ fontSize: compact ? 10 : 12, fontWeight: 700 }}
              >
                v{i}
              </text>
              <text
                x={cx}
                y={compact ? 66 : 96}
                textAnchor="middle"
                fill={i === dominate ? "#fbbf24" : "#94a3b8"}
                style={{ fontSize: compact ? 9 : 11, fontFamily: "ui-monospace, monospace" }}
              >
                α{i}={fmt(alpha[i], 3)}
              </text>
            </g>
          );
        })}

        <g opacity={phaseId === "stack" ? 1 : 0.2}>
          <rect
            x={outX}
            y={compact ? 70 : 100}
            width={compact ? 60 : 110}
            height={compact ? 110 : 160}
            rx="10"
            fill="#0f172a"
            stroke="#059669"
            strokeWidth={2}
          />
          <text
            x={outX + (compact ? 30 : 55)}
            y={compact ? 62 : 90}
            textAnchor="middle"
            fill="#6ee7b7"
            style={{ fontSize: compact ? 9 : 12, fontWeight: 700 }}
          >
            o
          </text>
          {[0, 1, 2].map((axis) => {
            const h = rodHeight(output[axis]);
            const x = outX + (compact ? 10 : 20) + axis * (compact ? 16 : 28);
            const y = (compact ? 175 : 250) - h;
            return (
              <g key={`out-${axis}`}>
                <rect x={x} y={y} width={compact ? 12 : 20} height={h} rx={3} fill="#059669" opacity={0.9} />
              </g>
            );
          })}
        </g>

        {phaseId === "pour"
          ? values.map((_, i) => (
              <circle
                key={`drop-${i}`}
                cx={rodStart + i * rodGap}
                cy={compact ? 78 : 118}
                r={compact ? 4 : 6}
                fill={ROD_COLORS[i]}
                opacity={0.85}
              >
                <animate
                  attributeName="cy"
                  values={compact ? "78;92;78" : "118;140;118"}
                  dur={`${1.2 + i * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))
          : null}
      </svg>
    </div>
  );
}

/** Attention’s third act: αᵢ scale value rods, then add → o. */
export function ValueMixer({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast } = useStoryCast();
  const { latch } = usePeakBlendLatch();
  const [phase, setPhase] = useState(0);
  const d = 3;
  const sqrtD = Math.sqrt(d);
  const phaseId = PHASES[phase];
  const compare = latch.compare;
  const scaleBySqrtD = compare ? true : latch.scaleBySqrtD;

  const values = useMemo(() => attentionValuesFromCast(cast.x), [cast.x]);

  const rawScores = useMemo(() => attentionScoreRow(cast, false), [cast]);
  const scaledScores = useMemo(() => attentionScoreRow(cast, true), [cast]);
  const alphaRaw = useMemo(() => asTriple(softmax(rawScores)), [rawScores]);
  const alphaScaled = useMemo(() => asTriple(softmax(scaledScores)), [scaledScores]);
  const alpha = scaleBySqrtD ? alphaScaled : alphaRaw;
  const scores = scaleBySqrtD ? scaledScores : rawScores;

  const scaledPartsRaw = useMemo(
    () => values.map((v, i) => asTriple(scale(v, alphaRaw[i]))),
    [values, alphaRaw],
  );
  const scaledPartsScaled = useMemo(
    () => values.map((v, i) => asTriple(scale(v, alphaScaled[i]))),
    [values, alphaScaled],
  );
  const scaledParts = scaleBySqrtD ? scaledPartsScaled : scaledPartsRaw;

  const outputRaw = useMemo(
    () => asTriple(add(add(scaledPartsRaw[0], scaledPartsRaw[1]), scaledPartsRaw[2])),
    [scaledPartsRaw],
  );
  const outputScaled = useMemo(
    () => asTriple(add(add(scaledPartsScaled[0], scaledPartsScaled[1]), scaledPartsScaled[2])),
    [scaledPartsScaled],
  );
  const output = scaleBySqrtD ? outputScaled : outputRaw;

  const dominateRaw = useMemo(() => {
    let best = 0;
    for (let i = 1; i < 3; i += 1) if (alphaRaw[i] > alphaRaw[best]) best = i;
    return best;
  }, [alphaRaw]);
  const dominateScaled = useMemo(() => {
    let best = 0;
    for (let i = 1; i < 3; i += 1) if (alphaScaled[i] > alphaScaled[best]) best = i;
    return best;
  }, [alphaScaled]);
  const dominate = scaleBySqrtD ? dominateScaled : dominateRaw;

  const peakAbs = useMemo(() => {
    let max = 1e-6;
    for (const v of values) for (const e of v) max = Math.max(max, Math.abs(e));
    for (const e of outputRaw) max = Math.max(max, Math.abs(e));
    for (const e of outputScaled) max = Math.max(max, Math.abs(e));
    return max;
  }, [values, outputRaw, outputScaled]);

  function nudge(which: "x" | "k", axis: 0 | 1 | 2, delta: number) {
    const src = which === "x" ? cast.x : cast.k;
    const next: Triple = [...src];
    next[axis] = Math.min(3, Math.max(-3, Number((next[axis] + delta).toFixed(2))));
    patchCast(which === "x" ? { x: next } : { k: next });
  }

  const collapseHint =
    maxAlpha(alphaRaw) > 0.85
      ? `Raw α peaks at ${fmt(maxAlpha(alphaRaw), 3)} → o≈v${dominateRaw}.`
      : `Raw max(α)=${fmt(maxAlpha(alphaRaw), 3)}.`;

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Value mix</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Value Mixer</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Finish the Peak↔Blend ritual: pour → scale → stack under both regimes. Without √d, o collapses onto one value
        rod; with ÷√d, multiple rods still contribute. Scaling keeps the mix alive.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="combine" />
        <PeakBlendLatchBar onOpen={onOpen} sqrtD={sqrtD} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <StepControls
          step={phase}
          total={PHASES.length}
          onPrev={() => setPhase((p) => Math.max(0, p - 1))}
          onNext={() => setPhase((p) => Math.min(PHASES.length - 1, p + 1))}
          label={PHASE_LABEL[phaseId]}
        />
        <p className="text-xs text-slate-500">{collapseHint} ÷√d max(α)={fmt(maxAlpha(alphaScaled), 3)}.</p>
      </div>

      {compare ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <MixerStage
              title="A · RAW"
              phaseId={phaseId}
              values={values}
              alpha={alphaRaw}
              scaledParts={scaledPartsRaw}
              output={outputRaw}
              dominate={dominateRaw}
              peakAbs={peakAbs}
              compact
            />
            <div className="mt-2">
              <PeakBlendStats label="A · o≈one v?" scores={rawScores} weights={alphaRaw} tone="raw" />
            </div>
          </div>
          <div>
            <MixerStage
              title="B · ÷√d"
              phaseId={phaseId}
              values={values}
              alpha={alphaScaled}
              scaledParts={scaledPartsScaled}
              output={outputScaled}
              dominate={dominateScaled}
              peakAbs={peakAbs}
              compact
            />
            <div className="mt-2">
              <PeakBlendStats label="B · real mix?" scores={scaledScores} weights={alphaScaled} tone="scaled" />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <MixerStage
            title={scaleBySqrtD ? "MIXER · ÷√d" : "MIXER · RAW"}
            phaseId={phaseId}
            values={values}
            alpha={alpha}
            scaledParts={scaledParts}
            output={output}
            dominate={dominate}
            peakAbs={peakAbs}
          />
          <div className="mt-2 max-w-sm">
            <PeakBlendStats
              label={scaleBySqrtD ? "÷√d regime" : "Raw regime"}
              scores={scores}
              weights={alpha}
              tone={scaleBySqrtD ? "scaled" : "raw"}
            />
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Live readout</p>
          <div className="mt-3 space-y-2 font-mono text-sm tabular text-slate-800">
            <p>
              raw scores · ({fmt(rawScores[0])}, {fmt(rawScores[1])}, {fmt(rawScores[2])})
            </p>
            <p className="text-amber-800">
              α raw · ({fmt(alphaRaw[0], 3)}, {fmt(alphaRaw[1], 3)}, {fmt(alphaRaw[2], 3)})
            </p>
            <p className="text-emerald-800">
              α ÷√d · ({fmt(alphaScaled[0], 3)}, {fmt(alphaScaled[1], 3)}, {fmt(alphaScaled[2], 3)})
            </p>
            <p className="font-semibold text-amber-900">
              o raw · ({fmt(outputRaw[0])}, {fmt(outputRaw[1])}, {fmt(outputRaw[2])})
            </p>
            <p className="font-semibold text-emerald-900">
              o ÷√d · ({fmt(outputScaled[0])}, {fmt(outputScaled[1])}, {fmt(outputScaled[2])})
            </p>
          </div>
          <LiveCaption symbol="o" value={output[0]}>
            {compare
              ? `Raw collapses toward v${dominateRaw}; ÷√d keeps a mix (dominant v${dominateScaled}, α=${fmt(alphaScaled[dominateScaled], 3)}).`
              : `Dominant rod is v${dominate} (α=${fmt(alpha[dominate], 3)}). Same α as softmax(attentionScoreRow).`}
          </LiveCaption>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nudge cast</p>
          <p className="mt-1 text-sm text-slate-600">
            Changing x rewrites both value rods and the score row; changing k only reweights α. Latch stays across
            surfaces.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-700">Cast x (query + values)</p>
              {([0, 1, 2] as const).map((axis) => (
                <div key={`x${axis}`} className="mt-1 flex items-center gap-2">
                  <span className="w-7 font-mono text-xs text-slate-500">x{axis + 1}</span>
                  <button
                    type="button"
                    className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm"
                    onClick={() => nudge("x", axis, -0.2)}
                  >
                    −
                  </button>
                  <span className="tabular font-mono text-sm">
                    <Num value={cast.x[axis]} />
                  </span>
                  <button
                    type="button"
                    className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm"
                    onClick={() => nudge("x", axis, 0.2)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-700">Cast k (keys → scores)</p>
              {([0, 1, 2] as const).map((axis) => (
                <div key={`k${axis}`} className="mt-1 flex items-center gap-2">
                  <span className="w-7 font-mono text-xs text-slate-500">k{axis + 1}</span>
                  <button
                    type="button"
                    className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm"
                    onClick={() => nudge("k", axis, -0.2)}
                  >
                    −
                  </button>
                  <span className="tabular font-mono text-sm">
                    <Num value={cast.k[axis]} />
                  </span>
                  <button
                    type="button"
                    className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm"
                    onClick={() => nudge("k", axis, 0.2)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200/80">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson & stage links</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {[
                ["scores", "Score matrix"],
                ["spotlight", "Spotlight"],
                ["softmax", "Softmax — α"],
                ["dot", "Dot — scores"],
                ["norm", "Norm — √d"],
                ["combine", "Combine — scale+add"],
              ].map(([id, label]) => (
                <li key={id}>
                  <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen(id)}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
