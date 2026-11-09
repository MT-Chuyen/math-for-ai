import { useMemo, useState } from "react";
import { backprop, cosine, dot, matvec, softmax } from "./math";
import { STATIONS } from "./mapGraph";
import { useStoryCast } from "./story";
import { pipelineRoute } from "./storyChapters";
import { LiveCaption, LossPassport, Num, StoryStrip, fmt } from "./ui";

/** Compact wall linking map · pipeline · landscape · spotlight on one cast. */
export function SynthesisWall({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast } = useStoryCast();
  const [focus, setFocus] = useState<"map" | "pipeline" | "landscape" | "spotlight">("map");

  const layer = useMemo(() => {
    const y = matvec(cast.W, cast.x);
    return [y[0] + cast.b[0], y[1] + cast.b[1]];
  }, [cast]);
  const net = useMemo(() => backprop(cast.x[0], cast.w1, cast.w2, cast.target), [cast]);
  const agreement = dot([cast.x[0], cast.x[1]], [cast.k[0], cast.k[1]]);
  const probs = softmax(cast.scores);
  const bowl = (cast.weight - 3) ** 2;
  const angle = cosine(cast.x, cast.k);

  const mapPreview = STATIONS.filter((s) =>
    ["dot", "norm", "linear-layer", "softmax", "descent", "chain", "partials", "curvature"].includes(s.id),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Synthesis</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Synthesis Wall</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        One cast, four surfaces. Switch focus to see how the subway, the pipeline theater, the landscape hike, and the attention spotlight all read the same numbers.
      </p>
      <div className="mt-3">
        <StoryStrip lessonId="studio" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["map", "Subway"],
            ["pipeline", "Pipeline"],
            ["landscape", "Landscape"],
            ["spotlight", "Spotlight"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${focus === id ? "bg-[#172554] text-white" : "bg-white text-slate-800 shadow-sm"}`}
            onClick={() => setFocus(id)}
          >
            {label}
          </button>
        ))}
        <button type="button" className="rounded-md bg-[#1d4ed8] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => onOpen(focus === "map" ? "map" : focus)}>
          Open full surface
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,14rem)_1fr]">
        <div className="min-w-0 space-y-3">
          <LossPassport cast={cast} />
          <p className="text-xs leading-snug text-slate-600">
            Passport stamps tiny-net L, ŷ, gate, ∂L/∂w₁, ∂L/∂w₂ from the shared cast — same numbers #pipeline and #chain show.
          </p>
          <p className="font-mono text-xs text-slate-600">
            z=<Num value={net.z} /> · h=<Num value={net.hidden} /> · gate={net.gate ? "h>0" : "shut"}
          </p>
        </div>
        <div className="min-w-0 grid gap-4 sm:grid-cols-2">
        <section className={`rounded-xl bg-white p-4 shadow-sm ring-2 ${focus === "map" ? "ring-[#1d4ed8]" : "ring-transparent"}`}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#172554]">Idea subway (key stations)</h3>
            <button type="button" className="text-xs font-semibold text-[#1d4ed8]" onClick={() => onOpen("map")}>
              Full map
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapPreview.map((s) => (
              <button
                key={s.id}
                type="button"
                className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200"
                onClick={() => onOpen(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Transfers (Iter 7): cosine ↔ √d ↔ softmax sit on the attention line.</p>
        </section>

        <section className={`rounded-xl bg-white p-4 shadow-sm ring-2 ${focus === "pipeline" ? "ring-[#1d4ed8]" : "ring-transparent"}`}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#172554]">Pipeline cast read</h3>
            <button type="button" className="text-xs font-semibold text-[#1d4ed8]" onClick={() => onOpen("pipeline")}>
              Full walk
            </button>
          </div>
          <ol className="mt-3 flex flex-wrap gap-2">
            {pipelineRoute.map((stop) => (
              <li key={stop.id}>
                <button type="button" className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-slate-800" onClick={() => onOpen(stop.id === "studio" ? "pipeline" : stop.id)}>
                  {stop.title}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-3 font-mono text-sm">
            z=<Num value={net.z} /> · h=<Num value={net.hidden} /> · ŷ=<Num value={net.prediction} /> · L=<Num value={net.loss} />
          </p>
        </section>

        <section className={`rounded-xl bg-white p-4 shadow-sm ring-2 ${focus === "landscape" ? "ring-[#1d4ed8]" : "ring-transparent"}`}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#172554]">Landscape bowl</h3>
            <button type="button" className="text-xs font-semibold text-[#1d4ed8]" onClick={() => onOpen("landscape")}>
              Full hike
            </button>
          </div>
          <svg viewBox="0 0 320 120" className="mt-3 w-full" aria-label="Mini bowl">
            <polyline
              fill="none"
              stroke="#172554"
              strokeWidth="2"
              points={Array.from({ length: 40 }, (_, i) => {
                const x = -1 + (i / 39) * 8;
                const y = (x - 3) ** 2;
                const px = 20 + ((x + 1) / 8) * 280;
                const py = 100 - (y / 16) * 80;
                return `${px},${py}`;
              }).join(" ")}
            />
            <circle cx={20 + ((cast.weight + 1) / 8) * 280} cy={100 - (bowl / 16) * 80} r={6} fill="#1d4ed8" />
          </svg>
          <p className="mt-2 font-mono text-sm">
            w=<Num value={cast.weight} /> · η=<Num value={cast.eta} /> · L=<Num value={bowl} />
          </p>
        </section>

        <section className={`rounded-xl bg-[#0f172a] p-4 shadow-sm ring-2 ${focus === "spotlight" ? "ring-[#fbbf24]" : "ring-transparent"}`}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-blue-100">Spotlight scores</h3>
            <button type="button" className="text-xs font-semibold text-amber-300" onClick={() => onOpen("spotlight")}>
              Full stage
            </button>
          </div>
          <div className="mt-3 flex items-end gap-3">
            {probs.map((p, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-emerald-500" style={{ height: `${16 + p * 64}px`, opacity: 0.35 + p * 0.65 }} />
                <span className="font-mono text-[11px] text-slate-300">{fmt(p)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-sm text-blue-100">
            q·k=<Num value={agreement} tone="white" /> · cos=<Num value={angle} tone="white" /> · layer y=(
            <Num value={layer[0]} tone="white" />, <Num value={layer[1]} tone="white" />)
          </p>
        </section>
        </div>
      </div>

      <div className="mt-4">
        <LiveCaption symbol="Same cast">
          x=({fmt(cast.x[0])}, {fmt(cast.x[1])}, {fmt(cast.x[2])}) · scores peaking at class{" "}
          {probs.indexOf(Math.max(...probs)) + 1}. Jump to machine, twins, replay, or interview from the home strip.
        </LiveCaption>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["machine", "Matrix machine"],
          ["twins", "Twin models"],
          ["replay", "Story replay"],
          ["interview", "Interview route"],
        ].map(([id, label]) => (
          <button key={id} type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={() => onOpen(id)}>
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}
