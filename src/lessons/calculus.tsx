import { useEffect, useState } from "react";
import { backprop, diffQuotient, gdStep, newtonStep, softmaxLossGrad, stableStepLimit, transpose } from "../math";
import { Bars, Curve, Heatmap } from "../plots";
import { getCast, layerInputBlame, layerUpstreamG, openStoryHash, useFailureBeat, useStoryCast } from "../story";
import { failureBeatChapters } from "../storyChapters";
import { Board, Chain, Frame, Frac, Goal, LiveCaption, LossPassport, MatrixCells, Num, Prose, Scalar, Section, StepControls, StoryStrip, VectorEditor, fmt } from "../ui";

function symbols(items: [string, string][]) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map(([symbol, meaning]) => (
        <li key={symbol} className="flex gap-3 rounded-md bg-white px-3 py-2">
          <span className="font-serif text-lg text-slate-900">{symbol}</span>
          <span className="text-sm leading-snug text-slate-600">{meaning}</span>
        </li>
      ))}
    </ul>
  );
}

export function FunctionLesson() {
  const [weight, setWeight] = useState(0.5);
  const loss = (value: number) => (value - 3) ** 2;
  const prediction = weight;
  const error = prediction - 3;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          A function is a rule that turns an input into an output. Training watches one particular function, the loss. Its input is a weight. Its output is one number, large when the prediction misses the target. Here the model is as small as a model can be: the weight is the prediction. The target is 3. Later lessons put a real input back in front of the weight. The calculus is the same.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>L(w) = (w − 3)²</span>
        </Board>
        <Prose>Square the miss so a prediction of 1 and a prediction of 5 are equally bad, and so the loss is never negative. The 3 is data. It stays still while you change w.</Prose>
        {symbols([
          ["w", "the weight, the only number you may change"],
          ["3", "the target, fixed for this example"],
          ["L(w)", "how bad this weight is"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <Scalar label="w, the weight and the prediction" value={weight} onChange={setWeight} min={-1} max={7} step={0.1} />
        <p className="text-sm text-slate-700">
          Prediction = <Num value={prediction} tone="blue" />. Error = <Num value={prediction} /> − 3 = <Num value={error} tone="amber" />. Loss = (<Num value={error} />)² = <Num value={loss(weight)} tone="green" />.
        </p>
        <Curve f={loss} xMin={-1} xMax={7} marker={weight} onScrub={setWeight} />
        <p className="text-xs text-slate-500">The dot is the current weight. The curve is every loss you could have picked.</p>
        <Goal met={Math.abs(weight - 3) < 0.05}>Set the weight to 3. The error is zero, so the square is zero. You can see the bottom. A training loop is not allowed to look at this picture. It only gets a slope.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          A real loss is the same kind of rule with more inputs: every weight, and a batch of examples. Squared error, cross-entropy, and a custom research loss are all functions from those inputs to one number. Algebra builds the prediction. Calculus tells you which way to nudge the weights so the number goes down. The next lesson is the nudge, measured between two weights.
        </Prose>
      </Section>
    </Frame>
  );
}

export function SlopeLesson() {
  const [x1, setX1] = useState(0);
  const [y1, setY1] = useState(1);
  const [x2, setX2] = useState(2);
  const [y2, setY2] = useState(5);
  const [weight, setWeight] = useState(1);
  const [run, setRun] = useState(0.5);
  const rise = y2 - y1;
  const span = x2 - x1;
  const slope = span === 0 ? Number.NaN : rise / span;
  const loss = (value: number) => (value - 3) ** 2;
  const localRise = loss(weight + run) - loss(weight);
  const localSlope = run === 0 ? Number.NaN : localRise / run;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          Slope is rise over run. Pick two points. Subtract the inputs. Subtract the outputs. Divide. A positive slope means the output grows as the input grows. On a curve, two points that are far apart measure a shortcut across the bend. Two points that are close measure the curve itself.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>
            m = <Frac num="y₂ − y₁" den="x₂ − x₁" />
          </span>
        </Board>
        <Prose>The denominator is how far you moved the input. The numerator is how far the output moved in response. If the denominator is zero you did not move, and there is no slope to measure.</Prose>
        {symbols([
          ["m", "the slope, one number"],
          ["y₂ − y₁", "the rise"],
          ["x₂ − x₁", "the run"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Scalar label="x₁" value={x1} onChange={setX1} min={-2} max={4} />
          <Scalar label="y₁" value={y1} onChange={setY1} min={-2} max={8} />
          <Scalar label="x₂" value={x2} onChange={setX2} min={-2} max={6} />
          <Scalar label="y₂" value={y2} onChange={setY2} min={-2} max={8} />
        </div>
        <p className="text-sm text-slate-700">
          Rise = <Num value={y2} /> − <Num value={y1} /> = <Num value={rise} />. Run = <Num value={x2} /> − <Num value={x1} /> = <Num value={span} />.
          {span === 0 ? " The run is zero, so this pair of points does not define a slope." : <> Slope = <Num value={rise} /> / <Num value={span} /> = <Num value={slope} tone="green" />.</>}
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold">The same measurement on the loss</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Scalar label="Start at weight w" value={weight} onChange={setWeight} min={-1} max={6} />
            <Scalar label="Run h" value={run} onChange={setRun} min={-1} max={1} step={0.1} />
          </div>
          <p className="mt-2 text-sm text-slate-700">
            L({fmt(weight)}) = <Num value={loss(weight)} />. L({fmt(weight + run)}) = <Num value={loss(weight + run)} />. Rise = <Num value={localRise} />.
            {run === 0 ? " Run is 0, so do not divide." : <> Slope of this shortcut = <Num value={localRise} /> / <Num value={run} /> = <Num value={localSlope} tone="green" />.</>}
            {Number.isFinite(localSlope) && localSlope < 0 ? " Negative means the loss fell. That nudge helped." : ""}
            {Number.isFinite(localSlope) && localSlope > 0 ? " Positive means the loss rose. That nudge hurt." : ""}
          </p>
          <Curve f={loss} xMin={-1} xMax={7} marker={weight} chord={run === 0 ? undefined : { x0: weight, x1: weight + run }} onScrub={setWeight} />
          <p className="mt-1 text-xs text-slate-500">Amber is the shortcut between the two weights. It cuts across the bend whenever the run is large.</p>
        </div>
        <Goal met={Number.isFinite(localSlope) && localSlope < 0 && weight < 3}>Stand to the left of 3 and pick a positive run. The shortcut slopes down, toward the bottom of the bowl.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          “If I nudge this weight by 0.01, what happens to the loss?” is a slope question. The rise is the change in loss. The run is 0.01. Divide. The derivative is that question asked with a run so small that the shortcut and the curve agree. The next lesson shrinks the run and watches the extra bend disappear.
        </Prose>
      </Section>
    </Frame>
  );
}

export function DerivativeLesson() {
  const [x, setX] = useState(2);
  const [h, setH] = useState(0.5);
  const [weight, setWeight] = useState(1);
  const square = (value: number) => value * value;
  const loss = (value: number) => (value - 3) ** 2;
  const expanded = x * x + 2 * x * h + h * h;
  const quotient = h === 0 ? Number.NaN : (expanded - x * x) / h;
  const identity = h === 0 ? null : loss(weight + h) - loss(weight);
  const lossSlope = h === 0 ? Number.NaN : diffQuotient(loss, weight, h);
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          The difference quotient is the slope of the shortcut from x to x + h. The derivative is the number that quotient approaches as h approaches 0. It is not the fraction at h = 0. That fraction has a zero denominator. For x² the approach is exact and visible: the quotient equals 2x + h, so the leftover is h itself, and it dies as h shrinks.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>
            f′(x) = limₕ→₀ <Frac num="f(x+h) − f(x)" den="h" />
          </span>
        </Board>
        <Prose>For f(x) = x², expand (x + h)² = x² + 2xh + h². Subtract f(x) = x². The x² cancels. Divide the rest by h and you get 2x + h. Let h go to 0 and the derivative is 2x.</Prose>
        {symbols([
          ["h", "the run. A real step, then we shrink it."],
          ["f′(x)", "the slope left after h is gone"],
          ["2x + h", "the exact quotient for x², leftover included"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 sm:grid-cols-2">
          <Scalar label="x" value={x} onChange={setX} min={-2} max={4} />
          <Scalar label="h, the run" value={h} onChange={setH} min={0} max={1} step={0.01} note="Slide toward 0. At 0 the definition refuses to divide." />
        </div>
        <div className="rounded-lg bg-white p-3 font-mono text-sm leading-7">
          <p>(x + h)² = x² + 2xh + h²</p>
          <p>
            = <Num value={x * x} /> + <Num value={2 * x * h} /> + <Num value={h * h} /> = <Num value={expanded} tone="green" />
          </p>
          <p>
            rise = that − x² = <Num value={expanded} /> − <Num value={x * x} /> = <Num value={expanded - x * x} />
          </p>
          {h === 0 ? (
            <p>h is 0. Rise over run would be {fmt(expanded - x * x)} / 0. That is not the derivative. The derivative is the value this ratio approaches.</p>
          ) : (
            <p>
              rise / h = <Num value={expanded - x * x} /> / <Num value={h} /> = <Num value={quotient} digits={4} />. And 2x + h = <Num value={2 * x} /> + <Num value={h} /> = <Num value={2 * x + h} digits={4} tone="green" />. Same number. The true slope 2x is <Num value={2 * x} />. The extra <Num value={h} /> is the leftover.
            </p>
          )}
        </div>
        <Curve f={square} xMin={-2} xMax={4} marker={x} tangent={h === 0 ? undefined : { x, slope: 2 * x }} chord={h === 0 ? undefined : { x0: x, x1: x + h }} onScrub={setX} />
        <p className="text-xs text-slate-500">Green is the true tangent, slope 2x. Amber is the shortcut out to x + h.</p>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold">The same cancellation on the loss</p>
          <Scalar label="w on L(w) = (w − 3)²" value={weight} onChange={setWeight} min={-1} max={6} />
          {identity === null ? (
            <p className="mt-2 text-sm">Pick a nonzero h above. The loss uses that same run.</p>
          ) : (
            <p className="mt-2 text-sm text-slate-700">
              Let e = w − 3 = <Num value={weight - 3} />. The quotient is 2e + h = <Num value={2 * (weight - 3)} /> + <Num value={h} /> = <Num value={2 * (weight - 3) + h} digits={4} />. Measured directly it is <Num value={lossSlope} digits={4} tone="green" />. Shrink h and both sit on the derivative 2(w − 3) = <Num value={2 * (weight - 3)} />.
            </p>
          )}
        </div>
        <Goal met={h > 0 && h <= 0.05 && Math.abs(quotient - 2 * x) <= 0.05}>Shrink h to 0.05 or below. The quotient and 2x now agree to two decimals. That agreement is the derivative.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          Automatic differentiation does not pick a tiny h and subtract. It applies the shortcut rules from the next lesson, which were proved by doing this limit once. When you read f′(w) in a paper, it means this slope. For the squared loss it is 2(w − 3). Gradient descent multiplies that slope by a learning rate and steps the other way.
        </Prose>
      </Section>
    </Frame>
  );
}

export function RulesLesson() {
  const [x, setX] = useState(1);
  const [h, setH] = useState(0.001);
  const power = (value: number) => 3 * value * value + 2 * value;
  const chain = (value: number) => (3 * value + 1) ** 2;
  const powerRule = 6 * x + 2;
  const chainRule = 2 * (3 * x + 1) * 3;
  const powerGap = h === 0 ? Number.NaN : diffQuotient(power, x, h) - powerRule;
  const chainGap = h === 0 ? Number.NaN : diffQuotient(chain, x, h) - chainRule;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          You do not want to expand a limit for every layer. Three shortcuts cover a linear layer and a square. The power rule differentiates xⁿ. The sum rule differentiates a sum by differentiating each piece, and a constant multiple comes along. The chain rule differentiates an outer function of an inner function by multiplying their slopes. A rule is correct when it matches the difference quotient.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>d/dx (xⁿ) = n xⁿ⁻¹</span>
        </Board>
        <Board>
          <span>(f + g)′ = f′ + g′</span>
          <span className="px-2 text-slate-400">and</span>
          <span>(f ∘ g)′(x) = f′(g(x)) · g′(x)</span>
        </Board>
        <Prose>Chain rule, in words: how fast the outside changes at the inside’s current value, times how fast the inside changes at x. For (3x + 1)² the outside is (something)², whose slope is 2 × something. The inside is 3x + 1, whose slope is 3.</Prose>
        {symbols([
          ["n xⁿ⁻¹", "bring down the power, then reduce it by one"],
          ["f′(g(x))", "outer slope, evaluated at the inner value"],
          ["g′(x)", "inner slope, evaluated at x"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 sm:grid-cols-2">
          <Scalar label="x" value={x} onChange={setX} min={-2} max={3} />
          <Scalar label="h for the check against the definition" value={h} onChange={setH} min={0} max={0.5} step={0.001} />
        </div>
        <div className="rounded-lg bg-white p-3 text-sm leading-relaxed text-slate-700">
          <p className="font-semibold">Sum and power: f(x) = 3x² + 2x</p>
          <p>
            Derivative of 3x² is 3 × 2x = 6x = <Num value={6 * x} />. Derivative of 2x is 2. Add them: <Num value={6 * x} /> + 2 = <Num value={powerRule} tone="green" />.
            {h === 0 ? " Set h above 0 to check it." : <> The limit quotient is <Num value={diffQuotient(power, x, h)} digits={4} />. They differ by <Num value={powerGap} digits={4} />.</>}
          </p>
        </div>
        <div className="rounded-lg bg-white p-3 text-sm leading-relaxed text-slate-700">
          <p className="font-semibold">Chain: (3x + 1)²</p>
          <p>
            Inner value g(x) = 3×<Num value={x} /> + 1 = <Num value={3 * x + 1} />. Outer slope at that value = 2 × <Num value={3 * x + 1} /> = <Num value={2 * (3 * x + 1)} />. Inner slope = 3. Multiply: <Num value={2 * (3 * x + 1)} /> × 3 = <Num value={chainRule} tone="green" />.
            {h === 0 ? "" : <> The limit quotient is <Num value={diffQuotient(chain, x, h)} digits={4} />. Gap <Num value={chainGap} digits={4} />.</>}
          </p>
        </div>
        <Goal met={h > 0 && h <= 0.01 && Math.abs(chainGap) < 0.05 && Math.abs(powerGap) < 0.05}>
          Set h to 0.01 or smaller. Both rules agree with the definition. The gap that remains is the same kind of leftover h you saw for x².
        </Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          A linear layer is sums and products of the input with constants (the weights). A square loss around it is a chain: the square is outside, the layer is inside. Backprop is this chain rule written from the outside inward, so each layer can reuse the slope the next layer already computed. The network lesson multiplies four of those slopes with these same numbers in view.
        </Prose>
      </Section>
    </Frame>
  );
}

export function PartialsLesson() {
  const x1 = 1;
  const x2 = 2;
  const target = 5;
  const [weights, setWeights] = useState([0.4, 1.2]);
  const prediction = weights[0] * x1 + weights[1] * x2;
  const error = prediction - target;
  const loss = error * error;
  const dPrediction = 2 * error;
  const dW1 = dPrediction * x1;
  const dW2 = dPrediction * x2;
  const h = 0.0001;
  const numeric1 = (((weights[0] + h) * x1 + weights[1] * x2 - target) ** 2 - loss) / h;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          A partial derivative moves one input and holds the others still. The loss here depends on two weights. ∂L/∂w₁ is the ordinary derivative while w₂ is a constant. The gradient is the vector of every partial. It points toward increase. Its first entry says how much w₁ is to blame. Its second entry does the same for w₂.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>∇L = (∂L/∂w₁, ∂L/∂w₂)</span>
        </Board>
        <Prose>
          ŷ = w₁ x₁ + w₂ x₂, and L = (ŷ − t)². By the chain rule, ∂L/∂w₁ = ∂L/∂ŷ · ∂ŷ/∂w₁ = 2(ŷ − t) · x₁. The data x₁ is the inner slope. The miss supplies the outer slope. w₂ does not appear in ∂ŷ/∂w₁, because it was held still.
        </Prose>
        {symbols([
          ["∂", "a derivative that admits other inputs exist and freezes them"],
          ["∇L", "all the partials, packed as a vector"],
          ["x₁", "how much neuron input 1 moves the prediction. Here it is 1."],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <p className="text-sm text-slate-700">
          Fixed data: x = ({x1}, {x2}), target t = {target}. You only move the weights.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Scalar label="w₁" value={weights[0]} onChange={(value) => setWeights([value, weights[1]])} min={-2} max={6} />
          <Scalar label="w₂" value={weights[1]} onChange={(value) => setWeights([weights[0], value])} min={-2} max={4} />
        </div>
        <p className="text-sm text-slate-700">
          ŷ = <Num value={weights[0]} tone="blue" />×{x1} + <Num value={weights[1]} tone="amber" />×{x2} = <Num value={prediction} />. Error = <Num value={prediction} /> − {target} = <Num value={error} />. Loss = <Num value={loss} tone="green" />.
        </p>
        <p className="text-sm text-slate-700">
          ∂L/∂ŷ = 2 × error = <Num value={dPrediction} />. Then ∂L/∂w₁ = <Num value={dPrediction} /> × x₁ = <Num value={dPrediction} /> × {x1} = <Num value={dW1} tone="green" />. ∂L/∂w₂ = <Num value={dPrediction} /> × {x2} = <Num value={dW2} tone="green" />.
          {error < 0 ? " The prediction is short of the target, so both partials are negative: the uphill direction makes the weights smaller and the miss worse." : ""}
          {error > 0 ? " The prediction overshoots the target, so the partials are positive: uphill means making the weights larger." : ""}
        </p>
        <p className="text-sm text-slate-700">
          Check against the definition, nudging only w₁ by 0.0001: the quotient is <Num value={numeric1} digits={4} />. The partial says <Num value={dW1} digits={4} />.
        </p>
        <LiveCaption symbol="∇L">
          Uphill arrow: follow the partials (∂L/∂w₁, ∂L/∂w₂) = ({fmt(dW1)}, {fmt(dW2)}). Training step: the opposite, ({fmt(-dW1)}, {fmt(-dW2)}).
        </LiveCaption>
        <Heatmap
          f={(w1, w2) => (w1 * x1 + w2 * x2 - target) ** 2}
          x={weights[0]}
          y={weights[1]}
          xMin={-2}
          xMax={6}
          yMin={-1}
          yMax={4}
          onPick={(w1, w2) => setWeights([Number(w1.toFixed(2)), Number(w2.toFixed(2))])}
          gradient={{ dx: dW1, dy: dW2 }}
          showUphill
          caption="Horizontal is w₁, vertical is w₂. Pale is a small loss. The navy arrow is uphill ∇L. Drag across the picture; the pale band is every pair with w₁ + 2 w₂ = 5."
        />
        <Goal met={Math.abs(dW1) < 0.05 && Math.abs(dW2) < 0.05}>Find a point on the pale band. Both partials go to zero together. Any weight pair with w₁ + 2 w₂ = 5 is a minimum, because the two inputs are redundant. That is the rank fact, showing up in a loss.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          The gradient of a real network is this object with one entry per weight. Entry 40,000 says how the loss responds if weight 40,000 moves and nothing else does. Optimizers never form that vector by nudging each weight. They form it with the chain rule, one layer at a time. The arrow you would draw on this heatmap points uphill. Training steps the opposite way. That step is the next lesson, first with one weight so the arithmetic stays short.
        </Prose>
      </Section>
    </Frame>
  );
}

export function DescentLesson() {
  const { cast, patchCast } = useStoryCast();
  const { beat, applyFailureBeat } = useFailureBeat();
  const weight = cast.weight;
  const eta = cast.eta;
  const [playing, setPlaying] = useState(false);
  const [trail, setTrail] = useState<number[]>(() => [getCast().weight]);
  const [stepNote, setStepNote] = useState("Scrub the bowl or press Play. Each update multiplies the distance to 3 by (1 − 2η).");
  const loss = (value: number) => (value - 3) ** 2;
  const slope = 2 * (weight - 3);
  const proposed = weight - eta * slope;
  const factor = 1 - 2 * eta;
  const distance = weight - 3;
  const escaped = Math.abs(weight - 3) > 8;
  const flies = Math.abs(factor) > 1 + 1e-9;
  const mirrors = Math.abs(factor + 1) <= 1e-9;
  const stays = Math.abs(factor - 1) <= 1e-9;
  const fate = flies
    ? "It is not between −1 and 1, so the distance grows and the weight will fly off."
    : mirrors
      ? "It is −1, so the distance stays the same and the weight mirrors across 3."
      : stays
        ? "It is 1, so the distance to 3 does not change."
        : "It sits between −1 and 1, so the distance shrinks toward 3.";
  const descentBeat = beat?.id === "bad-eta" || beat?.id === "honest" ? beat : null;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const live = getCast();
      const next = gdStep(live.weight, live.eta);
      const nextFactor = 1 - 2 * live.eta;
      setStepNote(
        `One step: w went from ${fmt(live.weight)} to ${fmt(next)}. Distance ${fmt(live.weight - 3)} × (${fmt(nextFactor)}) → ${fmt(next - 3)}.`,
      );
      patchCast({ weight: next });
    }, 450);
    return () => window.clearInterval(id);
  }, [playing, eta]);

  useEffect(() => {
    setTrail((history) => (history[history.length - 1] === weight ? history : [...history.slice(-24), weight]));
    if (playing && Math.abs(weight - 3) > 20) setPlaying(false);
  }, [weight, playing]);

  function step() {
    setPlaying(false);
    setStepNote(
      `One step: w went from ${fmt(weight)} to ${fmt(proposed)}. Distance ${fmt(distance)} × (${fmt(factor)}) → ${fmt(proposed - 3)}.`,
    );
    patchCast({ weight: proposed });
    setTrail((history) => [...history.slice(-24), proposed]);
  }

  return (
    <Frame>
      <StoryStrip lessonId="descent" />
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
          Failure beat{descentBeat ? ` · ${descentBeat.label}` : ""}
        </p>
        <p className="mt-1 font-semibold text-slate-900">
          Say aloud: {descentBeat?.sayAloud ?? "η too large ⇒ distance to 3 grows each step"}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          {descentBeat ? failureBeatChapters[descentBeat.id].blurb : failureBeatChapters["bad-eta"].blurb}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-semibold text-white"
            onClick={() => {
              setPlaying(false);
              applyFailureBeat("bad-eta");
              setTrail([0.2]);
              setStepNote("Bad η beat: η = 1.4. Play and watch the weight fly.");
            }}
          >
            Trigger bad η
          </button>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
            onClick={() => {
              setPlaying(false);
              applyFailureBeat("honest");
              setTrail([2.4]);
              setStepNote("Honest recovery: η = 0.12. Steps should shrink toward 3.");
            }}
          >
            Honest recovery
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => openStoryHash("twins")}>
            Jump to #twins
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => openStoryHash("pipeline")}>
            Jump to #pipeline
          </button>
        </div>
      </div>
      <Section id="definition" kicker="Definition">
        <Prose>
          The derivative points uphill. To make the loss smaller, step against it. The learning rate η decides how long that step is. On this bowl the update multiplies the distance to the minimum by (1 − 2η). The distance shrinks when that factor sits strictly between −1 and 1, which means η is between 0 and 1. At η = 1 the weight reflects across the minimum and never settles. Above 1 it reflects and flies farther every step.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>w ← w − η L′(w)</span>
        </Board>
        <Prose>L′(w) = 2(w − 3) for this loss. Subtracting η times a negative slope moves the weight to the right. Subtracting η times a positive slope moves it to the left. Both motions aim at 3, until η is large enough to overshoot.</Prose>
        {symbols([
          ["L′(w)", "the slope at the current weight"],
          ["η", "the learning rate, a positive step length"],
          ["←", "replace the weight with the new value"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 sm:grid-cols-2">
          <Scalar
            label="w"
            value={weight}
            onChange={(value) => {
              setPlaying(false);
              patchCast({ weight: value });
              setTrail([value]);
              setStepNote(`Set w = ${fmt(value)}. Distance to 3 is ${fmt(value - 3)}; the next step multiplies that by ${fmt(1 - 2 * eta)}.`);
            }}
            min={Math.min(-1, Math.floor(weight))}
            max={Math.max(7, Math.ceil(weight))}
            note={escaped ? "The weight has left the drawn bowl. The chart stays on −1 to 7 so the minimum remains visible." : "The chart covers −1 to 7. A large learning rate can leave it."}
          />
          <Scalar
            label="η, learning rate"
            value={eta}
            onChange={(value) => {
              patchCast({ eta: value });
              const nextFactor = 1 - 2 * value;
              setStepNote(
                Math.abs(nextFactor) > 1
                  ? `η = ${fmt(value)} makes (1 − 2η) = ${fmt(nextFactor)}. That is outside (−1, 1), so the weight will fly off.`
                  : `η = ${fmt(value)} makes (1 − 2η) = ${fmt(nextFactor)}. Distance to 3 will shrink on the next step.`,
              );
            }}
            min={0}
            max={1.3}
            step={0.05}
          />
        </div>
        <p className="text-sm text-slate-700">
          Slope = 2 × (<Num value={weight} /> − 3) = <Num value={slope} />. One step: <Num value={weight} /> − <Num value={eta} /> × <Num value={slope} /> = <Num value={weight} /> − <Num value={eta * slope} /> = <Num value={proposed} tone="green" />.
        </p>
        <p className={`rounded-md px-3 py-2 text-sm leading-relaxed ${flies ? "bg-amber-50 text-amber-950" : "border border-slate-200 bg-white text-slate-800"}`}>
          Multiplier (1 − 2η) = <Num value={factor} />. Distance to 3 is <Num value={distance} /> now and <Num value={proposed - 3} /> after one step. {fate}
        </p>
        <LiveCaption symbol="w" value={weight}>
          {stepNote}
        </LiveCaption>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md bg-[#172554] px-3 py-2 text-sm font-semibold text-white" onClick={step}>
            Take one step
          </button>
          <button type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold" onClick={() => setPlaying((value) => !value)}>
            {playing ? "Stop" : "Play"}
          </button>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold"
            onClick={() => {
              setPlaying(false);
              patchCast({ weight: 0 });
              setTrail([0]);
              setStepNote("Reset to w = 0. Multiplier (1 − 2η) still decides whether the next steps shrink or fly.");
            }}
          >
            Reset to 0
          </button>
        </div>
        <Curve
          f={loss}
          xMin={-1}
          xMax={7}
          marker={escaped ? undefined : weight}
          trail={trail.filter((value) => value >= -1 && value <= 7)}
          onScrub={(value) => {
            setPlaying(false);
            const next = Number(value.toFixed(2));
            patchCast({ weight: next });
            setTrail([next]);
            setStepNote(`Scrubbed to w = ${fmt(next)}. Distance to 3 is ${fmt(next - 3)}; the next step multiplies that by ${fmt(factor)}.`);
          }}
        />
        {escaped ? <p className="text-sm text-amber-900">The weight is {fmt(weight)} and has left the chart. Shrink η below 1 and reset.</p> : null}
        <Goal met={!escaped && Math.abs(weight - 3) < 0.05}>From 0, with η at 0.1, step until the weight arrives at 3. Then try η = 1.2 and watch the same formula diverge.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          A training step is this line, once per weight, using that weight’s partial. The pictures in papers of a loss going down are this update repeated. When a run diverges, the first thing to suspect is η larger than the bowl can tolerate. This bowl tolerates η below 1. A tighter bowl tolerates less. The curvature lesson changes the tightness and keeps η still, so you can see the same step succeed on one loss and fail on the other.
        </Prose>
      </Section>
    </Frame>
  );
}

const chainMoves = [
  "Multiply to get z",
  "Pass z through ReLU",
  "Multiply to get ŷ",
  "Square the miss",
  "Start from dL/dŷ",
  "Multiply by dŷ/dh",
  "Multiply by dh/dz",
  "Multiply by dz/dw₁",
];

function Flow({ lit, gate }: { lit: number; gate: number | null }) {
  const nodes = ["x", "z", "ReLU", "ŷ", "L"];
  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      {nodes.map((name, index) => {
        const on = index < lit;
        const shut = on && name === "ReLU" && gate === 0;
        return (
          <div key={name} className="flex items-center gap-2">
            <div
              className={`grid h-12 w-12 place-items-center rounded-full text-xs font-semibold ${
                shut ? "bg-amber-700 text-white" : on ? "bg-[#172554] text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {name}
            </div>
            {index < nodes.length - 1 ? <span className={`h-0.5 w-4 ${index < lit - 1 ? "bg-[#172554]" : "bg-slate-300"}`} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function ChainWalk({ x, w1, w2, step }: { x: number; w1: number; w2: number; step: ReturnType<typeof backprop> }) {
  const [move, setMove] = useState(0);
  const products = [step.dLossDprediction, step.dLossDhidden, step.dLossDz, step.dLossDw1];
  const factors = [
    { name: "dL/dŷ", value: step.dLossDprediction, why: "Slope of the square: 2 times the error." },
    { name: "dŷ/dh", value: w2, why: "ŷ = w₂ h, so this local slope is the second weight." },
    {
      name: "dh/dz",
      value: step.gate,
      why: step.gate === 1 ? "z is positive, so ReLU’s slope is 1." : "z is not positive, so ReLU’s slope is 0. This factor shuts the product.",
    },
    { name: "dz/dw₁", value: x, why: "z = w₁ x, so this local slope is the data x." },
  ];
  const backward = move >= 4;

  let body = null;
  if (move === 0) {
    body = (
      <>
        z = w₁ x. The first weight w₁ is <Num value={w1} tone="blue" /> and the data x is <Num value={x} tone="amber" />, so z, the number before ReLU, is <Num value={step.z} tone="green" />.
      </>
    );
  } else if (move === 1) {
    body =
      step.gate === 1 ? (
        <>
          h = ReLU(z). z is <Num value={step.z} />, which is positive, so the gate dh/dz is <Num value={step.gate} /> and h stays <Num value={step.hidden} />.
        </>
      ) : (
        <>
          h = ReLU(z). z is <Num value={step.z} />, which is not positive, so the gate dh/dz is <Num value={step.gate} /> and h is <Num value={step.hidden} />.
        </>
      );
  } else if (move === 2) {
    body = (
      <>
        ŷ = w₂ h. The second weight w₂ is <Num value={w2} /> and h is <Num value={step.hidden} />, so the prediction ŷ is <Num value={step.prediction} tone="green" />.
        {step.gate === 0 ? " h is 0 because the gate is shut, so the prediction is 0." : ""}
      </>
    );
  } else if (move === 3) {
    body = (
      <>
        L = (ŷ − t)². The error ŷ − t is <Num value={step.error} />. Square it and the loss L is <Num value={step.loss} tone="green" />.
      </>
    );
  } else if (move === 4) {
    body = (
      <>
        dL/dŷ = 2(ŷ − t). The error is <Num value={step.error} />, so this slope is <Num value={step.dLossDprediction} />. The running product starts at dL/dŷ.
      </>
    );
  } else if (move === 5) {
    body = (
      <>
        dŷ/dh = w₂. The prediction multiplies h by the second weight, so this factor is w₂ = <Num value={w2} />. The running product is dL/dŷ times w₂, now <Num value={step.dLossDhidden} />.
      </>
    );
  } else if (move === 6) {
    body =
      step.gate === 1 ? (
        <>
          dh/dz is the ReLU gate. z is <Num value={step.z} />, which is positive, so the gate is <Num value={step.gate} /> and the running product stays <Num value={step.dLossDz} />.
        </>
      ) : (
        <>
          dh/dz is the ReLU gate. z is <Num value={step.z} />, which is not positive, so the gate is <Num value={step.gate} />. The running product is multiplied by 0 and becomes <Num value={step.dLossDz} />.
        </>
      );
  } else {
    body =
      step.gate === 0 ? (
        <>
          dz/dw₁ = x = <Num value={x} />. The running product is already 0 because the gate was 0, so dL/dw₁ is <Num value={step.dLossDw1} />. w₁ gets no blame.
        </>
      ) : (
        <>
          dz/dw₁ = x. z = w₁ x, so the last factor is the data x = <Num value={x} />. The running product is dL/dw₁ = <Num value={step.dLossDw1} tone="green" />.
        </>
      );
  }

  return (
    <div className="max-w-full rounded-lg bg-white p-3" data-chain-move={move}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{backward ? "Backward" : "Forward"}</p>
        <StepControls
          step={move}
          total={chainMoves.length}
          onPrev={() => setMove((value) => value - 1)}
          onNext={() => setMove((value) => value + 1)}
          label={move === 3 ? "Start backward next" : chainMoves[move]}
        />
      </div>
      <div className="mt-3">
        <Flow lit={backward ? 5 : move + 2} gate={move >= 1 ? step.gate : null} />
      </div>
      {move >= 1 ? (
        <div className="mt-2">
          <LiveCaption symbol="dh/dz" value={step.gate}>
            {step.gate === 1
              ? "The gate is open. z is positive, so ReLU passes the value and the running product can stay nonzero."
              : "The gate is shut. The amber ReLU blocks every factor behind it, so the product through this gate becomes 0."}
          </LiveCaption>
        </div>
      ) : null}
      <p className="mt-3 text-sm font-semibold text-slate-900">{chainMoves[move]}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700" aria-live="polite">
        {body}
      </p>
      {backward ? (
        <div className="mt-3">
          <Chain factors={factors} through={move - 4} running={products[move - 4]} resultName="dL/dw₁" />
        </div>
      ) : null}
    </div>
  );
}

export function ChainLesson() {
  const { cast, patchCast } = useStoryCast();
  const { beat, applyFailureBeat } = useFailureBeat();
  const x = cast.x[0];
  const w1 = cast.w1;
  const w2 = cast.w2;
  const target = cast.target;
  const step = backprop(x, w1, w2, target);
  const chainBeat = beat?.id === "dead-relu" || beat?.id === "honest" ? beat : null;
  return (
    <Frame>
      <div className="mb-3 space-y-2">
        <StoryStrip lessonId="chain" />
        <LossPassport cast={cast} />
      </div>
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
          Failure beat{chainBeat ? ` · ${chainBeat.label}` : ""}
        </p>
        <p className="mt-1 font-semibold text-slate-900">
          Say aloud: {chainBeat?.sayAloud ?? "gate shut ⇒ no blame on w₁"}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          {chainBeat ? failureBeatChapters[chainBeat.id].blurb : failureBeatChapters["dead-relu"].blurb}
        </p>
        <p className="mt-1 font-mono text-xs text-slate-600">
          z=<Num value={step.z} /> · gate={step.gate} · ∂L/∂w₁=<Num value={step.dLossDw1} />
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-semibold text-white"
            onClick={() => applyFailureBeat("dead-relu")}
          >
            Trigger gate shut
          </button>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
            onClick={() => applyFailureBeat("honest")}
          >
            Honest recovery
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => openStoryHash("pipeline")}>
            Jump to #pipeline
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => openStoryHash("twins")}>
            Jump to #twins
          </button>
        </div>
      </div>
      <Section id="definition" kicker="Definition">
        <Prose>
          The loss depends on the prediction, the prediction depends on a hidden value, the hidden value depends on a pre-activation, and the pre-activation depends on w₁. The chain rule says the full slope is the product of those local slopes. Backprop starts at the loss, where the numbers are known, and multiplies backward. ReLU’s local slope is 1 when its input is positive and 0 when its input is negative. A negative pre-activation therefore zeroes every factor that has to pass through it, including dL/dw₁.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>dL/dw₁ = dL/dŷ · dŷ/dh · dh/dz · dz/dw₁</span>
        </Board>
        <Prose>
          Forward: z = w₁ x, h = ReLU(z), ŷ = w₂ h, L = (ŷ − t)². Backward, the local pieces are dL/dŷ = 2(ŷ − t), dŷ/dh = w₂, dh/dz = 1 if z &gt; 0 else 0, and dz/dw₁ = x.
        </Prose>
        {symbols([
          ["z", "the number before ReLU"],
          ["h", "the number after ReLU"],
          ["gate", "dh/dz, either 1 or 0"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Scalar
            label="x, the data"
            value={x}
            onChange={(value) => patchCast({ x: [value, cast.x[1], cast.x[2]] })}
            min={-2}
            max={3}
            note="This is x₁ from the shared cast input."
          />
          <Scalar label="w₁" value={w1} onChange={(value) => patchCast({ w1: value })} min={-2} max={2} />
          <Scalar label="w₂" value={w2} onChange={(value) => patchCast({ w2: value })} min={-2} max={2} />
          <Scalar label="target t" value={target} onChange={(value) => patchCast({ target: value })} min={-1} max={3} />
        </div>
        <ChainWalk x={x} w1={w1} w2={w2} step={step} />
        <p className="text-sm text-slate-700">
          Separately, dL/dw₂ = dL/dŷ × h = <Num value={step.dLossDprediction} /> × <Num value={step.hidden} /> = <Num value={step.dLossDw2} tone="green" />. w₂ still learns when the hidden value is nonzero. w₁ learns only when the gate is open.
        </p>
        <Goal met={step.gate === 0 && step.loss > 0}>Make z negative. With x positive, that means a negative w₁. The loss can stay large while dL/dw₁ is exactly 0. The dead unit is a zero factor in the product.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          A deep network is a longer product of the same kind. Each layer stores the local slope it will need, then the backward pass walks from the loss to the input, multiplying. The gradient for a weight is “upstream slope × local slope”. When a paper writes ∂L/∂W, it means one of these products, organized as a matrix. The next two lessons give the two tables you meet constantly: the softmax gradient, and the Jacobian of y = Wx.
        </Prose>
      </Section>
    </Frame>
  );
}

function GradientSentences({
  scores,
  probs,
  grad,
  correct,
  index,
  onIndexChange,
}: {
  scores: number[];
  probs: number[];
  grad: number[];
  correct: number;
  index: number;
  onIndexChange: (next: number) => void;
}) {
  const safe = Math.min(index, scores.length - 1);
  const star = safe === correct;
  return (
    <div className="max-w-full rounded-lg bg-white p-3" data-gradient-class={safe}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Why the slope</p>
        <StepControls
          step={safe}
          total={scores.length}
          onPrev={() => onIndexChange(safe - 1)}
          onNext={() => onIndexChange(safe + 1)}
          label={star ? `class ${safe + 1} (correct ★)` : `class ${safe + 1}`}
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-800">
        {star ? (
          <>
            Class {safe + 1} is the correct class. Its score z★ is {fmt(scores[safe])} and its probability p★ is {fmt(probs[safe], 3)}, so the slope ∂L/∂z★ is p★ − 1 = {fmt(grad[safe], 3)}.
          </>
        ) : (
          <>
            Class {safe + 1} is a wrong class. Its score zᵢ is {fmt(scores[safe])} and its probability pᵢ is {fmt(probs[safe], 3)}, so the slope ∂L/∂zᵢ is pᵢ = {fmt(grad[safe], 3)}.
          </>
        )}
      </p>
    </div>
  );
}

export function SoftmaxLesson() {
  const { cast, patchCast } = useStoryCast();
  const logits = cast.scores;
  const correct = cast.correct;
  const [focus, setFocus] = useState(0);
  const [shift, setShift] = useState(0);
  const [boost, setBoost] = useState(false);
  const shifted = logits.map((value) => value + shift + (boost ? 1000 : 0));
  const base = softmaxLossGrad(logits, correct);
  const stable = softmaxLossGrad(shifted, correct);
  const naiveExp = shifted.map((value) => Math.exp(value));
  const naiveFinite = naiveExp.every((value) => Number.isFinite(value));
  const h = 1e-4;
  const nudged = softmaxLossGrad(shifted.map((value, index) => (index === correct ? value + h : value)), correct);
  const numeric = (nudged.loss - stable.loss) / h;
  const tallest = stable.probs.reduce((best, prob, index, list) => (prob > list[best] ? index : best), 0);
  return (
    <Frame>
      <StoryStrip lessonId="softmax" />
      <Section id="definition" kicker="Definition">
        <Prose>
          A classifier ends in raw scores, one per class. Softmax turns them into positive numbers that add to 1, by exponentiating and dividing by the sum. Cross-entropy looks only at the correct class and takes the negative log. A probability of 1 has loss 0. A probability near 0 has a large loss. Adding the same constant to every score does not change the probabilities, which is why a careful implementation subtracts the largest score before calling exp: the math is identical, and exp stops overflowing.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>
            pᵢ = <Frac num="exp(zᵢ)" den="Σⱼ exp(zⱼ)" />
          </span>
        </Board>
        <Board>
          <span>L = −log(p★)</span>
          <span className="px-3 text-slate-400">and</span>
          <span>∂L/∂zᵢ = pᵢ − 1ᵢ₌★</span>
        </Board>
        <Prose>
          Where the gradient comes from: L = −z★ + log(Σ exp(zⱼ)). Raising the correct score lowers −z★ by 1 and raises the log-sum by p★, so the net slope is p★ − 1. Raising a wrong score leaves −z★ alone and raises the log-sum by pᵢ, so the slope is pᵢ. Descent therefore lifts the correct score and pushes the others down.
        </Prose>
        {symbols([
          ["zᵢ", "the raw score for class i, before softmax"],
          ["pᵢ", "the number the model uses as a probability"],
          ["★", "the correct class"],
          ["1ᵢ₌★", "1 on the correct class, 0 on the others"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <VectorEditor
          label="Scores z"
          hint="Same three scores as Studio’s probability panel."
          values={logits}
          onChange={(next) => patchCast({ scores: [next[0], next[1], next[2]] })}
          min={-2}
          max={8}
        />
        <Scalar label="Add this constant to every score" value={shift} onChange={setShift} min={0} max={12} step={0.5} note="The probabilities do not move. Only the raw scores do." />
        <button type="button" className={`rounded-md px-3 py-1.5 text-sm font-semibold ${boost ? "bg-[#172554] text-white" : "bg-white"}`} onClick={() => setBoost((value) => !value)}>
          {boost ? "Remove the +1000 overflow test" : "Add 1000 to every score"}
        </button>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${correct === index ? "bg-[#172554] text-white" : "bg-white"}`}
              onClick={() => {
                patchCast({ correct: index });
                setFocus(index);
              }}
            >
              Correct class {index + 1}
            </button>
          ))}
        </div>
        <Bars
          values={stable.probs}
          labels={["class 1", "class 2", "class 3"]}
          highlightIndex={correct}
          caption={`Correct class ${correct + 1} is highlighted. Tallest bar is class ${tallest + 1} (p = ${fmt(stable.probs[tallest], 3)}).`}
        />
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pr-4">class</th>
                <th className="pr-4">score</th>
                <th className="pr-4">exp, naive</th>
                <th className="pr-4">probability</th>
                <th>∂L/∂z</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {shifted.map((value, index) => (
                <tr key={index} className={index === focus ? "bg-blue-50" : undefined}>
                  <td className="pr-4">{index + 1}</td>
                  <td className="pr-4">{fmt(value)}</td>
                  <td className="pr-4">{Number.isFinite(naiveExp[index]) ? fmt(naiveExp[index], 3) : "overflow"}</td>
                  <td className="pr-4">{fmt(stable.probs[index], 3)}</td>
                  <td>{fmt(stable.grad[index], 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <GradientSentences scores={shifted} probs={stable.probs} grad={stable.grad} correct={correct} index={focus} onIndexChange={setFocus} />
        <p className="text-sm text-slate-700">
          The probabilities add to <Num value={stable.probs.reduce((sum, value) => sum + value, 0)} />. The largest one differs from the unshifted softmax by <Num value={Math.max(...stable.probs.map((prob, index) => Math.abs(prob - base.probs[index])))} digits={4} />. Loss = −log(<Num value={stable.probs[correct]} digits={3} />) = <Num value={stable.loss} tone="green" />. Nudging the correct score by 0.0001 moves the loss at a rate of <Num value={numeric} digits={3} />. The formula p★ − 1 says <Num value={stable.grad[correct]} digits={3} />.
          {naiveFinite ? "" : " Naive exp overflowed. The probability column subtracted the largest score before calling exp, so it is still defined."}
        </p>
        <Goal met={stable.probs[correct] > 0.9}>Raise the correct score until its probability passes 0.90. Watch the loss fall toward 0, and watch that class’s gradient, p★ − 1, fall toward 0 as well. There is nothing left to fix.</Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          The last line of a classifier is this pair: softmax, then cross-entropy. The beautiful accident is that their chain rule collapses to “probability minus the right answer”. You do not backprop through the division by hand in everyday work. You do need to know the collapsed result, and you need to know why the exp is computed after subtracting the max. Both are on this page, with the numbers that produce them.
        </Prose>
      </Section>
    </Frame>
  );
}

export function JacobianLesson() {
  const { cast, patchCast, resetCast } = useStoryCast();
  const weights = cast.W;
  const input = cast.x;
  const upstream = layerUpstreamG(cast);
  const flipped = transpose(weights);
  const backward = layerInputBlame(cast);
  const y = [
    weights[0][0] * input[0] + weights[0][1] * input[1] + weights[0][2] * input[2],
    weights[1][0] * input[0] + weights[1][1] * input[1] + weights[1][2] * input[2],
  ];
  const h = 0.0001;
  const y1Nudge = weights[0][0] * (input[0] + h) + weights[0][1] * input[1] + weights[0][2] * input[2];
  const measured = (y1Nudge - y[0]) / h;
  return (
    <Frame>
      <StoryStrip lessonId="jacobian" />
      <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Forward-then-flip dual</p>
        <p className="mt-1 font-semibold text-slate-900">Say aloud: forward faces rows; blame faces columns = Wᵀ rows.</p>
        <p className="mt-1 font-mono text-xs text-slate-700">
          g = (<Num value={upstream[0]} />, <Num value={upstream[1]} />) from CE ∂L/∂z on cast scores · Wᵀg = (
          <Num value={backward[0]} />, <Num value={backward[1]} />, <Num value={backward[2]} />)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200" onClick={resetCast}>
            Reset cast
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => openStoryHash("machine")}>
            Open #machine
          </button>
          <button type="button" className="text-sm font-semibold text-[#1d4ed8]" onClick={() => openStoryHash("transpose")}>
            Open #transpose
          </button>
        </div>
      </div>
      <Section id="definition" kicker="Definition">
        <Prose>
          When the output is a vector, every output has its own partial for every input. The Jacobian is that table. For y = Wx, output i’s partial with respect to input j is exactly the weight Wᵢⱼ. So the Jacobian is W. The loss is upstream of y. Its slope with respect to input j adds, over every output, “how the loss feels that output” times “how that output feels this input”. Writing that sum as a matrix product puts W on the left only after it is transposed.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>∂L/∂xⱼ = Σᵢ ∂L/∂yᵢ · Wᵢⱼ</span>
        </Board>
        <Prose>In vector form that sum is Wᵀ times the upstream gradient. The transpose is the algebra lesson’s flip, used so each input lines up with the weights that touch it. Same cast W and g as #machine.</Prose>
        {symbols([
          ["∂L/∂yᵢ", "the slope arriving from the loss, one per output"],
          ["Wᵢⱼ", "how much input j moves output i"],
          ["Wᵀ g", "the same sum, packed as one product"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <div className="flex flex-wrap gap-6">
          <MatrixCells
            label="W (shared cast)"
            rows={weights}
            onChange={(next) =>
              patchCast({
                W: [
                  [next[0][0], next[0][1], next[0][2]],
                  [next[1][0], next[1][1], next[1][2]],
                ],
              })
            }
          />
          <VectorEditor
            label="x"
            hint="Same cast input as #machine."
            values={input}
            onChange={(value) => patchCast({ x: [value[0], value[1], value[2]] })}
            min={-2}
            max={2}
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">g = ∂L/∂y (shared)</p>
            <p className="mt-1 font-mono text-sm">
              (<Num value={upstream[0]} tone="amber" />, <Num value={upstream[1]} tone="amber" />)
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-600">
              First two CE ∂L/∂z on cast scores. Change scores / ★ in Studio to move g; Reset restores DEFAULT_CAST.
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700">
          y₁ = <Num value={weights[0][0]} />×<Num value={input[0]} /> + <Num value={weights[0][1]} />×<Num value={input[1]} /> + <Num value={weights[0][2]} />×<Num value={input[2]} /> = <Num value={y[0]} tone="green" />. y₂ = <Num value={y[1]} tone="green" />.
        </p>
        <p className="text-sm text-slate-700">
          Nudge x₁ by 0.0001 and y₁ changes at rate <Num value={measured} digits={4} />. The table says that rate is W₁₁ = <Num value={weights[0][0]} digits={4} />. The Jacobian entry is the weight.
        </p>
        <div className="rounded-lg bg-white p-3 text-sm leading-relaxed text-slate-700">
          <p>
            ∂L/∂x₁ = Σᵢ gᵢ Wᵢ₁ = <Num value={upstream[0]} />×<Num value={weights[0][0]} /> + <Num value={upstream[1]} />×<Num value={weights[1][0]} /> = <Num value={backward[0]} tone="green" />.
          </p>
          <p>
            ∂L/∂x₂ = Σᵢ gᵢ Wᵢ₂ = <Num value={upstream[0]} />×<Num value={weights[0][1]} /> + <Num value={upstream[1]} />×<Num value={weights[1][1]} /> = <Num value={backward[1]} tone="green" />.
          </p>
          <p>
            ∂L/∂x₃ = Σᵢ gᵢ Wᵢ₃ = <Num value={upstream[0]} />×<Num value={weights[0][2]} /> + <Num value={upstream[1]} />×<Num value={weights[1][2]} /> = <Num value={backward[2]} tone="green" />.
          </p>
          <p>
            Wᵀ row 1 = ({fmt(flipped[0][0])}, {fmt(flipped[0][1])}); Wᵀg = ({fmt(backward[0])}, {fmt(backward[1])}, {fmt(backward[2])}). Same triple as #machine transpose blame.
          </p>
        </div>
        <LiveCaption symbol="forward W, blame Wᵀ">
          Same entries — only the facing flips. Column j · g is row j of Wᵀ times g.
        </LiveCaption>
        <Goal met={Math.abs(backward[0]) < 0.05}>
          Make ∂L/∂x₁ near 0 (edit W or Studio scores). The long sum and Wᵀg stay locked together.
        </Goal>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          “Multiply the upstream gradient by W transpose” is this page. It is not a second, unrelated rule. It is ∂yᵢ/∂xⱼ = Wᵢⱼ written as a product so a whole batch can be differentiated at once. Forward uses W. Backward uses Wᵀ. The entries are the same numbers, facing the other way — the forward-then-flip dual you just walked on #machine.
        </Prose>
      </Section>
    </Frame>
  );
}

export function CurvatureLesson() {
  const [eta, setEta] = useState(0.1);
  const [wide, setWide] = useState(0);
  const [tight, setTight] = useState(0);
  const [stepSize, setStepSize] = useState(0.4);
  const wideNext = gdStep(wide, eta, 3, 1);
  const tightNext = gdStep(tight, eta, 3, 20);
  const wideLimit = stableStepLimit(1);
  const tightLimit = stableStepLimit(20);
  const h = stepSize;
  const exact = (1 + h) ** 3;
  const linear = 1 + 3 * h;
  const quadratic = 1 + 3 * h + 3 * h * h;
  const leftover = h ** 3;
  return (
    <Frame>
      <Section id="definition" kicker="Definition">
        <Prose>
          The second derivative is the slope of the slope. A large second derivative means the bowl bends hard, so a straight-line guess goes stale after a short step. Gradient descent trusts that straight line. The Taylor formula writes the guess in public: value, plus slope times step, plus half the second derivative times step squared, plus a leftover. For a pure quadratic the leftover is zero. For x³ at 1, the leftover is exactly h³.
        </Prose>
      </Section>
      <Section id="formula" kicker="General formula">
        <Board>
          <span>f(x+h) ≈ f(x) + f′(x) h + ½ f″(x) h²</span>
        </Board>
        <Prose>
          On L(w) = c (w − 3)² the second derivative is the constant 2c. One gradient step multiplies the distance to 3 by (1 − 2c η). That distance shrinks only while η is below 1/c. Newton’s method chooses the step η = 1 / f″, which lands on the bottom of a pure quadratic in one update. Networks are not pure quadratics, so training takes a cautious fraction of a step like that.
        </Prose>
        {symbols([
          ["f″", "how fast the slope changes"],
          ["c", "bowl tightness. Wide bowl: 1. Tight bowl: 20."],
          ["h³", "the piece a second-order guess still ignores, for (1+h)³"],
        ])}
      </Section>
      <Section id="numbers" kicker="These numbers">
        <Scalar label="η, the same learning rate for both bowls" value={eta} onChange={setEta} min={0} max={0.2} step={0.005} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-white p-3 text-sm">
            <p className="font-semibold">Wide, c = 1, stable below η = {fmt(wideLimit)}</p>
            <p className="mt-1">w = <Num value={wide} />. Slope = 2×1×(w − 3) = <Num value={2 * (wide - 3)} />. Next w = <Num value={wideNext} tone="green" />.</p>
            <Curve f={(value) => (value - 3) ** 2} xMin={-1} xMax={7} marker={wide >= -1 && wide <= 7 ? wide : undefined} onScrub={(value) => setWide(Number(value.toFixed(2)))} />
          </div>
          <div className="rounded-lg bg-white p-3 text-sm">
            <p className="font-semibold">Tight, c = 20, stable below η = {fmt(tightLimit, 3)}</p>
            <p className="mt-1">w = <Num value={tight} />. Slope = 2×20×(w − 3) = <Num value={40 * (tight - 3)} />. Next w = <Num value={tightNext} tone="green" />.</p>
            <Curve f={(value) => 20 * (value - 3) ** 2} xMin={-1} xMax={7} marker={tight >= -1 && tight <= 7 ? tight : undefined} onScrub={(value) => setTight(Number(value.toFixed(2)))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md bg-[#172554] px-3 py-2 text-sm font-semibold text-white" onClick={() => { setWide(wideNext); setTight(tightNext); }}>
            Step both
          </button>
          <button type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold" onClick={() => setWide(newtonStep(wide))}>
            Newton on the wide bowl
          </button>
          <button type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold" onClick={() => { setWide(0); setTight(0); }}>
            Reset both to 0
          </button>
        </div>
        <p className="text-sm text-slate-700">
          Newton uses η = 1 / f″ = 1 / 2 = 0.5 on the wide bowl, and one step from <Num value={wide} /> lands on <Num value={newtonStep(wide)} />. The tight bowl would need η = 1/40 = 0.025. Your shared η is <Num value={eta} />.
        </p>
        <Goal met={eta > tightLimit && Math.abs(tight - 3) > Math.abs(wide - 3) && Math.abs(tight) > 3}>
          Set η to about 0.10, reset, and step several times. The wide bowl walks toward 3. The tight bowl, whose limit is 0.05, moves away.
        </Goal>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700">
          <p className="font-semibold">The leftover, on f(x) = x³ at x = 1</p>
          <Scalar label="Step h" value={stepSize} onChange={setStepSize} min={-0.5} max={1} step={0.05} />
          <p className="mt-2">
            Exact (1 + h)³ = <Num value={exact} />. Straight-line guess 1 + 3h = <Num value={linear} />. With curvature 1 + 3h + 3h² = <Num value={quadratic} />. The missing piece is h³ = <Num value={leftover} tone="green" />.
          </p>
          <p>At a small step the cube of the step is tiny and the straight guess is honest. At a step of 1, the ignored piece is 1, as large as the function you started from. That is a learning rate that has stopped being a local nudge.</p>
        </div>
      </Section>
      <Section id="model" kicker="The same formula in a model">
        <Prose>
          One global learning rate assumes every direction bends about as much as every other. Real losses do not. Adaptive methods shrink the step where the slopes have been large, which is a practical stand-in for “this direction is steep, take a shorter step”. The fact underneath is the one you just measured: f″ sets the largest honest step, and a Taylor leftover is how that honesty fails.
        </Prose>
      </Section>
    </Frame>
  );
}
