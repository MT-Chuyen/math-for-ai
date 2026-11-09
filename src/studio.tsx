import { useEffect, useMemo, useState } from "react";
import { cosine, gdStep, norm } from "./math";
import { Bars, Curve, VectorPlane } from "./plots";
import {
  FAILURE_BEAT_ORDER,
  FAILURE_BEATS,
  getCast,
  storyDerived,
  useFailureBeat,
  useStoryCast,
} from "./story";
import { failureBeatChapters, pipelineRoute } from "./storyChapters";
import { LiveCaption, LossPassport, Num, Scalar, StoryStrip, fmt } from "./ui";

export function Studio({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast, resetCast } = useStoryCast();
  const { beatId, beat, applyFailureBeat, clearFailureBeat } = useFailureBeat();
  const derived = storyDerived(cast);
  const gate = derived.net.gate;
  const dLossDw1 = derived.net.dLossDw1;
  const [playing, setPlaying] = useState(false);
  const [lastArrow, setLastArrow] = useState<"q" | "k" | null>(null);
  const query = { x: cast.x[0], y: cast.x[1] };
  const key = { x: cast.k[0], y: cast.k[1] };
  const agreement = derived.agreement2;
  const angle = cosine([query.x, query.y], [key.x, key.y]);
  const loss = derived.bowlLoss;
  const probs = derived.probs;
  const topClass = useMemo(() => {
    let best = 0;
    for (let index = 1; index < probs.length; index += 1) {
      if (probs[index] > probs[best]) best = index;
    }
    return best;
  }, [probs]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const live = getCast();
      patchCast({ weight: Number(gdStep(live.weight, live.eta).toFixed(3)) });
    }, 70);
    return () => window.clearInterval(id);
  }, [playing, cast.eta]);

  useEffect(() => {
    if (playing && (Math.abs(cast.weight - 3) < 0.02 || Math.abs(cast.weight) > 14)) setPlaying(false);
  }, [cast.weight, playing]);

  function dragArrow(label: string, x: number, y: number) {
    const point = { x: Math.min(2.6, Math.max(-2.6, x)), y: Math.min(2.6, Math.max(-2.6, y)) };
    if (label === "q") {
      patchCast({ x: [point.x, point.y, cast.x[2]] });
      setLastArrow("q");
    }
    if (label === "k") {
      patchCast({ k: [point.x, point.y, cast.k[2]] });
      setLastArrow("k");
    }
  }

  function setScore(index: number, value: number) {
    const scores: [number, number, number] = [...cast.scores];
    scores[index] = value;
    patchCast({ scores });
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Move a number and watch the formula</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Drag inside each picture. These knobs are one shared cast — the same run the lessons below open. Nothing here is a separate demo: each panel opens the field that explains it.
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="studio" />
        <LossPassport cast={cast} />
        <aside className="rounded-lg border border-[#172554]/15 bg-white px-3 py-2 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Peak ↔ Blend</p>
          <p className="mt-1 text-sm text-slate-700">
            Lock this cast. On #scores flip A|B — raw q·k peaks α; ÷√d restores a blend. Carry the latch through
            #spotlight → #mixer without changing numbers.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {[
              ["scores", "Scores A|B"],
              ["spotlight", "Spotlight"],
              ["mixer", "Mixer"],
            ].map(([id, label]) => (
              <button key={id} type="button" className="font-semibold text-[#1d4ed8]" onClick={() => onOpen(id)}>
                {label}
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800/80">Failure beats</p>
        <p className="mt-1 text-sm text-slate-700">
          One story, three named beats — each writes the shared cast so #chain, #descent, #twins, and #replay stay on the same run.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FAILURE_BEAT_ORDER.map((id) => {
            const item = FAILURE_BEATS[id];
            const active = beatId === id;
            return (
              <button
                key={id}
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${active ? "bg-amber-800 text-white" : "bg-white text-slate-800 shadow-sm ring-1 ring-amber-200"}`}
                onClick={() => {
                  setPlaying(false);
                  applyFailureBeat(id);
                }}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
            onClick={() => {
              setPlaying(false);
              resetCast();
              clearFailureBeat();
            }}
          >
            Reset cast
          </button>
        </div>
        {beat ? (
          <div className="mt-2 space-y-1 text-sm text-slate-800">
            <p>
              <span className="font-semibold">Say aloud:</span> {beat.sayAloud}
            </p>
            <p className="text-xs text-slate-600">{failureBeatChapters[beat.id].blurb}</p>
            <p className="font-mono text-xs text-slate-600">
              gate={gate} · ∂L/∂w₁=<Num value={dLossDw1} /> · η=<Num value={cast.eta} /> · w=<Num value={cast.weight} />
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {beat.jump.map((j) => (
                <button key={j.id} type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen(j.id)}>
                  {j.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-600">No active beat. Trigger Gate shut, Bad η, or Honest recovery to cue the labs.</p>
        )}
      </div>
      <div className="mt-3 max-w-full overflow-x-auto">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Pipeline walk</p>
        <ol className="flex min-w-max gap-2 pb-1">
          {pipelineRoute.map((stop, index) => (
            <li key={stop.id} className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md bg-slate-50 px-2.5 py-1.5 text-left text-xs shadow-sm ring-1 ring-slate-200"
                onClick={() => onOpen(stop.id === "studio" ? "map" : stop.id)}
              >
                <span className="block font-mono text-[10px] text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-semibold text-slate-800">{stop.title}</span>
              </button>
              {index < pipelineRoute.length - 1 ? <span className="text-slate-300">→</span> : null}
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Forward-then-flip dual</p>
        <p className="mt-1 text-sm text-slate-700">
          Same cast W: forward faces rows on #machine, blame faces columns = Wᵀ on #jacobian. Say aloud: forward W, blame Wᵀ — same entries.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("machine")}>
            Open #machine
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("jacobian")}>
            Open #jacobian
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("transpose")}>
            Open #transpose
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("interview")}>
            Interview dual
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="min-w-0 rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">Two arrows</h3>
          <p className="mt-1 text-sm text-slate-700">The dot product multiplies matching entries and adds those products.</p>
          <VectorPlane
            lock={3.2}
            onDrag={dragArrow}
            vectors={[
              { x: query.x, y: query.y, color: "#1d4ed8", label: "q" },
              { x: key.x, y: key.y, color: "#b45309", label: "k" },
            ]}
          />
          <div className="mt-2">
            <LiveCaption symbol="q · k" value={agreement}>
              {lastArrow === "q"
                ? `You moved q to (${fmt(query.x)}, ${fmt(query.y)}).`
                : lastArrow === "k"
                  ? `You moved k to (${fmt(key.x)}, ${fmt(key.y)}).`
                  : agreement < 0
                    ? "They fight."
                    : "They agree."}
            </LiveCaption>
          </div>
          <p className="mt-2 break-words font-mono text-sm">
            {fmt(query.x)}×{fmt(key.x)} + {fmt(query.y)}×{fmt(key.y)} = <strong>{fmt(agreement)}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Cosine {fmt(angle)}. Lengths {fmt(norm([query.x, query.y]))} and {fmt(norm([key.x, key.y]))}.
          </p>
          <button type="button" className="mt-2 text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("dot")}>
            Open the dot product
          </button>
        </article>

        <article className="min-w-0 rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">One weight on a bowl</h3>
          <p className="mt-1 text-sm text-slate-700">A training step walks the weight against the slope, toward the bottom at 3.</p>
          <Curve
            f={(value) => (value - 3) ** 2}
            xMin={-1}
            xMax={7}
            marker={Math.min(7, Math.max(-1, cast.weight))}
            onScrub={(value) => {
              setPlaying(false);
              patchCast({ weight: Number(value.toFixed(2)) });
            }}
          />
          <div className="mt-2">
            <LiveCaption symbol="L(w)" value={loss}>
              w is {fmt(cast.weight)}; the bowl bottom sits at w = 3.
            </LiveCaption>
          </div>
          <p className="mt-2 break-words font-mono text-sm">
            L({fmt(cast.weight)}) = ({fmt(cast.weight)} − 3)² = <strong>{fmt(loss)}</strong>
          </p>
          <Scalar label="η, learning rate" value={cast.eta} onChange={(eta) => patchCast({ eta })} min={0.02} max={1.2} step={0.02} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => setPlaying((value) => !value)}>
              {playing ? "Stop" : "Train"}
            </button>
            <button
              type="button"
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold"
              onClick={() => {
                setPlaying(false);
                patchCast({ weight: 0.2 });
              }}
            >
              Reset
            </button>
          </div>
          <button type="button" className="mt-2 block text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("descent")}>
            Open gradient descent
          </button>
        </article>

        <article className="min-w-0 rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">Three scores, one probability</h3>
          <p className="mt-1 text-sm text-slate-700">Softmax turns scores into positive numbers that add to 1.</p>
          <div className="mt-3 space-y-2">
            {cast.scores.map((score, index) => (
              <Scalar key={index} label={`score ${index + 1}`} value={score} onChange={(value) => setScore(index, value)} min={-2} max={4} step={0.1} />
            ))}
          </div>
          <div className="mt-3">
            <Bars
              values={probs}
              labels={["class 1", "class 2", "class 3"]}
              highlightIndex={topClass}
              caption={`class ${topClass + 1} is tallest`}
            />
          </div>
          <div className="mt-2">
            <LiveCaption symbol={`p${topClass + 1}`} value={probs[topClass]} digits={2}>
              that class holds {fmt(probs[topClass] * 100, 0)}% of the probability mass.
            </LiveCaption>
          </div>
          <button type="button" className="mt-2 text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("softmax")}>
            Open softmax
          </button>
        </article>
      </div>
    </section>
  );
}
