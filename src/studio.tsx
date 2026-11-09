import { useEffect, useState } from "react";
import { cosine, dot, gdStep, norm, softmax } from "./math";
import { Bars, Curve, VectorPlane } from "./plots";
import { Scalar, fmt } from "./ui";

export function Studio({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState({ x: 1.4, y: 0.4 });
  const [key, setKey] = useState({ x: 0.5, y: 1.3 });
  const [weight, setWeight] = useState(0.2);
  const [eta, setEta] = useState(0.12);
  const [playing, setPlaying] = useState(false);
  const [scores, setScores] = useState([1.1, 0.2, -0.7]);
  const agreement = dot([query.x, query.y], [key.x, key.y]);
  const angle = cosine([query.x, query.y], [key.x, key.y]);
  const loss = (weight - 3) ** 2;
  const probs = softmax(scores);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setWeight((current) => Number(gdStep(current, eta).toFixed(3)));
    }, 70);
    return () => window.clearInterval(id);
  }, [playing, eta]);

  useEffect(() => {
    if (playing && (Math.abs(weight - 3) < 0.02 || Math.abs(weight) > 14)) setPlaying(false);
  }, [weight, playing]);

  function dragArrow(label: string, x: number, y: number) {
    const point = { x: Math.min(2.6, Math.max(-2.6, x)), y: Math.min(2.6, Math.max(-2.6, y)) };
    if (label === "q") setQuery(point);
    if (label === "k") setKey(point);
  }

  function setScore(index: number, value: number) {
    setScores((current) => current.map((score, item) => (item === index ? value : score)));
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Move a number and watch the formula</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Drag inside each picture. The readout is the same arithmetic the lessons write out. Nothing here is a separate demo: each panel opens the field that explains it.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="rounded-lg bg-slate-50 p-3">
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
          <p className="mt-2 font-mono text-sm">
            {fmt(query.x)}×{fmt(key.x)} + {fmt(query.y)}×{fmt(key.y)} = <strong>{fmt(agreement)}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Cosine {fmt(angle)}. Lengths {fmt(norm([query.x, query.y]))} and {fmt(norm([key.x, key.y]))}.
            {agreement < 0 ? " They fight." : " They agree."}
          </p>
          <button type="button" className="mt-2 text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("dot")}>
            Open the dot product
          </button>
        </article>

        <article className="rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">One weight on a bowl</h3>
          <p className="mt-1 text-sm text-slate-700">A training step walks the weight against the slope, toward the bottom at 3.</p>
          <p className="mt-2 font-mono text-sm">
            L({fmt(weight)}) = ({fmt(weight)} − 3)² = <strong>{fmt(loss)}</strong>
          </p>
          <Curve f={(value) => (value - 3) ** 2} xMin={-1} xMax={7} marker={Math.min(7, Math.max(-1, weight))} onScrub={(value) => { setPlaying(false); setWeight(Number(value.toFixed(2))); }} />
          <Scalar label="η, learning rate" value={eta} onChange={setEta} min={0.02} max={1.2} step={0.02} />
          <div className="mt-2 flex gap-2">
            <button type="button" className="rounded-md bg-[#172554] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => setPlaying((value) => !value)}>
              {playing ? "Stop" : "Train"}
            </button>
            <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold" onClick={() => { setPlaying(false); setWeight(0.2); }}>
              Reset
            </button>
          </div>
          <button type="button" className="mt-2 block text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("descent")}>
            Open gradient descent
          </button>
        </article>

        <article className="rounded-lg bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">Three scores, one probability</h3>
          <p className="mt-1 text-sm text-slate-700">Softmax turns scores into positive numbers that add to 1.</p>
          <div className="mt-3 space-y-2">
            {scores.map((score, index) => (
              <Scalar key={index} label={`score ${index + 1}`} value={score} onChange={(value) => setScore(index, value)} min={-2} max={4} step={0.1} />
            ))}
          </div>
          <div className="mt-3">
            <Bars values={probs} labels={["class 1", "class 2", "class 3"]} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Tallest class holds {fmt(Math.max(...probs) * 100, 0)}% of the probability.
          </p>
          <button type="button" className="mt-2 text-sm font-semibold text-[#1d4ed8]" onClick={() => onOpen("softmax")}>
            Open softmax
          </button>
        </article>
      </div>
    </section>
  );
}
