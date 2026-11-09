import { useMemo, useState } from "react";
import { det2, dot, matvec, transpose } from "./math";
import { layerInputBlame, layerUpstreamG, useStoryCast } from "./story";
import { LiveCaption, MatrixCells, Num, StoryStrip, fmt } from "./ui";

type Mode = "forward" | "transpose" | "rank";

export function MatrixMachine({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast, resetCast } = useStoryCast();
  const [mode, setMode] = useState<Mode>("forward");
  const [activeRow, setActiveRow] = useState(0);
  const [activeCol, setActiveCol] = useState(0);

  const y = useMemo(() => matvec(cast.W, cast.x), [cast.W, cast.x]);
  const yBias = [y[0] + cast.b[0], y[1] + cast.b[1]];
  const WT = useMemo(() => transpose(cast.W), [cast.W]);
  const g = useMemo(() => layerUpstreamG(cast), [cast]);
  const inputBlame = useMemo(() => layerInputBlame(cast), [cast]);
  // Rank of 2×2 top-left block as a quick visual of dependence
  const block: [[number, number], [number, number]] = [
    [cast.W[0][0], cast.W[0][1]],
    [cast.W[1][0], cast.W[1][1]],
  ];
  const det = det2(block[0], block[1]);
  const rankHint = Math.abs(det) < 1e-6 ? 1 : 2;

  const workers = cast.W.map((row, i) => {
    const products = row.map((w, j) => w * cast.x[j]);
    const sum = products.reduce((a, b) => a + b, 0);
    return { row, products, sum, out: sum + cast.b[i] };
  });

  const columnWorkers = cast.W[0].map((_, j) => {
    const column = [cast.W[0][j], cast.W[1][j]];
    const products = column.map((w, i) => w * g[i]);
    const sum = products.reduce((a, b) => a + b, 0);
    return { column, products, sum, wtRow: WT[j] };
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Machine metaphor</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Matrix as Machine</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Forward-then-flip on one cast W: row-workers build y = Wx + b, then transpose faces the same entries as columns so each input blame is column·g = (Wᵀg)ⱼ.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="linear-layer" />
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Shared upstream g</p>
          <p className="mt-1 font-mono text-sm text-slate-800">
            g = (<Num value={g[0]} />, <Num value={g[1]} />) · CE ∂L/∂z on cast scores 1–2
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Say aloud: forward faces rows; blame faces columns = Wᵀ rows. Same numbers on #jacobian.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={resetCast}>
              Reset cast
            </button>
            <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("jacobian")}>
              Open #jacobian
            </button>
            <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("transpose")}>
              Open #transpose
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["forward", "Forward workers"],
            ["transpose", "Transpose · blame"],
            ["rank", "Rank / dependence"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${mode === id ? "bg-[#172554] text-white" : "bg-white text-slate-800 shadow-sm"}`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <MatrixCells
            label="W (2×3) — shared cast"
            rows={cast.W}
            highlightRow={mode === "forward" ? activeRow : undefined}
            highlightCol={mode === "transpose" ? activeCol : undefined}
            onChange={(next) =>
              patchCast({
                W: [
                  [next[0][0], next[0][1], next[0][2]],
                  [next[1][0], next[1][1], next[1][2]],
                ],
              })
            }
          />
          <p className="mt-3 font-mono text-sm text-slate-700">
            x = (<Num value={cast.x[0]} />, <Num value={cast.x[1]} />, <Num value={cast.x[2]} />)
          </p>
          <p className="mt-1 font-mono text-sm text-slate-700">
            g = (<Num value={g[0]} tone="amber" />, <Num value={g[1]} tone="amber" />)
          </p>
        </div>

        <div className="space-y-3">
          {mode === "forward"
            ? workers.map((w, i) => {
                const hot = activeRow === i;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`w-full rounded-lg px-3 py-3 text-left shadow-sm ring-1 ${hot ? "bg-blue-50 ring-[#1d4ed8]" : "bg-white ring-slate-200"}`}
                    onClick={() => setActiveRow(i)}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Worker row {i + 1}</p>
                    <p className="mt-1 font-mono text-sm">
                      {w.row.map((cell, j) => (
                        <span key={j}>
                          {j > 0 ? " + " : ""}
                          <Num value={cell} tone="blue" />×<Num value={cast.x[j]} tone="amber" />
                        </span>
                      ))}
                      {" + "}
                      <Num value={cast.b[i]} /> = <strong><Num value={w.out} tone="green" /></strong>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Partial products: {w.products.map((p) => fmt(p)).join(", ")}. Dot = {fmt(w.sum)}.
                    </p>
                  </button>
                );
              })
            : null}

          {mode === "transpose" ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold">Wᵀ is {WT.length}×{WT[0].length} — same entries, columns face g</p>
                <p className="mt-1 text-sm text-slate-600">
                  Forward faced rows. Blame faces column j = row j of Wᵀ. Dot that column with g to blame input j.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="font-mono text-sm">
                    <tbody>
                      {WT.map((row, i) => (
                        <tr key={i} className={i === activeCol ? "bg-amber-50" : undefined}>
                          {row.map((cell, j) => (
                            <td key={j} className={`px-2 py-1 ${i === activeCol ? "font-semibold" : ""}`}>
                              {fmt(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {columnWorkers.map((w, j) => {
                const hot = activeCol === j;
                return (
                  <button
                    key={j}
                    type="button"
                    className={`w-full rounded-lg px-3 py-3 text-left shadow-sm ring-1 ${hot ? "bg-amber-50 ring-amber-700" : "bg-white ring-slate-200"}`}
                    onClick={() => setActiveCol(j)}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Input blame j = {j + 1} · column {j + 1} · g
                    </p>
                    <p className="mt-1 font-mono text-sm">
                      {w.column.map((cell, i) => (
                        <span key={i}>
                          {i > 0 ? " + " : ""}
                          <Num value={cell} tone="blue" />×<Num value={g[i]} tone="amber" />
                        </span>
                      ))}
                      {" = "}
                      <strong><Num value={w.sum} tone="green" /></strong>
                      {" = (Wᵀg)"}
                      <sub>{j + 1}</sub>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Wᵀ row {j + 1} = ({fmt(w.wtRow[0])}, {fmt(w.wtRow[1])}). Matches #jacobian sum Σᵢ gᵢ Wᵢⱼ.
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {mode === "rank" ? (
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold">Top-left 2×2 determinant</p>
              <p className="mt-1 font-mono text-lg">
                det = <Num value={det} tone={Math.abs(det) < 1e-6 ? "amber" : "green"} />
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {rankHint === 1
                  ? "Rows look dependent in this block — the machine collapses directions (rank hint ≈ 1)."
                  : "Two independent directions in this block — rank hint ≈ 2."}
              </p>
              <button
                type="button"
                className="mt-3 rounded-md bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-950"
                onClick={() =>
                  patchCast({
                    W: [
                      [1, 2, cast.W[0][2]],
                      [2, 4, cast.W[1][2]],
                    ],
                  })
                }
              >
                Force dependent rows
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {mode === "transpose" ? (
          <LiveCaption symbol="(Wᵀg)ⱼ" value={inputBlame[activeCol]}>
            Input {activeCol + 1} blame = column·g = ({fmt(inputBlame[0])}, {fmt(inputBlame[1])}, {fmt(inputBlame[2])}).
            Forward W, blame Wᵀ — same entries.
          </LiveCaption>
        ) : (
          <LiveCaption symbol="y = Wx + b" value={dot(yBias, [1, 0])}>
            Outputs ({fmt(yBias[0])}, {fmt(yBias[1])}). Active worker {activeRow + 1}. Freeze these, then flip to Transpose · blame.
          </LiveCaption>
        )}
        <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson links</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {[
              ["linear-layer", "Linear layer"],
              ["multiply", "Multiply"],
              ["transpose", "Transpose"],
              ["rank", "Rank"],
              ["jacobian", "Jacobian"],
              ["interview", "Interview dual"],
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
    </main>
  );
}
