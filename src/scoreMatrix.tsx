import { useMemo, useState } from "react";
import { dot, softmax } from "./math";
import { Bars, scoreHeatRgb } from "./plots";
import { useStoryCast } from "./story";
import {
  LiveCaption,
  Num,
  PeakBlendLatchBar,
  PeakBlendStats,
  StoryStrip,
  SumLine,
  fmt,
  maxAlpha,
  top2ScoreGap,
  usePeakBlendLatch,
} from "./ui";

type Triple = [number, number, number];

function cycleLeft(v: Triple): Triple {
  return [v[1], v[2], v[0]];
}

function cycleRight(v: Triple): Triple {
  return [v[2], v[0], v[1]];
}

type NamedVec = { id: string; label: string; vec: Triple };

function ScoreHeatGrid({
  queries,
  keys,
  values,
  raw,
  sel,
  onSelect,
  ariaLabel,
}: {
  queries: NamedVec[];
  keys: NamedVec[];
  values: number[][];
  raw: number[][];
  sel: { row: number; col: number };
  onSelect: (sel: { row: number; col: number }) => void;
  ariaLabel: string;
}) {
  const peak = useMemo(() => {
    let max = 1e-6;
    for (const row of values) for (const v of row) max = Math.max(max, Math.abs(v));
    return max;
  }, [values]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[22rem] border-separate border-spacing-2" role="grid" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th className="w-24 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">q \\ k</th>
            {keys.map((key, j) => (
              <th
                key={key.id}
                className={`px-1 text-center text-xs font-semibold ${sel.col === j ? "text-[#1d4ed8]" : "text-slate-600"}`}
              >
                {key.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {queries.map((query, i) => (
            <tr key={query.id}>
              <th
                scope="row"
                className={`pr-2 text-left text-xs font-semibold ${sel.row === i ? "text-[#1d4ed8]" : "text-slate-600"}`}
              >
                {query.label}
              </th>
              {keys.map((key, j) => {
                const hot = sel.row === i && sel.col === j;
                const value = values[i][j];
                const ring = hot ? "ring-2 ring-[#172554] ring-offset-1" : "ring-1 ring-slate-200";
                return (
                  <td key={key.id} className="p-0">
                    <button
                      type="button"
                      className={`flex h-14 w-full min-w-[4.75rem] flex-col items-center justify-center rounded-lg px-1.5 py-1 transition-shadow ${ring}`}
                      style={{ background: scoreHeatRgb(value, peak) }}
                      aria-pressed={hot}
                      aria-label={`Score row ${i} column ${j}: ${fmt(value)}`}
                      onClick={() => onSelect({ row: i, col: j })}
                    >
                      <span className={`font-mono text-sm tabular ${hot ? "font-bold text-[#172554]" : "text-slate-800"}`}>
                        {fmt(value)}
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-500">raw {fmt(raw[i][j])}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** QKᵀ heat stage: rows = queries from cast x (+perms), cols = keys from cast k (+perms). */
export function ScoreMatrixArena({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast } = useStoryCast();
  const { latch } = usePeakBlendLatch();
  const [sel, setSel] = useState({ row: 0, col: 0 });
  const d = 3;
  const sqrtD = Math.sqrt(d);

  const queries = useMemo<NamedVec[]>(
    () => [
      { id: "q0", label: "q₀ (cast x)", vec: cast.x },
      { id: "q1", label: "q₁", vec: cycleLeft(cast.x) },
      { id: "q2", label: "q₂", vec: cycleRight(cast.x) },
    ],
    [cast.x],
  );

  const keys = useMemo<NamedVec[]>(
    () => [
      { id: "k0", label: "k₀ (cast k)", vec: cast.k },
      { id: "k1", label: "k₁", vec: cycleLeft(cast.k) },
      { id: "k2", label: "k₂", vec: cycleRight(cast.k) },
    ],
    [cast.k],
  );

  const raw = useMemo(
    () => queries.map((q) => keys.map((k) => dot(q.vec, k.vec))),
    [queries, keys],
  );

  const scaled = useMemo(
    () => raw.map((row) => row.map((s) => s / sqrtD)),
    [raw, sqrtD],
  );

  const weightsRaw = useMemo(() => raw.map((row) => softmax(row)), [raw]);
  const weightsScaled = useMemo(() => scaled.map((row) => softmax(row)), [scaled]);

  const compare = latch.compare;
  const showScaled = compare || latch.scaleBySqrtD;

  const activeScores = showScaled && !compare ? scaled : raw;
  const activeWeights = showScaled && !compare ? weightsScaled : weightsRaw;

  const cellRaw = raw[sel.row][sel.col];
  const cellScaled = scaled[sel.row][sel.col];
  const q = queries[sel.row];
  const k = keys[sel.col];
  const rowRaw = raw[sel.row];
  const rowScaled = scaled[sel.row];
  const alphaRaw = weightsRaw[sel.row];
  const alphaScaled = weightsScaled[sel.row];
  const rowWeights = compare ? alphaScaled : activeWeights[sel.row];

  function nudge(which: "x" | "k", axis: 0 | 1 | 2, delta: number) {
    const src = which === "x" ? cast.x : cast.k;
    const next: Triple = [...src];
    next[axis] = Math.min(3, Math.max(-3, Number((next[axis] + delta).toFixed(2))));
    patchCast(which === "x" ? { x: next } : { k: next });
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Score heat</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Score Matrix Arena</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Attention’s missing middle: a QKᵀ heat stage. Lock one cast, then A|B the same row — left raw q·k, right ÷√d —
        and read max(α) with the top-2 score gap. Raw gaps peak the bets; ÷√d restores a blend.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="multiply" />
        <PeakBlendLatchBar onOpen={onOpen} sqrtD={sqrtD} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            Score grid · {queries.length}×{keys.length}
            <span className="ml-2 font-normal text-slate-500">
              {compare ? "A|B · raw vs ÷√d" : showScaled ? "showing q·k / √d" : "showing raw q·k"}
            </span>
          </p>
        </div>

        {compare ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">A · raw q·k</p>
              <ScoreHeatGrid
                queries={queries}
                keys={keys}
                values={raw}
                raw={raw}
                sel={sel}
                onSelect={setSel}
                ariaLabel="Raw QK transpose score matrix"
              />
              <div className="mt-3">
                <Bars
                  values={alphaRaw}
                  labels={keys.map((key) => key.label)}
                  highlightIndex={sel.col}
                  caption={`row softmax · Σ = ${fmt(alphaRaw.reduce((a, b) => a + b, 0), 3)}`}
                />
              </div>
              <div className="mt-2">
                <PeakBlendStats label="A · peaked?" scores={rowRaw} weights={alphaRaw} tone="raw" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">B · ÷√d</p>
              <ScoreHeatGrid
                queries={queries}
                keys={keys}
                values={scaled}
                raw={raw}
                sel={sel}
                onSelect={setSel}
                ariaLabel="Scaled QK transpose score matrix"
              />
              <div className="mt-3">
                <Bars
                  values={alphaScaled}
                  labels={keys.map((key) => key.label)}
                  highlightIndex={sel.col}
                  caption={`row softmax · Σ = ${fmt(alphaScaled.reduce((a, b) => a + b, 0), 3)}`}
                />
              </div>
              <div className="mt-2">
                <PeakBlendStats label="B · blend?" scores={rowScaled} weights={alphaScaled} tone="scaled" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <ScoreHeatGrid
                queries={queries}
                keys={keys}
                values={activeScores}
                raw={raw}
                sel={sel}
                onSelect={setSel}
                ariaLabel="QK transpose score matrix"
              />
            </div>
            <div className="mt-3 max-w-md">
              <PeakBlendStats
                label={showScaled ? "÷√d regime" : "Raw regime"}
                scores={activeScores[sel.row]}
                weights={activeWeights[sel.row]}
                tone={showScaled ? "scaled" : "raw"}
              />
            </div>
          </>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Warm cells are large positive scores. Same row on both sides — √d shrinks the top-2 gap before softmax without
          changing which key wins.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Selected cell</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {q.label} · {k.label}
          </p>
          <p className="mt-2 font-mono text-sm text-slate-700">
            q = (<Num value={q.vec[0]} tone="blue" />, <Num value={q.vec[1]} tone="blue" />, <Num value={q.vec[2]} tone="blue" />)
          </p>
          <p className="mt-1 font-mono text-sm text-slate-700">
            k = (<Num value={k.vec[0]} tone="amber" />, <Num value={k.vec[1]} tone="amber" />, <Num value={k.vec[2]} tone="amber" />)
          </p>
          <div className="mt-3">
            <SumLine terms={q.vec.map((qi, index) => ({ left: qi, right: k.vec[index] }))} />
          </div>
          <LiveCaption symbol="q · k" value={cellRaw}>
            ÷√d → {fmt(cellScaled)}. Softmax weight (B) on this column = {fmt(alphaScaled[sel.col], 3)}; raw α ={" "}
            {fmt(alphaRaw[sel.col], 3)}.
          </LiveCaption>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {compare ? "Say aloud · Peak ↔ Blend" : "Row softmax"}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {compare
              ? `Raw max(α)=${fmt(maxAlpha(alphaRaw), 3)} with top-2 gap ${fmt(top2ScoreGap(rowRaw))}; ÷√d softens to max(α)=${fmt(maxAlpha(alphaScaled), 3)} (gap ${fmt(top2ScoreGap(rowScaled))}). Carry the latch to spotlight → mixer.`
              : `Softmax of ${q.label}’s scores${showScaled ? " / √d" : ""}. The matching column is highlighted.`}
          </p>
          {!compare ? (
            <div className="mt-3">
              <Bars
                values={rowWeights}
                labels={keys.map((key) => key.label)}
                highlightIndex={sel.col}
                caption={`Σ weights = ${fmt(rowWeights.reduce((a, b) => a + b, 0), 3)}`}
              />
            </div>
          ) : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-700">Nudge cast x (queries)</p>
              {([0, 1, 2] as const).map((axis) => (
                <div key={`x${axis}`} className="mt-1 flex items-center gap-2">
                  <span className="w-7 font-mono text-xs text-slate-500">x{axis + 1}</span>
                  <button type="button" className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm" onClick={() => nudge("x", axis, -0.2)}>
                    −
                  </button>
                  <span className="tabular font-mono text-sm">
                    <Num value={cast.x[axis]} />
                  </span>
                  <button type="button" className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm" onClick={() => nudge("x", axis, 0.2)}>
                    +
                  </button>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-700">Nudge cast k (keys)</p>
              {([0, 1, 2] as const).map((axis) => (
                <div key={`k${axis}`} className="mt-1 flex items-center gap-2">
                  <span className="w-7 font-mono text-xs text-slate-500">k{axis + 1}</span>
                  <button type="button" className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm" onClick={() => nudge("k", axis, -0.2)}>
                    −
                  </button>
                  <span className="tabular font-mono text-sm">
                    <Num value={cast.k[axis]} />
                  </span>
                  <button type="button" className="rounded bg-white px-2 py-0.5 text-sm font-semibold shadow-sm" onClick={() => nudge("k", axis, 0.2)}>
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson links</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {[
            ["dot", "Dot — one cell"],
            ["norm", "Norm — √d scale"],
            ["multiply", "Multiply — QKᵀ"],
            ["transpose", "Transpose — Kᵀ"],
            ["softmax", "Softmax — row bets"],
          ].map(([id, label]) => (
            <li key={id}>
              <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen(id)}>
                {label}
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="font-semibold text-emerald-700" onClick={() => onOpen("spotlight")}>
              Spotlight stage
            </button>
          </li>
          <li>
            <button type="button" className="font-semibold text-emerald-700" onClick={() => onOpen("mixer")}>
              Value mixer
            </button>
          </li>
        </ul>
      </div>
    </main>
  );
}
