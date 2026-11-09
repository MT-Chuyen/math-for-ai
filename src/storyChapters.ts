/**
 * Short chapter labels for the subway map / pipeline route.
 * Keyed by curriculum lesson id. Map / App import titles without owning copy.
 */

export type StoryLine = "attention" | "training" | "shapes";

export type CastField = "x" | "k" | "W" | "b" | "w1" | "w2" | "target" | "weight" | "eta" | "scores" | "correct";

export type StoryChapter = {
  id: string;
  line: StoryLine;
  /** Short station / chapter title for the map. */
  title: string;
  /** One plain-language line for the Same-run strip or tip. */
  blurb: string;
  /** Cast fields this lesson owns (wired slice only). */
  owns: CastField[];
  /** Pipeline Walk order; null = not on the Iter-1 route prototype. */
  pipelineOrder: number | null;
};

/** Full Same-run chapters (Studio + vertical slice that consumes the cast). */
export const storyChapters: Record<string, StoryChapter> = {
  studio: {
    id: "studio",
    line: "attention",
    title: "Meet the cast",
    blurb: "Studio knobs write the shared run every lesson reuses.",
    owns: ["x", "k", "weight", "eta", "scores"],
    pipelineOrder: 0,
  },
  dot: {
    id: "dot",
    line: "attention",
    title: "Match scores",
    blurb: "Same x and k: multiply matching entries, then add.",
    owns: ["x", "k"],
    pipelineOrder: null,
  },
  "linear-layer": {
    id: "linear-layer",
    line: "shapes",
    title: "One layer forward",
    blurb: "Same x through W and b — one row, one dot, one output.",
    owns: ["x", "W", "b"],
    pipelineOrder: 1,
  },
  chain: {
    id: "chain",
    line: "training",
    title: "Blame the weights",
    blurb: "Tiny net on x₁, w₁, w₂, target — Loss Passport stamps L, ŷ, gate, ∂L/∂w₁, ∂L/∂w₂. Gate-shut: ∂L/∂w₁ = 0.",
    owns: ["x", "w1", "w2", "target"],
    pipelineOrder: 2,
  },
  softmax: {
    id: "softmax",
    line: "attention",
    title: "Scores become bets",
    blurb: "Same three scores: softmax, then loss on the correct class.",
    owns: ["scores", "correct"],
    pipelineOrder: 3,
  },
  descent: {
    id: "descent",
    line: "training",
    title: "One η step",
    blurb: "Same weight and η: step against the slope on the bowl. Bad-η beat: say aloud η too large ⇒ distance grows.",
    owns: ["weight", "eta"],
    pipelineOrder: 4,
  },
  transpose: {
    id: "transpose",
    line: "shapes",
    title: "Flip the facing",
    blurb: "Forward-then-flip: same W entries — forward faces rows; blame faces columns = Wᵀ rows.",
    owns: ["W"],
    pipelineOrder: null,
  },
  jacobian: {
    id: "jacobian",
    line: "training",
    title: "Blame Needs the Flip",
    blurb: "Forward-then-flip dual: Σᵢ gᵢ Wᵢⱼ = (Wᵀg)ⱼ on the same cast W. Say aloud: forward W, blame Wᵀ — same entries.",
    owns: ["W", "scores", "correct"],
    pipelineOrder: null,
  },
};

/** Failure-story chapter cues (Studio / replay / interview share these lines). */
export const failureBeatChapters: Record<
  "dead-relu" | "bad-eta" | "honest",
  { title: string; blurb: string; chapterId: string }
> = {
  "dead-relu": {
    title: "Gate shut",
    blurb: "Dead ReLU: w₁x < 0 → gate 0 → ∂L/∂w₁ = 0. Continue on #chain or #twins.",
    chapterId: "chain",
  },
  "bad-eta": {
    title: "Bad η overshoot",
    blurb: "η = 1.4 flies off the bowl. Continue on #descent or #twins.",
    chapterId: "descent",
  },
  honest: {
    title: "Honest recovery",
    blurb: "Open gate + η = 0.12 — blame reaches w₁ and the bowl settles. Compare on #twins.",
    chapterId: "descent",
  },
};

/**
 * Short narrative titles for Attention / Training / key Shapes stations.
 * Includes the wired chapters above; map can read any station id.
 */
export const stationChapters: Record<string, { line: StoryLine; title: string; blurb: string }> = {
  // Attention line
  vectors: { line: "attention", title: "Name the list", blurb: "A token or feature is an ordered list." },
  dot: { line: "attention", title: "Match scores", blurb: "q · k from the shared cast." },
  norm: { line: "attention", title: "Scale the gap", blurb: "Length, cosine, and why scores divide by √d." },
  transpose: {
    line: "attention",
    title: "Flip the keys",
    blurb: "Forward-then-flip: same entries face columns for blame (Wᵀ) and for keys (Kᵀ) — not a second rule.",
  },
  multiply: { line: "attention", title: "Score matrix", blurb: "QKᵀ is many dots at once." },
  softmax: { line: "attention", title: "Scores become bets", blurb: "Softmax turns the cast scores into probabilities." },

  // Training line
  quadratic: { line: "training", title: "A bowl of pairs", blurb: "xᵀAx is the shape of squared error and weight decay." },
  function: { line: "training", title: "Loss is a function", blurb: "One weight in, one badness number out." },
  slope: { line: "training", title: "Rise over run", blurb: "Two points measure how the loss moves." },
  derivative: { line: "training", title: "Shrink the run", blurb: "The slope left when h → 0." },
  rules: { line: "training", title: "Shortcut slopes", blurb: "Power, sum, and chain without redoing the limit." },
  partials: { line: "training", title: "One knob at a time", blurb: "∇L packs every partial into a vector." },
  descent: {
    line: "training",
    title: "One η step",
    blurb: "Step against the slope with the cast η — too large and the weight flies.",
  },
  chain: {
    line: "training",
    title: "Blame the weights",
    blurb: "Backprop multiplies local slopes; a shut ReLU gate zeroes blame on w₁.",
  },
  jacobian: {
    line: "training",
    title: "Backward through W",
    blurb: "Forward faces rows; blame faces columns = Wᵀ rows. Σᵢ gᵢ Wᵢⱼ matches Wᵀg on the cast.",
  },
  machine: {
    line: "shapes",
    title: "Matrix as machine",
    blurb: "Row-workers build y = Wx+b; flip to transpose and each input blame is column·g = (Wᵀg)ⱼ.",
  },
  curvature: { line: "training", title: "How tight the bowl", blurb: "Second derivative sets the honest step size." },

  // Key Shapes stations (pipeline / layer story)
  combine: { line: "shapes", title: "Add the update", blurb: "Entry-wise add and scale — residual shape." },
  "linear-layer": { line: "shapes", title: "One layer forward", blurb: "Wx + b on the cast input." },
};

/** Flat title map for mapGraphExport / station tips. */
export const chapterTitles: Record<string, string> = Object.fromEntries(
  Object.entries(stationChapters).map(([id, chapter]) => [id, chapter.title]),
);

/** Iter-1 Pipeline Walk: chapter labels pointing at existing lessons (not a full flowchart). */
export const pipelineRoute = [
  storyChapters.studio,
  storyChapters["linear-layer"],
  storyChapters.chain,
  storyChapters.softmax,
  storyChapters.descent,
];

export function chapterFor(lessonId: string): StoryChapter | null {
  return storyChapters[lessonId] ?? null;
}

export function chapterTitle(lessonId: string): string | null {
  return chapterTitles[lessonId] ?? storyChapters[lessonId]?.title ?? null;
}

export function chapterBlurb(lessonId: string): string | null {
  return stationChapters[lessonId]?.blurb ?? storyChapters[lessonId]?.blurb ?? null;
}

export function chaptersOnLine(line: StoryLine): Array<{ id: string; title: string; blurb: string }> {
  return Object.entries(stationChapters)
    .filter(([, chapter]) => chapter.line === line)
    .map(([id, chapter]) => ({ id, title: chapter.title, blurb: chapter.blurb }));
}
