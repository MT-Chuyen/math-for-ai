import { useEffect, useState, type ReactNode } from "react";
import { snap } from "./math";
import { lossPassport, useStoryCast, type StoryCast } from "./story";
import { chapterFor } from "./storyChapters";

export function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return value > 0 ? "+∞" : "−∞";
  const text = Math.abs(value).toFixed(digits);
  return value < 0 ? `−${text}` : text;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</h3>;
}

export function Section({ id, kicker, children }: { id: string; kicker: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-14 border-t border-slate-200 pt-5">
      <Kicker>{kicker}</Kicker>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{children}</p>;
}

export function Board({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-[#172554] px-4 py-3 text-white">
      <div className="flex min-w-max items-center gap-2 font-serif text-xl leading-relaxed">{children}</div>
    </div>
  );
}

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center align-middle text-base leading-tight">
      <span className="border-b border-current px-1.5 pb-0.5">{num}</span>
      <span className="px-1.5 pt-0.5">{den}</span>
    </span>
  );
}

export function Goal({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <p className={`rounded-md px-3 py-2 text-sm leading-relaxed ${met ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}>
      <strong>{met ? "Reached. " : "Try this. "}</strong>
      {children}
    </p>
  );
}

export function Num({ value, digits = 2, tone = "slate" }: { value: number; digits?: number; tone?: "blue" | "amber" | "green" | "slate" | "white" }) {
  const color = {
    blue: "text-blue-700",
    amber: "text-amber-700",
    green: "text-emerald-700",
    slate: "text-slate-900",
    white: "text-white",
  }[tone];
  return <span className={`tabular font-mono ${color}`}>{fmt(value, digits)}</span>;
}

export function VectorEditor({
  label,
  hint,
  values,
  onChange,
  min = -3,
  max = 3,
  step = 0.1,
}: {
  label: string;
  hint: string;
  values: number[];
  onChange: (next: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  function setAt(index: number, raw: number) {
    if (!Number.isFinite(raw)) return;
    const next = values.slice();
    next[index] = snap(Math.min(max, Math.max(min, raw)), step);
    onChange(next);
  }

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">{label}</legend>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>
      <div className="flex flex-wrap gap-3">
        {values.map((value, index) => (
          <label key={index} className="w-24">
            <span className="block text-[11px] uppercase tracking-wide text-slate-400">
              entry {index + 1}
            </span>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-center font-mono text-sm"
              type="number"
              step={step}
              min={min}
              max={max}
              value={value}
              aria-label={`${label} entry ${index + 1}`}
              onChange={(event) => setAt(index, Number(event.target.value))}
            />
            <input
              className="mt-2"
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              aria-label={`${label} slider ${index + 1}`}
              onChange={(event) => setAt(index, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Scalar({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  note,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  note?: string;
}) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="tabular font-mono text-slate-900">{fmt(value, step < 0.01 ? 4 : 2)}</span>
      </span>
      <input
        className="mt-2"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(snap(Number(event.target.value), step))}
      />
      {note ? <span className="mt-1 block text-xs text-slate-500">{note}</span> : null}
    </label>
  );
}

export function SumLine({
  terms,
  extra = 0,
  extraLabel = "bias",
  showExtra = false,
}: {
  terms: { left: number; right: number }[];
  extra?: number;
  extraLabel?: string;
  showExtra?: boolean;
}) {
  const products = terms.map((term) => term.left * term.right);
  const total = products.reduce((sum, value) => sum + value, 0) + (showExtra ? extra : 0);
  const withExtra = showExtra;
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max flex-wrap items-end gap-2">
        {terms.map((term, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="rounded-md bg-white px-2 py-1 text-center shadow-sm">
              <div className="text-sm">
                <Num value={term.left} tone="blue" /> <span className="text-slate-400">×</span> <Num value={term.right} tone="amber" />
              </div>
              <div className="mt-1 border-t border-slate-200 pt-1 text-sm">
                <Num value={products[index]} tone="green" />
              </div>
            </div>
            <span className="pb-3 text-slate-400">{index === terms.length - 1 && !withExtra ? "=" : "+"}</span>
          </div>
        ))}
        {withExtra ? (
          <div className="flex items-end gap-2">
            <div className="rounded-md bg-white px-2 py-1 text-center shadow-sm">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">{extraLabel}</div>
              <div className="text-sm">
                <Num value={extra} tone="green" />
              </div>
            </div>
            <span className="pb-3 text-slate-400">=</span>
          </div>
        ) : null}
        <div className="rounded-md bg-emerald-700 px-3 py-2 font-mono text-lg text-white tabular">{fmt(total)}</div>
      </div>
    </div>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  const links = [
    ["definition", "Definition"],
    ["formula", "Formula"],
    ["numbers", "Numbers"],
    ["model", "In a model"],
  ];
  return (
    <div className="space-y-5">
      <nav className="sticky top-0 z-10 -mx-5 flex gap-2 overflow-x-auto border-b border-slate-200 bg-[#e8eef6]/95 px-5 py-2 text-sm backdrop-blur">
        {links.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {label}
          </button>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function Chain({
  factors,
  through,
  running,
  resultName,
}: {
  factors: { name: string; value: number; why: string }[];
  through: number;
  running: number;
  resultName: string;
}) {
  const reached = factors.slice(0, through + 1);
  const gateShut = reached.some((factor) => factor.name === "dh/dz" && factor.value === 0);
  const killed = gateShut || reached.some((factor) => factor.value === 0);
  const finished = through >= factors.length - 1;
  return (
    <div className="max-w-full space-y-2">
      <ol className="space-y-2">
        {factors.map((factor, index) => {
          const open = index <= through;
          const current = index === through;
          const dead = open && factor.value === 0;
          return (
            <li
              key={factor.name}
              className={`max-w-full rounded-md px-3 py-2 ${dead ? "bg-amber-50" : current ? "bg-white ring-2 ring-[#172554]" : open ? "bg-white" : "bg-slate-100"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className={`font-serif ${open ? "text-slate-900" : "text-slate-400"}`}>{factor.name}</span>
                {open ? (
                  <span className={`font-mono text-lg tabular ${dead ? "text-amber-800" : "text-slate-900"}`}>{fmt(factor.value)}</span>
                ) : (
                  <span className="text-xs text-slate-400">next</span>
                )}
              </div>
              {open ? <p className={`mt-1 text-xs leading-snug ${dead ? "text-amber-950" : "text-slate-500"}`}>{factor.why}</p> : null}
            </li>
          );
        })}
      </ol>
      <p className={`rounded-md px-3 py-2 text-sm leading-relaxed ${killed ? "bg-amber-50 text-amber-950" : "bg-emerald-700 text-white"}`}>
        <span className="font-semibold">{finished ? resultName : "Running product"}</span>
        {" = "}
        <span className="font-mono tabular">{fmt(running)}</span>
        {gateShut
          ? ". The ReLU gate dh/dz is 0, so this product is 0 and stays 0."
          : killed
            ? ". A factor above is 0, so the whole product is 0."
            : finished
              ? "."
              : ". The next factor has not been multiplied yet."}
      </p>
    </div>
  );
}

export function LiveCaption({
  symbol,
  value,
  digits = 2,
  children,
}: {
  /** Symbol or short name that just moved, e.g. "q · k" or "w". */
  symbol: string;
  value?: number;
  digits?: number;
  /** Plain-language follow-on after the number, optional. */
  children?: ReactNode;
}) {
  return (
    <p className="live-caption rounded-md bg-white px-3 py-2 text-sm leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200/80">
      <span className="font-semibold text-[#172554]">{symbol}</span>
      {value !== undefined ? (
        <>
          {" = "}
          <span className="tabular font-mono text-slate-900">{fmt(value, digits)}</span>
        </>
      ) : null}
      {children ? <span className="text-slate-600">{value !== undefined ? ". " : " "}{children}</span> : null}
    </p>
  );
}

function castChip(cast: StoryCast, key: string): { label: string; text: string } | null {
  switch (key) {
    case "x":
      return { label: "x", text: `(${fmt(cast.x[0])}, ${fmt(cast.x[1])}, ${fmt(cast.x[2])})` };
    case "k":
      return { label: "k", text: `(${fmt(cast.k[0])}, ${fmt(cast.k[1])}, ${fmt(cast.k[2])})` };
    case "W":
      return { label: "W", text: "2×3 table" };
    case "b":
      return { label: "b", text: `(${fmt(cast.b[0])}, ${fmt(cast.b[1])})` };
    case "w1":
      return { label: "w₁", text: fmt(cast.w1) };
    case "w2":
      return { label: "w₂", text: fmt(cast.w2) };
    case "target":
      return { label: "t", text: fmt(cast.target) };
    case "weight":
      return { label: "w", text: fmt(cast.weight) };
    case "eta":
      return { label: "η", text: fmt(cast.eta) };
    case "scores":
      return { label: "z", text: `(${fmt(cast.scores[0])}, ${fmt(cast.scores[1])}, ${fmt(cast.scores[2])})` };
    case "correct":
      return { label: "★", text: `class ${cast.correct + 1}` };
    default:
      return null;
  }
}

/**
 * Shared Loss Passport strip — L, ŷ, gate, ∂L/∂w₁, ∂L/∂w₂ from one backprop on the cast.
 * Mount on Studio / pipeline / twins / chain / replay / synthesis so failure beats refresh everywhere.
 */
export function LossPassport({ cast: override }: { cast?: StoryCast }) {
  const { cast: live } = useStoryCast();
  const cast = override ?? live;
  const stamp = lossPassport(cast);
  const gateShut = !stamp.gateOpen;
  const fields: { label: string; text: string; hot?: boolean }[] = [
    { label: "L", text: fmt(stamp.loss) },
    { label: "ŷ", text: fmt(stamp.prediction) },
    { label: "gate", text: stamp.gateOpen ? "h>0" : "shut", hot: gateShut },
    { label: "∂L/∂w₁", text: fmt(stamp.dLossDw1), hot: gateShut && stamp.dLossDw1 === 0 },
    { label: "∂L/∂w₂", text: fmt(stamp.dLossDw2) },
  ];

  return (
    <aside
      className={`max-w-full overflow-hidden rounded-lg border px-3 py-2 shadow-sm ${
        gateShut ? "border-amber-300 bg-amber-50/90" : "border-slate-200 bg-white"
      }`}
      aria-label="Loss passport"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Loss passport</p>
        <p className="text-[11px] text-slate-500">same backprop · same cast</p>
      </div>
      <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-0.5">
        {fields.map((field) => (
          <span
            key={field.label}
            className={`shrink-0 rounded-md px-2 py-1 font-mono text-[11px] tabular ${
              field.hot ? "bg-amber-800 text-white" : "bg-[#172554] text-white"
            }`}
          >
            <span className="opacity-80">{field.label}</span> {field.text}
          </span>
        ))}
      </div>
    </aside>
  );
}

/** Thin “Same run” strip: which cast values this lesson owns. Mobile-safe. */
export function StoryStrip({ lessonId }: { lessonId: string }) {
  const { cast, resetCast } = useStoryCast();
  const chapter = chapterFor(lessonId);
  if (!chapter) return null;
  const owned = new Set(chapter.owns);
  const chips = chapter.owns
    .map((key) => castChip(cast, key))
    .filter((chip): chip is { label: string; text: string } => chip !== null);
  const shared = (["x", "weight", "eta", "scores"] as const)
    .filter((key) => !owned.has(key))
    .map((key) => castChip(cast, key))
    .filter((chip): chip is { label: string; text: string } => chip !== null);

  return (
    <aside className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Same run</p>
        <button type="button" className="text-xs font-semibold text-[#1d4ed8]" onClick={resetCast}>
          Reset cast
        </button>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">{chapter.title}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-600">{chapter.blurb}</p>
      <div className="mt-2 flex max-w-full gap-2 overflow-x-auto pb-0.5">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="shrink-0 rounded-md bg-[#172554] px-2 py-1 font-mono text-[11px] tabular text-white"
            title="Owned on this page"
          >
            <span className="opacity-80">{chip.label}</span> {chip.text}
          </span>
        ))}
        {shared.map((chip) => (
          <span
            key={chip.label}
            className="shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] tabular text-slate-600"
            title="Carried from the shared cast"
          >
            <span className="text-slate-400">{chip.label}</span> {chip.text}
          </span>
        ))}
      </div>
    </aside>
  );
}

export function StepControls({
  step,
  total,
  onPrev,
  onNext,
  label,
}: {
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  /** Shown after "Step k of n", e.g. the current factor name. */
  label?: string;
}) {
  const atStart = step <= 0;
  const atEnd = step >= total - 1;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onPrev}
        disabled={atStart}
        aria-label="Previous step"
      >
        Prev
      </button>
      <button
        type="button"
        className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={atEnd}
        aria-label="Next step"
      >
        Next
      </button>
      <span className="text-sm text-slate-600">
        Step <span className="tabular font-mono text-slate-900">{Math.min(step + 1, total)}</span> of{" "}
        <span className="tabular font-mono text-slate-900">{total}</span>
        {label ? <span className="text-slate-500"> · {label}</span> : null}
      </span>
    </div>
  );
}

export function MatrixCells({
  label,
  rows,
  onChange,
  min = -4,
  max = 4,
  highlightRow,
  highlightCol,
}: {
  label: string;
  rows: number[][];
  onChange?: (next: number[][]) => void;
  min?: number;
  max?: number;
  highlightRow?: number;
  highlightCol?: number;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</legend>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${rows[0]?.length ?? 1}, minmax(3.5rem, 1fr))` }}>
        {rows.map((row, i) =>
          row.map((value, j) => {
            const hot = i === highlightRow || j === highlightCol;
            return (
              <input
                key={`${i}-${j}`}
                aria-label={`${label} row ${i + 1} column ${j + 1}`}
                className={`w-16 rounded border px-1 py-1 text-center font-mono text-sm tabular ${hot ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white"}`}
                type="number"
                step="0.1"
                value={value}
                readOnly={!onChange}
                onChange={(event) => {
                  if (!onChange) return;
                  const parsed = Number(event.target.value);
                  if (!Number.isFinite(parsed)) return;
                  onChange(rows.map((line, r) => line.map((cell, c) => (r === i && c === j ? snap(Math.min(max, Math.max(min, parsed))) : cell))));
                }}
              />
            );
          }),
        )}
      </div>
    </fieldset>
  );
}

/** Shared Peak↔Blend compare latch — same A|B intent across #scores → #spotlight → #mixer. */
export type PeakBlendLatch = {
  /** When true, surfaces show raw vs ÷√d side by side (A|B). */
  compare: boolean;
  /** Single-regime toggle when compare is off (true = ÷√d). */
  scaleBySqrtD: boolean;
};

export const PEAK_BLEND_LATCH_KEY = "aimath:peak-blend-latch";

export const DEFAULT_PEAK_BLEND_LATCH: PeakBlendLatch = {
  compare: true,
  scaleBySqrtD: true,
};

type PeakBlendListener = () => void;

let peakBlendLatch: PeakBlendLatch = loadPeakBlendLatch();
const peakBlendListeners = new Set<PeakBlendListener>();

function loadPeakBlendLatch(): PeakBlendLatch {
  try {
    const text = sessionStorage.getItem(PEAK_BLEND_LATCH_KEY);
    if (!text) return { ...DEFAULT_PEAK_BLEND_LATCH };
    const parsed = JSON.parse(text) as Partial<PeakBlendLatch>;
    return {
      compare: parsed.compare !== false,
      scaleBySqrtD: parsed.scaleBySqrtD !== false,
    };
  } catch {
    return { ...DEFAULT_PEAK_BLEND_LATCH };
  }
}

function persistPeakBlendLatch(next: PeakBlendLatch) {
  try {
    sessionStorage.setItem(PEAK_BLEND_LATCH_KEY, JSON.stringify(next));
  } catch {
    /* sessionStorage can be blocked; in-memory latch still works */
  }
}

function notifyPeakBlend() {
  for (const listener of peakBlendListeners) listener();
}

export function getPeakBlendLatch(): PeakBlendLatch {
  return peakBlendLatch;
}

export function setPeakBlendLatch(patch: Partial<PeakBlendLatch>) {
  peakBlendLatch = {
    compare: patch.compare ?? peakBlendLatch.compare,
    scaleBySqrtD: patch.scaleBySqrtD ?? peakBlendLatch.scaleBySqrtD,
  };
  persistPeakBlendLatch(peakBlendLatch);
  notifyPeakBlend();
}

/** Subscribe to the shared Peak↔Blend A|B / √d latch. */
export function usePeakBlendLatch() {
  const [latch, setLatch] = useState<PeakBlendLatch>(() => getPeakBlendLatch());
  useEffect(() => {
    const sync = () => setLatch({ ...getPeakBlendLatch() });
    peakBlendListeners.add(sync);
    sync();
    return () => {
      peakBlendListeners.delete(sync);
    };
  }, []);
  return {
    latch,
    setCompare: (compare: boolean) => setPeakBlendLatch({ compare }),
    setScaleBySqrtD: (scaleBySqrtD: boolean) => setPeakBlendLatch({ scaleBySqrtD }),
    setLatch: (patch: Partial<PeakBlendLatch>) => setPeakBlendLatch(patch),
  };
}

/** max(α) from a softmax weight row. */
export function maxAlpha(weights: number[]): number {
  let max = 0;
  for (const w of weights) if (w > max) max = w;
  return max;
}

/** Gap between the top-2 scores in a row (sorted descending). */
export function top2ScoreGap(scores: number[]): number {
  if (scores.length < 2) return 0;
  let first = -Infinity;
  let second = -Infinity;
  for (const s of scores) {
    if (s > first) {
      second = first;
      first = s;
    } else if (s > second) {
      second = s;
    }
  }
  return first - second;
}

/** Compact max(α) + top-2 gap readout for one regime. */
export function PeakBlendStats({
  label,
  scores,
  weights,
  tone = "slate",
}: {
  label: string;
  scores: number[];
  weights: number[];
  tone?: "raw" | "scaled" | "slate";
}) {
  const ring =
    tone === "raw"
      ? "ring-amber-300 bg-amber-50/80"
      : tone === "scaled"
        ? "ring-emerald-300 bg-emerald-50/80"
        : "ring-slate-200 bg-slate-50";
  return (
    <div className={`rounded-lg px-3 py-2 text-sm ring-1 ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-mono tabular text-slate-900">
        max(α) = <Num value={maxAlpha(weights)} digits={3} />
      </p>
      <p className="font-mono tabular text-slate-700">
        top-2 gap = <Num value={top2ScoreGap(scores)} digits={2} />
      </p>
    </div>
  );
}

/**
 * Shared A|B compare chrome for the Peak↔Blend ritual.
 * Latches across #scores → #spotlight → #mixer so the cast never needs to change mid-story.
 */
export function PeakBlendLatchBar({
  onOpen,
  sqrtD,
}: {
  onOpen?: (id: string) => void;
  sqrtD: number;
}) {
  const { latch, setCompare, setScaleBySqrtD } = usePeakBlendLatch();
  return (
    <aside
      className="max-w-full overflow-hidden rounded-lg border border-[#172554]/15 bg-white px-3 py-2 shadow-sm"
      aria-label="Peak blend compare latch"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Peak ↔ Blend</p>
        <p className="text-[11px] text-slate-500">same cast · A|B latch</p>
      </div>
      <p className="mt-1 text-xs leading-snug text-slate-600">
        Raw q·k gaps grow ~√d → peaked α; ÷√d restores a usable blend. Latch carries through scores → spotlight → mixer.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            latch.compare ? "bg-[#172554] text-white" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
          }`}
          aria-pressed={latch.compare}
          onClick={() => setCompare(!latch.compare)}
        >
          A|B compare
        </button>
        {!latch.compare ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={latch.scaleBySqrtD}
              onChange={(e) => setScaleBySqrtD(e.target.checked)}
            />
            ÷√d ({fmt(sqrtD)})
          </label>
        ) : (
          <span className="text-xs text-slate-500">
            Left = raw · Right = ÷√d ({fmt(sqrtD)})
          </span>
        )}
      </div>
      {onOpen ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {[
            ["scores", "Scores"],
            ["spotlight", "Spotlight"],
            ["mixer", "Mixer"],
            ["norm", "Norm"],
            ["dot", "Dot"],
            ["softmax", "Softmax"],
          ].map(([id, label]) => (
            <li key={id}>
              <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen(id)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
