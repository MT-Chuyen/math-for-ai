import { useEffect, useState } from "react";
import { add, backprop, dot, gdStep, matvec, softmax, softmaxLossGrad, transpose } from "./math";

/** One shared cast of numbers for Studio + the training-story lesson slice. */
export type StoryCast = {
  /** Feature / query vector (length 3). Studio plane uses the first two entries. */
  x: [number, number, number];
  /** Key vector (length 3). Studio plane uses the first two entries. */
  k: [number, number, number];
  /** Linear layer weights, 2×3. */
  W: [[number, number, number], [number, number, number]];
  /** Linear layer bias. */
  b: [number, number];
  /** Tiny-net first weight (chain lesson). */
  w1: number;
  /** Tiny-net second weight (chain lesson). */
  w2: number;
  /** Squared-error target for the tiny net. */
  target: number;
  /** Bowl weight for Studio / gradient descent. */
  weight: number;
  /** Learning rate η. */
  eta: number;
  /** Softmax origin A: classifier logits (cast scores / z). Not attention dots. */
  scores: [number, number, number];
  /** Index of the correct class for softmax cross-entropy. */
  correct: number;
};

/** Which score world feeds softmax on this site — must be named before reading p. */
export type SoftmaxOrigin = "logits" | "attention";

export const SOFTMAX_ORIGIN_LABELS: Record<SoftmaxOrigin, string> = {
  logits: "classifier logits",
  attention: "attention dots",
};

/** Same key triple as #scores row 0: cast k plus two cyclic permutations. */
export function attentionKeysFromCast(k: [number, number, number]): [
  [number, number, number],
  [number, number, number],
  [number, number, number],
] {
  return [k, [k[1], k[2], k[0]], [k[2], k[0], k[1]]];
}

/** Value rods for #mixer: cast x plus two cyclic permutations (no new cast field). */
export function attentionValuesFromCast(x: [number, number, number]): [
  [number, number, number],
  [number, number, number],
  [number, number, number],
] {
  return [x, [x[1], x[2], x[0]], [x[2], x[0], x[1]]];
}

/**
 * Live attention score row from cast x · keys(k) — same numbers #scores uses for q₀.
 * Default divides by √d (d = 3) like the score-matrix √d toggle.
 */
export function attentionScoreRow(cast: StoryCast, scaleBySqrtD = true): [number, number, number] {
  const keys = attentionKeysFromCast(cast.k);
  const raw: [number, number, number] = [dot(cast.x, keys[0]), dot(cast.x, keys[1]), dot(cast.x, keys[2])];
  if (!scaleBySqrtD) return raw;
  const sqrtD = Math.sqrt(3);
  return [raw[0] / sqrtD, raw[1] / sqrtD, raw[2] / sqrtD];
}

export const STORY_STORAGE_KEY = "aimath:story-cast";
export const BEAT_STORAGE_KEY = "aimath:failure-beat";

export const DEFAULT_CAST: StoryCast = {
  x: [1.4, 0.4, 0.5],
  k: [0.5, 1.3, 0.2],
  W: [
    [0.5, -1, 2],
    [1, 0.5, 0],
  ],
  b: [0.1, -0.2],
  w1: 0.5,
  w2: 1.5,
  target: 1,
  weight: 0.2,
  eta: 0.12,
  scores: [1.1, 0.2, -0.7],
  correct: 0,
};

/** Named failure beats: write cast + cue which surface/lesson continues the story. */
export type FailureBeatId = "dead-relu" | "bad-eta" | "honest";

export type FailureBeat = {
  id: FailureBeatId;
  label: string;
  /** One line the learner should say aloud. */
  sayAloud: string;
  /** Short strip cue under the active beat. */
  blurb: string;
  /** Preferred jump targets (existing hash surfaces / lessons). */
  jump: { id: string; label: string }[];
  /** Cast fields this beat forces. */
  cast: Partial<StoryCast>;
};

/**
 * Dead ReLU: DEFAULT x₁ = 1.4, w₁ = −1.2 → z = w₁x < 0 → gate 0 → ∂L/∂w₁ = 0.
 * Bad η: η = 1.4 on the bowl (flies; |1 − 2η| > 1).
 * Honest: open gate + η under the stable limit, mid-recovery weight.
 */
export const FAILURE_BEATS: Record<FailureBeatId, FailureBeat> = {
  "dead-relu": {
    id: "dead-relu",
    label: "Gate shut",
    sayAloud: "Gate shut ⇒ no blame on w₁",
    blurb: "w₁x < 0, ReLU gate = 0, so ∂L/∂w₁ = 0 even when loss is large.",
    jump: [
      { id: "chain", label: "Open #chain" },
      { id: "pipeline", label: "Open #pipeline" },
      { id: "twins", label: "Open #twins" },
    ],
    cast: { x: [1.4, 0.4, 0.5], w1: -1.2, w2: 1.5, target: 1 },
  },
  "bad-eta": {
    id: "bad-eta",
    label: "Bad η",
    sayAloud: "η too large ⇒ distance to 3 grows each step",
    blurb: "η = 1.4 makes (1 − 2η) = −1.8; the bowl weight overshoots and flies.",
    jump: [
      { id: "descent", label: "Open #descent" },
      { id: "twins", label: "Open #twins" },
      { id: "pipeline", label: "Open #pipeline" },
    ],
    cast: { weight: 0.2, eta: 1.4 },
  },
  honest: {
    id: "honest",
    label: "Honest recovery",
    sayAloud: "Open gate + sane η ⇒ blame reaches w₁ and the bowl settles",
    blurb: "w₁x > 0 so the gate is open; η = 0.12 keeps the bowl step honest.",
    jump: [
      { id: "twins", label: "Open #twins" },
      { id: "chain", label: "Open #chain" },
      { id: "descent", label: "Open #descent" },
    ],
    cast: { w1: 0.8, w2: 1.2, weight: 2.4, eta: 0.12, scores: [2.2, 0.1, -0.4] },
  },
};

export const FAILURE_BEAT_ORDER: FailureBeatId[] = ["dead-relu", "bad-eta", "honest"];

type Listener = () => void;

const listeners = new Set<Listener>();
const beatListeners = new Set<Listener>();
let current: StoryCast = loadCastFromStorage();
let activeBeat: FailureBeatId | null = loadBeatFromStorage();

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asTriple(value: unknown, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(value) || value.length < 3) return [...fallback] as [number, number, number];
  const next: [number, number, number] = [fallback[0], fallback[1], fallback[2]];
  for (let index = 0; index < 3; index += 1) {
    if (isFiniteNumber(value[index])) next[index] = value[index];
  }
  return next;
}

function asPair(value: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(value) || value.length < 2) return [...fallback] as [number, number];
  return [
    isFiniteNumber(value[0]) ? value[0] : fallback[0],
    isFiniteNumber(value[1]) ? value[1] : fallback[1],
  ];
}

function asMatrix(
  value: unknown,
  fallback: [[number, number, number], [number, number, number]],
): [[number, number, number], [number, number, number]] {
  if (!Array.isArray(value) || value.length < 2) {
    return [asTriple(fallback[0], fallback[0]), asTriple(fallback[1], fallback[1])];
  }
  return [asTriple(value[0], fallback[0]), asTriple(value[1], fallback[1])];
}

export function normalizeCast(raw: Partial<StoryCast> | null | undefined): StoryCast {
  const base = DEFAULT_CAST;
  const source = raw ?? {};
  const correctRaw = source.correct;
  const correct = isFiniteNumber(correctRaw) ? Math.max(0, Math.min(2, Math.round(correctRaw))) : base.correct;
  return {
    x: asTriple(source.x, base.x),
    k: asTriple(source.k, base.k),
    W: asMatrix(source.W, base.W),
    b: asPair(source.b, base.b),
    w1: isFiniteNumber(source.w1) ? source.w1 : base.w1,
    w2: isFiniteNumber(source.w2) ? source.w2 : base.w2,
    target: isFiniteNumber(source.target) ? source.target : base.target,
    weight: isFiniteNumber(source.weight) ? source.weight : base.weight,
    eta: isFiniteNumber(source.eta) ? source.eta : base.eta,
    scores: asTriple(source.scores, base.scores),
    correct,
  };
}

function loadCastFromStorage(): StoryCast {
  try {
    const text = localStorage.getItem(STORY_STORAGE_KEY);
    if (!text) return normalizeCast(DEFAULT_CAST);
    return normalizeCast(JSON.parse(text) as Partial<StoryCast>);
  } catch {
    return normalizeCast(DEFAULT_CAST);
  }
}

function isFailureBeatId(value: unknown): value is FailureBeatId {
  return value === "dead-relu" || value === "bad-eta" || value === "honest";
}

function loadBeatFromStorage(): FailureBeatId | null {
  try {
    const text = localStorage.getItem(BEAT_STORAGE_KEY);
    if (!text) return null;
    const parsed = JSON.parse(text) as { id?: unknown };
    return isFailureBeatId(parsed?.id) ? parsed.id : null;
  } catch {
    return null;
  }
}

function persist(cast: StoryCast) {
  try {
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(cast));
  } catch {
    /* storage can be blocked; in-memory cast still works for the session */
  }
}

function persistBeat(beat: FailureBeatId | null) {
  try {
    if (beat == null) localStorage.removeItem(BEAT_STORAGE_KEY);
    else localStorage.setItem(BEAT_STORAGE_KEY, JSON.stringify({ id: beat }));
  } catch {
    /* storage can be blocked; in-memory beat still works for the session */
  }
}

function notify() {
  for (const listener of listeners) listener();
}

function notifyBeat() {
  for (const listener of beatListeners) listener();
}

export function getCast(): StoryCast {
  return current;
}

export function setCast(next: StoryCast) {
  current = normalizeCast(next);
  persist(current);
  notify();
}

export function patchCast(patch: Partial<StoryCast>) {
  current = normalizeCast({ ...current, ...patch });
  persist(current);
  notify();
}

export function resetCast() {
  current = normalizeCast(DEFAULT_CAST);
  persist(current);
  notify();
  clearFailureBeat();
}

export function subscribeCast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveBeatId(): FailureBeatId | null {
  return activeBeat;
}

export function getActiveBeat(): FailureBeat | null {
  return activeBeat ? FAILURE_BEATS[activeBeat] : null;
}

export function setActiveBeat(id: FailureBeatId | null) {
  activeBeat = id;
  persistBeat(activeBeat);
  notifyBeat();
}

export function clearFailureBeat() {
  if (activeBeat == null) {
    persistBeat(null);
    notifyBeat();
    return;
  }
  activeBeat = null;
  persistBeat(null);
  notifyBeat();
}

/** Write the beat’s cast patch and mark it active (Studio / replay / labs). */
export function applyFailureBeat(id: FailureBeatId) {
  const beat = FAILURE_BEATS[id];
  current = normalizeCast({ ...current, ...beat.cast });
  persist(current);
  notify();
  activeBeat = id;
  persistBeat(activeBeat);
  notifyBeat();
}

export function subscribeBeat(listener: Listener): () => void {
  beatListeners.add(listener);
  return () => {
    beatListeners.delete(listener);
  };
}

/** Jump without inventing routes — App already listens to hashchange. */
export function openStoryHash(id: string) {
  window.location.hash = id;
}

/**
 * Upstream blame g for the 2-row cast layer W — first two CE ∂L/∂z entries
 * from softmaxLossGrad(cast.scores, cast.correct). No new cast field.
 */
export function layerUpstreamG(cast: StoryCast): [number, number] {
  const { grad } = softmaxLossGrad(cast.scores, cast.correct);
  return [grad[0], grad[1]];
}

/** Input blame Wᵀg on the shared cast — column j of W dotted with g. */
export function layerInputBlame(cast: StoryCast): [number, number, number] {
  const g = layerUpstreamG(cast);
  const blamed = matvec(transpose(cast.W), g);
  return [blamed[0], blamed[1], blamed[2]];
}

/** Derived quantities — only via existing math.ts helpers. */
export function storyDerived(cast: StoryCast) {
  const q2 = [cast.x[0], cast.x[1]];
  const k2 = [cast.k[0], cast.k[1]];
  const agreement2 = dot(q2, k2);
  const agreement3 = dot(cast.x, cast.k);
  const layer = add(matvec(cast.W, cast.x), cast.b);
  const net = backprop(cast.x[0], cast.w1, cast.w2, cast.target);
  const probs = softmax(cast.scores);
  const soft = softmaxLossGrad(cast.scores, cast.correct);
  const nextWeight = gdStep(cast.weight, cast.eta);
  const bowlLoss = (cast.weight - 3) ** 2;
  const g = layerUpstreamG(cast);
  const inputBlame = layerInputBlame(cast);
  return { q2, k2, agreement2, agreement3, layer, net, probs, soft, nextWeight, bowlLoss, g, inputBlame };
}

/** One computed stamp from the shared cast — every training surface must echo these fields. */
export type LossPassportStamp = {
  loss: number;
  prediction: number;
  /** True when ReLU gate is open (h > 0 / gate = 1). */
  gateOpen: boolean;
  dLossDw1: number;
  dLossDw2: number;
};

/** Passport numbers only via backprop on cast x₁, w₁, w₂, target. */
export function lossPassport(cast: StoryCast): LossPassportStamp {
  const net = backprop(cast.x[0], cast.w1, cast.w2, cast.target);
  return {
    loss: net.loss,
    prediction: net.prediction,
    gateOpen: net.gate > 0,
    dLossDw1: net.dLossDw1,
    dLossDw2: net.dLossDw2,
  };
}

export function useStoryCast() {
  const [cast, setLocal] = useState<StoryCast>(() => getCast());

  useEffect(() => subscribeCast(() => setLocal(getCast())), []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORY_STORAGE_KEY) {
        current = loadCastFromStorage();
        notify();
      }
      if (event.key === BEAT_STORAGE_KEY) {
        activeBeat = loadBeatFromStorage();
        notifyBeat();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { cast, patchCast, resetCast, setCast, applyFailureBeat, clearFailureBeat } as const;
}

export function useFailureBeat() {
  const [beatId, setBeatId] = useState<FailureBeatId | null>(() => getActiveBeatId());

  useEffect(() => subscribeBeat(() => setBeatId(getActiveBeatId())), []);

  const beat = beatId ? FAILURE_BEATS[beatId] : null;
  return { beatId, beat, applyFailureBeat, clearFailureBeat, setActiveBeat, openStoryHash } as const;
}
