import type { Vec } from "./util";

// ---------------------------------------------------------------------------
// The Intermediate Representation (IR) and the Renderer seam.
//
// This is the ENTIRE public contract between the engine and whatever draws
// pixels. The engine compiles a scene into a `Timeline` whose `sample(t)`
// returns a flat list of `DrawOp`s — pure data, deterministic in `t`. A
// Renderer just knows how to paint those ops. TeachBoard implements its own
// Renderer (drawing through its canvas pipeline); the OSS build ships a
// Canvas2D one. Keep this file tiny and stable — it is the API everyone codes
// against.
// ---------------------------------------------------------------------------

export interface PolyOp {
  kind: "poly";
  /** Absolute coordinates, already transformed. */
  points: Vec[];
  closed: boolean;
  stroke: string;
  strokeWidth: number;
  fill: string | null;
  opacity: number;
  /** Stroke draw-on fraction 0..1 (Manim's `Create`). 1 = fully drawn. */
  draw: number;
}

export interface TextOp {
  kind: "text";
  text: string;
  x: number;
  y: number;
  size: number;
  font: string;
  color: string;
  opacity: number;
  align: "left" | "center" | "right";
  /** Typewriter reveal fraction 0..1 (Manim's `Write` for text). */
  reveal: number;
}

export type DrawOp = PolyOp | TextOp;

export interface Timeline {
  /** Total length in milliseconds. */
  durationMs: number;
  /** Pure function of time: same `t` always yields the same ops. */
  sample: (tMs: number) => DrawOp[];
}

export interface Renderer {
  /** Clear the surface for a fresh frame. */
  clear: (width: number, height: number) => void;
  /** Paint one op. Called once per op, in order, every frame. */
  draw: (op: DrawOp) => void;
}

export function renderFrame(
  renderer: Renderer,
  timeline: Timeline,
  tMs: number,
  width: number,
  height: number
): void {
  renderer.clear(width, height);
  for (const op of timeline.sample(tMs)) renderer.draw(op);
}
