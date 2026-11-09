/**
 * Idea Subway Map graph — stations are curriculum lesson ids only.
 * Edges encode teaching / prereq order plus AI-pipeline groupings.
 * Narrative chapter titles live in storyChapters.ts and attach via mapGraphExport.
 */

import { chapterTitles, chaptersOnLine, pipelineRoute, stationChapters } from "./storyChapters";

export type RouteId = "algebra" | "calculus" | "shapes" | "attention" | "training";

export type Station = {
  id: string;
  /** Short label on the map (field name from curriculum). */
  label: string;
  part: "algebra" | "calculus";
  x: number;
  y: number;
};

export type Edge = {
  from: string;
  to: string;
  /** Primary route this segment belongs to (for stroke color). */
  route: RouteId;
};

export type RouteMeta = {
  id: RouteId;
  name: string;
  color: string;
  /** One-line teaching intent for Agent 3 narrative labels. */
  intent: string;
};

export const ROUTES: RouteMeta[] = [
  {
    id: "algebra",
    name: "Algebra",
    color: "#172554",
    intent: "Lists → tables → independent directions along the algebra interview track.",
  },
  {
    id: "calculus",
    name: "Calculus",
    color: "#b45309",
    intent: "Loss as a function → slope → derivative → several variables along the calculus track.",
  },
  {
    id: "shapes",
    name: "Shapes",
    color: "#1d4ed8",
    intent: "Feature vector through Wx and AB into the Jacobian backward table.",
  },
  {
    id: "attention",
    name: "Attention",
    color: "#059669",
    intent: "q·k, √d scale, Kᵀ, score matrix, then softmax scores to a loss.",
  },
  {
    id: "training",
    name: "Training",
    color: "#b45309",
    intent: "One weight on a bowl → gradient step → chain rule backprop → curvature. (dashed on map)",
  },
];

/** Pixel layout inside viewBox 0 0 920 520 — designed to read as a transit map. */
export const STATIONS: Station[] = [
  // Algebra spine (upper band)
  { id: "vectors", label: "Vectors", part: "algebra", x: 70, y: 120 },
  { id: "combine", label: "Combine", part: "algebra", x: 170, y: 70 },
  { id: "dot", label: "Dot", part: "algebra", x: 170, y: 170 },
  { id: "norm", label: "Norms", part: "algebra", x: 280, y: 170 },
  { id: "linear-layer", label: "Wx+b", part: "algebra", x: 280, y: 70 },
  { id: "multiply", label: "AB", part: "algebra", x: 400, y: 70 },
  { id: "transpose", label: "Aᵀ", part: "algebra", x: 400, y: 170 },
  { id: "rank", label: "Rank", part: "algebra", x: 520, y: 70 },
  { id: "eigen", label: "Eigen", part: "algebra", x: 640, y: 70 },
  { id: "quadratic", label: "xᵀAx", part: "algebra", x: 760, y: 70 },

  // Calculus spine (lower band)
  { id: "function", label: "L(w)", part: "calculus", x: 70, y: 320 },
  { id: "slope", label: "Slope", part: "calculus", x: 170, y: 370 },
  { id: "derivative", label: "f′", part: "calculus", x: 280, y: 370 },
  { id: "rules", label: "Rules", part: "calculus", x: 400, y: 370 },
  { id: "partials", label: "∂L/∂w", part: "calculus", x: 520, y: 370 },
  { id: "descent", label: "Descent", part: "calculus", x: 640, y: 370 },
  { id: "chain", label: "Chain", part: "calculus", x: 760, y: 320 },
  { id: "softmax", label: "Softmax", part: "calculus", x: 520, y: 250 },
  { id: "jacobian", label: "Jacob.", part: "calculus", x: 640, y: 250 },
  { id: "curvature", label: "f″", part: "calculus", x: 860, y: 370 },
];

/**
 * Directed teaching edges. Algebra/calculus edges follow curriculum order;
 * shapes / attention / training weave the AI pipeline.
 */
export const EDGES: Edge[] = [
  // Algebra spine (curriculum order)
  { from: "vectors", to: "combine", route: "algebra" },
  { from: "combine", to: "dot", route: "algebra" },
  { from: "dot", to: "norm", route: "algebra" },
  { from: "norm", to: "linear-layer", route: "algebra" },
  { from: "linear-layer", to: "multiply", route: "algebra" },
  { from: "multiply", to: "transpose", route: "algebra" },
  { from: "transpose", to: "rank", route: "algebra" },
  { from: "rank", to: "eigen", route: "algebra" },
  { from: "eigen", to: "quadratic", route: "algebra" },

  // Calculus spine (curriculum order) — softmax/jacobian sit on pipeline lines
  { from: "function", to: "slope", route: "calculus" },
  { from: "slope", to: "derivative", route: "calculus" },
  { from: "derivative", to: "rules", route: "calculus" },
  { from: "rules", to: "partials", route: "calculus" },
  { from: "partials", to: "descent", route: "calculus" },
  { from: "descent", to: "chain", route: "calculus" },
  { from: "chain", to: "curvature", route: "calculus" },

  // Shapes: feature vector → layer → product → transpose → Jacobian
  { from: "vectors", to: "combine", route: "shapes" },
  { from: "combine", to: "linear-layer", route: "shapes" },
  { from: "linear-layer", to: "multiply", route: "shapes" },
  { from: "multiply", to: "transpose", route: "shapes" },
  { from: "transpose", to: "jacobian", route: "shapes" },
  { from: "linear-layer", to: "jacobian", route: "shapes" },

  // Attention: q·k / √d / Kᵀ / QKᵀ / softmax
  { from: "vectors", to: "dot", route: "attention" },
  { from: "dot", to: "norm", route: "attention" },
  { from: "norm", to: "transpose", route: "attention" },
  { from: "transpose", to: "multiply", route: "attention" },
  { from: "multiply", to: "softmax", route: "attention" },
  { from: "norm", to: "softmax", route: "attention" },

  // Training: bowl → slope → rules → ∇ → step → backprop → curvature
  { from: "function", to: "slope", route: "training" },
  { from: "slope", to: "derivative", route: "training" },
  { from: "derivative", to: "rules", route: "training" },
  { from: "rules", to: "partials", route: "training" },
  { from: "partials", to: "descent", route: "training" },
  { from: "descent", to: "chain", route: "training" },
  { from: "chain", to: "curvature", route: "training" },
  { from: "quadratic", to: "function", route: "training" },
  { from: "partials", to: "jacobian", route: "training" },
];

export const MAP_VIEWBOX = { width: 920, height: 520 } as const;

/**
 * Cross-map transfers (Iter 7): conceptual bridges that are not mere curriculum edges.
 * Rendered as labeled arcs so cosine ↔ √d ↔ softmax differences stay visible.
 */
export type Transfer = {
  id: string;
  from: string;
  to: string;
  /** Short label drawn on the arc. */
  label: string;
  /** What difference this transfer teaches. */
  diff: string;
};

export const TRANSFERS: Transfer[] = [
  {
    id: "dot-cosine",
    from: "dot",
    to: "norm",
    label: "cosine",
    diff: "Raw q·k stretches with length; cosine keeps only the angle.",
  },
  {
    id: "norm-sqrtd",
    from: "norm",
    to: "softmax",
    label: "÷√d",
    diff: "Raw gaps grow like √d → peaked α (not a flat row); ÷√d restores a usable blend — Peak↔Blend on #scores → #spotlight → #mixer.",
  },
  {
    id: "dot-softmax",
    from: "dot",
    to: "softmax",
    label: "scores→bets",
    diff: "Match scores become a probability simplex only after softmax.",
  },
  {
    id: "multiply-softmax",
    from: "multiply",
    to: "softmax",
    label: "QKᵀ row",
    diff: "One row of the score matrix is a vector of dots ready for softmax — see the Score Matrix Arena (#scores) heat stage.",
  },
  {
    id: "softmax-combine",
    from: "softmax",
    to: "combine",
    label: "α·v → o",
    diff: "Softmax weights scale value rods and add them into one output — see the Value Mixer (#mixer).",
  },
];

export function stationById(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

export function routeById(id: RouteId): RouteMeta {
  return ROUTES.find((r) => r.id === id)!;
}

/** Compact export: graph + Training Story chapter titles (no layout ownership). */
export const mapGraphExport = {
  viewBox: MAP_VIEWBOX,
  routes: ROUTES,
  stations: STATIONS,
  edges: EDGES,
  transfers: TRANSFERS,
  /** Short chapter titles keyed by lesson id (Attention / Training / key Shapes). */
  chapterTitles,
  stationChapters,
  pipelineRoute,
  attentionChapters: chaptersOnLine("attention"),
  trainingChapters: chaptersOnLine("training"),
  shapesChapters: chaptersOnLine("shapes"),
} as const;
