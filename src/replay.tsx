import { useEffect, useMemo, useState } from "react";
import { backprop, gdStep, softmax } from "./math";
import {
  DEFAULT_CAST,
  FAILURE_BEATS,
  getCast,
  patchCast,
  resetCast,
  setActiveBeat,
  useFailureBeat,
  useStoryCast,
  type FailureBeatId,
  type StoryCast,
} from "./story";
import { failureBeatChapters, pipelineRoute, storyChapters } from "./storyChapters";
import { LiveCaption, LossPassport, Num, StoryStrip, fmt } from "./ui";

/** Keyframes that scrub the shared cast through a training-story arc — including failure beats. */
type Keyframe = {
  t: number;
  label: string;
  chapterId: string;
  cast: Partial<StoryCast>;
  beat: string;
  /** Named failure beat this frame activates (null clears). */
  failureBeat: FailureBeatId | null;
};

const KEYFRAMES: Keyframe[] = [
  {
    t: 0,
    label: "Meet cast",
    chapterId: "studio",
    cast: { ...DEFAULT_CAST },
    beat: "Studio knobs — x, k, weight, η, scores — before any layer runs.",
    failureBeat: null,
  },
  {
    t: 0.14,
    label: "Layer forward",
    chapterId: "linear-layer",
    cast: {},
    beat: "Same x through W and b — workers produce two outputs.",
    failureBeat: null,
  },
  {
    t: 0.28,
    label: "Blame path",
    chapterId: "chain",
    cast: { w1: 0.8, w2: 1.2 },
    beat: "Tiny net opens the gate; backprop multiplies local slopes.",
    failureBeat: null,
  },
  {
    t: 0.42,
    label: "Gate shut",
    chapterId: "chain",
    cast: { ...FAILURE_BEATS["dead-relu"].cast },
    beat: "Dead ReLU: w₁x < 0 → gate 0 → ∂L/∂w₁ = 0. Say aloud: gate shut ⇒ no blame on w₁.",
    failureBeat: "dead-relu",
  },
  {
    t: 0.56,
    label: "Softmax bets",
    chapterId: "softmax",
    cast: { scores: [2.2, 0.1, -0.4], w1: 0.8, w2: 1.2 },
    beat: "Scores sharpen into a confident class-1 bet (gate open again for the next beats).",
    failureBeat: null,
  },
  {
    t: 0.7,
    label: "Bad η",
    chapterId: "descent",
    cast: { ...FAILURE_BEATS["bad-eta"].cast, w1: 0.8, w2: 1.2 },
    beat: "η = 1.4: (1 − 2η) outside (−1, 1) — the bowl weight will fly.",
    failureBeat: "bad-eta",
  },
  {
    t: 0.86,
    label: "Honest recovery",
    chapterId: "descent",
    cast: { ...FAILURE_BEATS.honest.cast },
    beat: "Open gate + η = 0.12 — blame reaches w₁ and the bowl settles.",
    failureBeat: "honest",
  },
  {
    t: 1,
    label: "Settled",
    chapterId: "descent",
    cast: { weight: 2.85, scores: [2.4, -0.2, -0.8], w1: 1.1, w2: 0.9, eta: 0.12 },
    beat: "Same run after honest updates — loss down, probs peaked.",
    failureBeat: "honest",
  },
];

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u;
}

function lerpTriple(a: [number, number, number], b: [number, number, number], u: number): [number, number, number] {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

function frameAt(t: number): { frame: Keyframe; next: Keyframe; u: number; chapterId: string } {
  const clamped = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].t <= clamped) i += 1;
  const frame = KEYFRAMES[i];
  const next = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)];
  const span = next.t - frame.t || 1;
  const u = frame === next ? 0 : (clamped - frame.t) / span;
  return { frame, next, u, chapterId: u < 0.5 ? frame.chapterId : next.chapterId };
}

function applyScrub(t: number) {
  const { frame, next, u, chapterId } = frameAt(t);
  const base = { ...DEFAULT_CAST, ...frame.cast };
  const goal = { ...DEFAULT_CAST, ...frame.cast, ...next.cast };
  const weight = lerp(base.weight ?? DEFAULT_CAST.weight, goal.weight ?? DEFAULT_CAST.weight, u);
  const eta = lerp(base.eta ?? DEFAULT_CAST.eta, goal.eta ?? DEFAULT_CAST.eta, u);
  const scores = lerpTriple(
    (base.scores as [number, number, number]) ?? DEFAULT_CAST.scores,
    (goal.scores as [number, number, number]) ?? DEFAULT_CAST.scores,
    u,
  );
  const w1 = lerp(base.w1 ?? DEFAULT_CAST.w1, goal.w1 ?? DEFAULT_CAST.w1, u);
  const w2 = lerp(base.w2 ?? DEFAULT_CAST.w2, goal.w2 ?? DEFAULT_CAST.w2, u);
  patchCast({
    weight: Number(weight.toFixed(3)),
    eta: Number(eta.toFixed(3)),
    scores,
    w1: Number(w1.toFixed(3)),
    w2: Number(w2.toFixed(3)),
  });
  // Active beat follows the nearer keyframe so chain/interview see the named cue.
  const nearer = u < 0.5 ? frame : next;
  setActiveBeat(nearer.failureBeat);
  return chapterId;
}

export function StoryReplay({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast } = useStoryCast();
  const { beat } = useFailureBeat();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [litChapter, setLitChapter] = useState("studio");

  useEffect(() => {
    const chapterId = applyScrub(t);
    setLitChapter(chapterId);
  }, [t]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setT((prev) => {
        const next = prev + 0.012;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
    }, 50);
    return () => window.clearInterval(id);
  }, [playing]);

  const liveNet = useMemo(
    () => backprop(cast.x[0], cast.w1, cast.w2, cast.target),
    [cast.x, cast.w1, cast.w2, cast.target],
  );
  const probs = softmax(cast.scores);
  const litIndex = pipelineRoute.findIndex((c) => c.id === litChapter || (litChapter === "studio" && c.id === "studio"));
  const frame = frameAt(t).frame;

  const mapLights = useMemo(() => {
    const order = ["studio", "linear-layer", "chain", "softmax", "descent"];
    const idx = order.indexOf(litChapter);
    return order.map((id, i) => ({ id, on: i <= Math.max(0, idx) }));
  }, [litChapter]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Time scrub</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Story Replay</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Scrub one timeline across the shared cast — including an explicit gate-shut beat, bad η, and honest recovery — so Studio, #chain, and #interview walk the same failure story.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId={storyChapters[litChapter] ? litChapter : "descent"} />
        <LossPassport cast={cast} />
      </div>

      {beat ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">Active failure beat · {beat.label}</p>
          <p className="mt-1 font-semibold text-slate-900">Say aloud: {beat.sayAloud}</p>
          <p className="mt-0.5 text-xs text-slate-600">{failureBeatChapters[beat.id].blurb}</p>
          <p className="mt-1 font-mono text-xs text-slate-600">
            gate={liveNet.gate} · ∂L/∂w₁=<Num value={liveNet.dLossDw1} /> · η=<Num value={cast.eta} />
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {beat.jump.map((j) => (
              <button key={j.id} type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen(j.id)}>
                {j.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <label className="block text-sm font-semibold text-slate-800">
          Story time
          <input
            className="mt-2"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={t}
            aria-label="Story time"
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
            onClick={() => {
              setPlaying(false);
              setT(0);
              resetCast();
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
            onClick={() => patchCast({ weight: Number(gdStep(getCast().weight, getCast().eta).toFixed(3)) })}
          >
            Nudge bowl once
          </button>
          <button
            type="button"
            className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-semibold text-white"
            onClick={() => {
              setPlaying(false);
              setT(0.42);
            }}
          >
            Jump to gate shut
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Pipeline chapters</p>
        <ol className="flex min-w-max gap-2">
          {pipelineRoute.map((stop, index) => {
            const on = mapLights.find((m) => m.id === stop.id)?.on || (stop.id === "studio" && litChapter === "studio");
            const current = index === litIndex || stop.id === litChapter;
            return (
              <li key={stop.id} className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded-md px-2.5 py-1.5 text-left text-xs shadow-sm ring-1 ${current ? "bg-[#172554] text-white ring-[#172554]" : on ? "bg-blue-50 text-slate-900 ring-blue-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}
                  onClick={() => onOpen(stop.id === "studio" ? "map" : stop.id)}
                >
                  <span className="block font-mono text-[10px] opacity-70">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-semibold">{stop.title}</span>
                </button>
                {index < pipelineRoute.length - 1 ? <span className="text-slate-300">→</span> : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <LiveCaption symbol="t" value={t} digits={2}>
          {frame.beat} w=<Num value={cast.weight} /> · p₁=<Num value={probs[0]} /> · gate={liveNet.gate}.
        </LiveCaption>
        <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Keyframes</p>
          <ul className="mt-2 space-y-1">
            {KEYFRAMES.map((kf) => (
              <li key={kf.t}>
                <button type="button" className="font-semibold text-[#1d4ed8]" onClick={() => setT(kf.t)}>
                  {fmt(kf.t)} · {kf.label}
                  {kf.failureBeat ? <span className="ml-1 text-amber-800">· beat</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
