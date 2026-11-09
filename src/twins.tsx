import { useMemo, useState } from "react";
import { backprop, gdStep } from "./math";
import { useStoryCast, type StoryCast } from "./story";
import { LiveCaption, LossPassport, Num, StoryStrip, fmt } from "./ui";

type TwinKind = "untrained" | "dead-relu" | "bad-eta" | "honest";

function scenario(kind: TwinKind, cast: StoryCast): { label: string; w1: number; w2: number; eta: number; note: string } {
  switch (kind) {
    case "untrained":
      return { label: "Untrained", w1: 0.05, w2: 0.05, eta: cast.eta, note: "Tiny random-ish start — barely moves the output." };
    case "dead-relu":
      return { label: "Dead ReLU", w1: -1.2, w2: cast.w2, eta: cast.eta, note: "w₁x < 0 so the gate shuts; ∂L/∂w₁ stays 0." };
    case "bad-eta":
      return { label: "Bad η", w1: cast.w1, w2: cast.w2, eta: 1.4, note: "Learning rate far too large — steps overshoot the bowl." };
    case "honest":
      return { label: "After honest updates", w1: cast.w1, w2: cast.w2, eta: Math.min(cast.eta, 0.25), note: "Shared cast weights with a sane η." };
  }
}

function runNet(x0: number, w1: number, w2: number, target: number) {
  return backprop(x0, w1, w2, target);
}

export function TwinModels({ onOpen }: { onOpen: (id: string) => void }) {
  const { cast, patchCast, resetCast } = useStoryCast();
  const [leftKind, setLeftKind] = useState<TwinKind>("untrained");
  const [rightKind, setRightKind] = useState<TwinKind>("honest");
  const [bowlTrail, setBowlTrail] = useState<{ bad: number[]; good: number[] }>({ bad: [0.2], good: [0.2] });

  const left = scenario(leftKind, cast);
  const right = scenario(rightKind, cast);
  const leftNet = useMemo(() => runNet(cast.x[0], left.w1, left.w2, cast.target), [cast.x, cast.target, left.w1, left.w2]);
  const rightNet = useMemo(() => runNet(cast.x[0], right.w1, right.w2, cast.target), [cast.x, cast.target, right.w1, right.w2]);

  function trainHonestOnce() {
    // One GD-style update on tiny-net using analytical grads (same math as backprop)
    const n = runNet(cast.x[0], cast.w1, cast.w2, cast.target);
    const eta = Math.min(cast.eta, 0.25);
    const nextW1 = cast.w1 - eta * n.dLossDw1;
    const nextW2 = cast.w2 - eta * n.dLossDw2;
    patchCast({ w1: Number(nextW1.toFixed(3)), w2: Number(nextW2.toFixed(3)) });
    setRightKind("honest");
  }

  function compareBowlSteps() {
    let bad = 0.2;
    let good = 0.2;
    const badTrail = [bad];
    const goodTrail = [good];
    for (let i = 0; i < 8; i += 1) {
      bad = gdStep(bad, 1.4);
      good = gdStep(good, Math.min(cast.eta, 0.25));
      badTrail.push(Number(bad.toFixed(3)));
      goodTrail.push(Number(good.toFixed(3)));
    }
    setBowlTrail({ bad: badTrail, good: goodTrail });
  }

  function Panel({
    title,
    note,
    net,
    w1,
    w2,
    eta,
    tone,
  }: {
    title: string;
    note: string;
    net: ReturnType<typeof backprop>;
    w1: number;
    w2: number;
    eta: number;
    tone: "amber" | "green";
  }) {
    const border = tone === "amber" ? "ring-amber-300" : "ring-emerald-300";
    const head = tone === "amber" ? "text-amber-900" : "text-emerald-900";
    return (
      <article className={`rounded-xl bg-white p-4 shadow-sm ring-2 ${border}`}>
        <h3 className={`text-lg font-semibold ${head}`}>{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{note}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">w₁</dt>
            <dd className="font-mono">
              <Num value={w1} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">w₂</dt>
            <dd className="font-mono">
              <Num value={w2} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">η</dt>
            <dd className="font-mono">
              <Num value={eta} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">gate</dt>
            <dd className="font-mono">{net.gate ? "open" : "SHUT"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">ŷ</dt>
            <dd className="font-mono">
              <Num value={net.prediction} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">L</dt>
            <dd className="font-mono">
              <Num value={net.loss} tone={net.loss > 0.5 ? "amber" : "green"} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">∂L/∂w₁</dt>
            <dd className="font-mono">
              <Num value={net.dLossDw1} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">∂L/∂w₂</dt>
            <dd className="font-mono">
              <Num value={net.dLossDw2} />
            </dd>
          </div>
        </dl>
      </article>
    );
  }

  const kinds: TwinKind[] = ["untrained", "dead-relu", "bad-eta", "honest"];

  return (
    <main className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Innovation · Before / after</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#172554]">Twin Models</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
        Same architecture, different starting sins. Compare a broken twin to an honest update path — dead gates, wild η, or a quiet start.
      </p>
      <div className="mt-3 space-y-2">
        <StoryStrip lessonId="chain" />
        <LossPassport cast={cast} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-semibold text-slate-700">Left twin</span>
          <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5" value={leftKind} onChange={(e) => setLeftKind(e.target.value as TwinKind)}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {scenario(k, cast).label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold text-slate-700">Right twin</span>
          <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5" value={rightKind} onChange={(e) => setRightKind(e.target.value as TwinKind)}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {scenario(k, cast).label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title={left.label} note={left.note} net={leftNet} w1={left.w1} w2={left.w2} eta={left.eta} tone="amber" />
        <Panel title={right.label} note={right.note} net={rightNet} w1={right.w1} w2={right.w2} eta={right.eta} tone="green" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white" onClick={trainHonestOnce}>
          Honest update on cast (w₁, w₂)
        </button>
        <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={compareBowlSteps}>
          Compare bowl trails (bad η vs honest)
        </button>
        <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" onClick={resetCast}>
          Reset cast
        </button>
      </div>

      {bowlTrail.bad.length > 1 ? (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Bowl weight trails (Studio L(w)=(w−3)²)</p>
          <p className="mt-2 font-mono text-xs text-amber-800">bad η: {bowlTrail.bad.map((w) => fmt(w)).join(" → ")}</p>
          <p className="mt-1 font-mono text-xs text-emerald-800">honest: {bowlTrail.good.map((w) => fmt(w)).join(" → ")}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <LiveCaption symbol="ΔL" value={leftNet.loss - rightNet.loss}>
          Left loss {fmt(leftNet.loss)} vs right {fmt(rightNet.loss)}.
        </LiveCaption>
        <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson links</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {[
              ["chain", "Chain / backprop"],
              ["descent", "Descent / η"],
              ["curvature", "Curvature"],
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
