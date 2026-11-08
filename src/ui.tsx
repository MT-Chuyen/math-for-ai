import type { ReactNode } from "react";
import { snap } from "./math";

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
  result,
}: {
  factors: { name: string; value: number; why: string }[];
  result: { name: string; value: number };
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-stretch gap-2">
        {factors.map((factor, index) => (
          <div key={factor.name} className="flex items-stretch gap-2">
            <div className="w-36 rounded-md bg-white p-2 shadow-sm">
              <div className="font-serif text-slate-900">{factor.name}</div>
              <div className="font-mono text-lg tabular">
                <Num value={factor.value} />
              </div>
              <p className="text-xs leading-snug text-slate-500">{factor.why}</p>
            </div>
            <span className="self-center text-slate-400">{index === factors.length - 1 ? "=" : "×"}</span>
          </div>
        ))}
        <div className="w-36 rounded-md bg-emerald-700 p-2 text-white">
          <div className="font-serif">{result.name}</div>
          <div className="font-mono text-lg tabular">{fmt(result.value)}</div>
        </div>
      </div>
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
