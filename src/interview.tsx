import { useMemo, useState } from "react";
import { lessons } from "./curriculum";
import { backprop } from "./math";
import { layerInputBlame, layerUpstreamG, useFailureBeat, useStoryCast } from "./story";
import { failureBeatChapters, stationChapters } from "./storyChapters";
import { surfaceById } from "./surfaces";
import { LiveCaption, LossPassport, Num, fmt } from "./ui";

export type InterviewRoute = {
  id: string;
  ask: string;
  why: string;
  /** Ordered station ids to walk aloud. */
  stations: string[];
};

/** Curated whiteboard asks — each is a short route through existing stations (no new math). */
export const INTERVIEW_ROUTES: InterviewRoute[] = [
  {
    id: "attn-scale",
    ask: "Why is the attention score q · k / √d, not the raw dot?",
    why: "Say length vs angle, then how softmax only sees differences that grow like √d.",
    stations: ["vectors", "dot", "norm", "softmax"],
  },
  {
    id: "wxb",
    ask: "Walk through y = Wx + b for two outputs and three inputs.",
    why: "Name shapes, then one row · x per output, then add bias.",
    stations: ["vectors", "dot", "linear-layer", "multiply"],
  },
  {
    id: "qkt",
    ask: "Q is 3×2 and K is 3×2. What is the shape of QKᵀ, and what does one entry mean?",
    why: "Transpose keys, multiply, read one cell as a dot product score.",
    stations: ["transpose", "multiply", "dot", "softmax"],
  },
  {
    id: "one-step",
    ask: "Take one gradient step on a bowl. What does η do?",
    why: "Loss as a function → slope → step against the gradient.",
    stations: ["function", "slope", "derivative", "descent"],
  },
  {
    id: "backprop",
    ask: "Read the Loss Passport — L, ŷ, gate (h>0 / shut), ∂L/∂w₁, ∂L/∂w₂ — then say how blame reaches w₁ in x → w₁ → ReLU → w₂ → (ŷ−t)².",
    why: "Say each passport field aloud. Forward values, then multiply local derivatives; when gate is shut, ∂L/∂w₁ = 0 (no blame on w₁).",
    stations: ["chain", "rules", "partials", "jacobian"],
  },
  {
    id: "curvature-eta",
    ask: "When is a learning rate too large for a quadratic bowl?",
    why: "Relate second derivative / curvature to the stable step limit. Failure beat: bad η makes distance to 3 grow.",
    stations: ["descent", "curvature", "quadratic", "partials"],
  },
  {
    id: "forward-flip",
    ask: "Forward uses W, blame uses Wᵀ — same entries. Walk the dual on one cast.",
    why: "Say aloud: forward W, blame Wᵀ — same entries. Machine rows → transpose columns → jacobian Σᵢ gᵢ Wᵢⱼ = (Wᵀg)ⱼ.",
    stations: ["machine", "transpose", "jacobian"],
  },
];

export function InterviewMode({ onOpen }: { onOpen: (id: string) => void }) {
  const [routeId, setRouteId] = useState(INTERVIEW_ROUTES[0].id);
  const [stop, setStop] = useState(0);
  const { cast } = useStoryCast();
  const { beat, applyFailureBeat: applyBeat } = useFailureBeat();
  const route = INTERVIEW_ROUTES.find((r) => r.id === routeId) ?? INTERVIEW_ROUTES[0];
  const stations = route.stations;
  const currentId = stations[Math.min(stop, stations.length - 1)];
  const meta = lessons.find((l) => l.id === currentId);
  const surface = surfaceById(currentId);
  const station = stationChapters[currentId];
  const stopTitle = meta?.field ?? station?.title ?? surface?.title ?? currentId;
  const stopSkill = meta?.skill ?? station?.blurb ?? surface?.blurb ?? "";
  const showBackpropBeat = routeId === "backprop";
  const showEtaBeat = routeId === "curvature-eta";
  const showForwardFlip = routeId === "forward-flip";
  const net = showBackpropBeat ? backprop(cast.x[0], cast.w1, cast.w2, cast.target) : null;
  const flipG = showForwardFlip ? layerUpstreamG(cast) : null;
  const flipBlame = showForwardFlip ? layerInputBlame(cast) : null;

  const steps = useMemo(
    () =>
      stations.map((id) => {
        const lesson = lessons.find((l) => l.id === id);
        const surf = surfaceById(id);
        const chap = stationChapters[id];
        return {
          id,
          field: lesson?.field ?? chap?.title ?? surf?.title ?? id,
          title: lesson?.title ?? chap?.title ?? surf?.title ?? id,
        };
      }),
    [stations],
  );

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Interview UX</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Interview Route</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Pick one whiteboard ask. Walk only the stations you need — say the skill aloud at each stop, then open the lab if you stall.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Choose an ask</p>
          <ul className="mt-2 space-y-2">
            {INTERVIEW_ROUTES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${routeId === r.id ? "bg-[#172554] text-white" : "bg-slate-50 text-slate-800 ring-1 ring-slate-200"}`}
                  onClick={() => {
                    setRouteId(r.id);
                    setStop(0);
                  }}
                >
                  {r.ask}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <blockquote className="rounded-xl border-l-4 border-[#b45309] bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Say this aloud</p>
            <p className="mt-1 text-slate-900">{route.ask}</p>
            <p className="mt-2 text-sm text-slate-600">{route.why}</p>
          </blockquote>

          {showForwardFlip && flipG && flipBlame ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Forward-then-flip dual</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Say aloud: forward W, blame Wᵀ — same entries.</p>
              <p className="mt-1 font-mono text-xs text-slate-700">
                g=({fmt(flipG[0])}, {fmt(flipG[1])}) · Wᵀg=({fmt(flipBlame[0])}, {fmt(flipBlame[1])}, {fmt(flipBlame[2])})
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Walk #machine forward → transpose blame (column·g) → #jacobian Σᵢ gᵢ Wᵢⱼ. Same cast W; Reset restores DEFAULT_CAST.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => onOpen("machine")}>
                  Open #machine
                </button>
                <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={() => onOpen("transpose")}>
                  Open #transpose
                </button>
                <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={() => onOpen("jacobian")}>
                  Open #jacobian
                </button>
              </div>
            </div>
          ) : null}

          {showBackpropBeat || showEtaBeat ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
                Failure beat{beat ? ` · ${beat.label}` : ""}
              </p>
              {showBackpropBeat ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Say aloud: L, ŷ, gate, ∂L/∂w₁, ∂L/∂w₂ — then gate shut ⇒ no blame on w₁
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {beat?.id === "dead-relu"
                      ? failureBeatChapters["dead-relu"].blurb
                      : "Trigger the Gate shut beat to write w₁x < 0 into the cast; passport ∂L/∂w₁ goes to 0 on every training surface."}
                  </p>
                  <div className="mt-2">
                    <LossPassport cast={cast} />
                  </div>
                  {net ? (
                    <p className="mt-1 font-mono text-xs text-slate-600">
                      z=<Num value={net.z} /> · gate={net.gate ? "h>0" : "shut"} · ∂L/∂w₁=<Num value={net.dLossDw1} />
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() => applyBeat("dead-relu")}
                    >
                      Trigger gate shut
                    </button>
                    <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={() => onOpen("pipeline")}>
                      Jump to #pipeline
                    </button>
                    <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={() => onOpen("twins")}>
                      Jump to #twins
                    </button>
                    <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("chain")}>
                      Open #chain
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Say aloud: η too large ⇒ distance to 3 grows each step</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {beat?.id === "bad-eta"
                      ? failureBeatChapters["bad-eta"].blurb
                      : "Trigger Bad η to set η = 1.4 on the shared cast, then open #descent or #twins."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() => applyBeat("bad-eta")}
                    >
                      Trigger bad η
                    </button>
                    <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={() => onOpen("twins")}>
                      Jump to #twins
                    </button>
                    <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={() => onOpen("pipeline")}>
                      Jump to #pipeline
                    </button>
                    <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("descent")}>
                      Open #descent
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
            <ol className="flex min-w-max items-center gap-2">
              {steps.map((s, i) => {
                const done = i < stop;
                const here = i === stop;
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-2 text-left text-xs ${here ? "bg-[#1d4ed8] text-white" : done ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}
                      onClick={() => setStop(i)}
                    >
                      <span className="block font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-semibold">{s.field}</span>
                    </button>
                    {i < steps.length - 1 ? <span className="text-slate-300">→</span> : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Stop {stop + 1} of {stations.length}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{stopTitle}</h3>
            <p className="mt-1 text-sm text-slate-700">{stopSkill}</p>
            {meta?.formula ? <p className="mt-2 font-serif text-slate-900">{meta.formula}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
                disabled={stop <= 0}
                onClick={() => setStop((s) => Math.max(0, s - 1))}
              >
                Prev stop
              </button>
              <button
                type="button"
                className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                disabled={stop >= stations.length - 1}
                onClick={() => setStop((s) => Math.min(stations.length - 1, s + 1))}
              >
                Next stop
              </button>
              <button type="button" className="rounded-md bg-[#1d4ed8] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => onOpen(currentId)}>
                Open lab
              </button>
            </div>
          </div>

          <LiveCaption symbol="Route">
            {stations.length} stations — no new formulas, only the path to answer this ask.
          </LiveCaption>
        </div>
      </div>
    </main>
  );
}
