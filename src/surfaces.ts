/** Innovation surfaces (hash routes that are not curriculum lesson ids). */

export type SurfaceMeta = {
  id: string;
  title: string;
  blurb: string;
  /** Iteration that shipped this surface. */
  iter: number;
};

export const SURFACES: SurfaceMeta[] = [
  {
    id: "pipeline",
    title: "Forward / Backward Walk",
    blurb: "Tiny-net flowchart: step forward, then backprop. Tap a node for its lesson.",
    iter: 2,
  },
  {
    id: "landscape",
    title: "Loss Landscape Journey",
    blurb: "Hike a 2D loss terrain along the gradient path. Partials, η, curvature.",
    iter: 3,
  },
  {
    id: "spotlight",
    title: "Attention Spotlight",
    blurb: "Query spotlight on keys — brightness from scores and softmax.",
    iter: 4,
  },
  {
    id: "scores",
    title: "Score Matrix Arena",
    blurb: "QKᵀ as a heat stage — tap a cell, expand q·k, light the row’s softmax.",
    iter: 11,
  },
  {
    id: "mixer",
    title: "Value Mixer",
    blurb: "Pour · scale · stack — αᵢ vᵢ add into one attention output o.",
    iter: 12,
  },
  {
    id: "machine",
    title: "Matrix as Machine",
    blurb: "Row-workers each run a dot. Forward, transpose, and rank modes.",
    iter: 5,
  },
  {
    id: "twins",
    title: "Twin Models",
    blurb: "Untrained / dead ReLU / bad η vs after honest updates.",
    iter: 6,
  },
  {
    id: "replay",
    title: "Story Replay",
    blurb: "Scrub time across the shared cast; chapters light in order.",
    iter: 8,
  },
  {
    id: "interview",
    title: "Interview Route",
    blurb: "Walk only the stations needed to answer one interview ask aloud.",
    iter: 9,
  },
  {
    id: "synthesis",
    title: "Synthesis Wall",
    blurb: "One screen: map · pipeline · landscape · spotlight on the same cast.",
    iter: 10,
  },
];

export const SURFACE_IDS = new Set(SURFACES.map((s) => s.id));

export function surfaceById(id: string): SurfaceMeta | undefined {
  return SURFACES.find((s) => s.id === id);
}
