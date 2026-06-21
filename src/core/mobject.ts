import { type Vec, centroid } from "./util";

// ---------------------------------------------------------------------------
// Mobjects ("mathematical objects", Manim's term). Almost everything is a
// VMobject: an ordered set of points + a closed flag + stroke/fill style.
// Representing shapes as point sets is what makes morphing (Transform) work
// for ANY pair of shapes — resample both to the same count and interpolate.
//
// Text is the one special case (rendered by the renderer's text API).
// ---------------------------------------------------------------------------

export interface BaseStyle {
  stroke: string;
  fill: string | null;
  strokeWidth: number;
  opacity: number;
}

const DEFAULT_STYLE: BaseStyle = {
  stroke: "#5B5BD6",
  fill: null,
  strokeWidth: 6,
  opacity: 1,
};

let _id = 0;
export const nextId = () => `m${_id++}`;

export type MobjectKind = "poly" | "text";

export interface Mobject {
  id: string;
  kind: MobjectKind;
  style: BaseStyle;
  // poly:
  points?: Vec[];
  closed?: boolean;
  // text:
  text?: string;
  pos?: Vec;
  size?: number;
  font?: string;
  align?: "left" | "center" | "right";
  center: () => Vec;
}

function poly(points: Vec[], closed: boolean, style?: Partial<BaseStyle>): Mobject {
  const s = { ...DEFAULT_STYLE, ...style };
  return {
    id: nextId(),
    kind: "poly",
    points,
    closed,
    style: s,
    center: () => centroid(points),
  };
}

// ---- shape factories ------------------------------------------------------

export function circle(
  opts: {
    x?: number;
    y?: number;
    r?: number;
    segments?: number;
  } & Partial<BaseStyle> = {}
): Mobject {
  const { x = 0, y = 0, r = 100, segments = 64, ...style } = opts;
  const pts: Vec[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
  }
  return poly(pts, true, style);
}

export function square(
  opts: { x?: number; y?: number; size?: number } & Partial<BaseStyle> = {}
): Mobject {
  const { x = 0, y = 0, size = 160, ...style } = opts;
  const h = size / 2;
  return rect({ x: x - h, y: y - h, w: size, h: size, ...style });
}

export function rect(
  opts: { x?: number; y?: number; w?: number; h?: number } & Partial<BaseStyle> = {}
): Mobject {
  const { x = -80, y = -80, w = 160, h = 160, ...style } = opts;
  // Many points per side so morphs into curved shapes stay smooth.
  const per = 16;
  const corners: Vec[] = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
  const pts: Vec[] = [];
  for (let c = 0; c < 4; c++) {
    const a = corners[c];
    const b = corners[(c + 1) % 4];
    for (let i = 0; i < per; i++) {
      const f = i / per;
      pts.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
    }
  }
  return poly(pts, true, style);
}

export function polygon(points: Vec[], style?: Partial<BaseStyle>): Mobject {
  return poly(points, true, style);
}

export function line(a: Vec, b: Vec, style?: Partial<BaseStyle>): Mobject {
  return poly([a, b], false, style);
}

// y = f(x) sampled across [x0, x1]; `sx`/`sy` scale data units to pixels.
export function functionGraph(
  f: (x: number) => number,
  opts: {
    x0?: number;
    x1?: number;
    samples?: number;
    sx?: number;
    sy?: number;
    cx?: number;
    cy?: number;
  } & Partial<BaseStyle> = {}
): Mobject {
  const {
    x0 = -5,
    x1 = 5,
    samples = 120,
    sx = 40,
    sy = 40,
    cx = 0,
    cy = 0,
    ...style
  } = opts;
  const pts: Vec[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = x0 + ((x1 - x0) * i) / samples;
    pts.push({ x: cx + x * sx, y: cy - f(x) * sy });
  }
  return poly(pts, false, style);
}

export interface NumberLineOpts extends Partial<BaseStyle> {
  min?: number;
  max?: number;
  /** Pixels per unit. */
  unit?: number;
  /** Vertical position of the axis. */
  y?: number;
  /** Tick spacing in units. */
  step?: number;
  tickHeight?: number;
  /** Axis/tick colour. */
  color?: string;
  labelColor?: string;
  labelSize?: number;
  includeArrows?: boolean;
  showLabels?: boolean;
  /** Extra axis length past the end ticks, in pixels. */
  pad?: number;
}

export interface NumberLine {
  axis: Mobject;
  ticks: Mobject[];
  labels: Mobject[];
  arrows: Mobject[];
  unit: number;
  y: number;
  /** Pixel point on the line for a given value (place dots/markers here). */
  at: (value: number) => Vec;
}

// A Manim-style number line: an axis + evenly spaced ticks + numeric labels,
// returned as separate mobjects so you can animate them however you like
// (e.g. `create(nl.axis)`, then `nl.ticks.map(create)`). `nl.at(v)` gives the
// pixel position of a value so you can place a travelling dot.
export function numberLine(opts: NumberLineOpts = {}): NumberLine {
  const {
    min = -5,
    max = 5,
    unit = 90,
    y = 0,
    step = 1,
    tickHeight = 12,
    color = "#20242E",
    labelColor = "#5A6072",
    labelSize = 26,
    includeArrows = true,
    showLabels = true,
    pad = 40,
    strokeWidth = 5,
  } = opts;

  const xL = min * unit - pad;
  const xR = max * unit + pad;
  const axis = line({ x: xL, y }, { x: xR, y }, { stroke: color, strokeWidth });

  const ticks: Mobject[] = [];
  const labels: Mobject[] = [];
  for (let n = min; n <= max + 1e-9; n += step) {
    const x = Math.round(n * unit);
    ticks.push(
      line(
        { x, y: y - tickHeight },
        { x, y: y + tickHeight },
        {
          stroke: color,
          strokeWidth: Math.max(2, strokeWidth - 2),
        }
      )
    );
    if (showLabels) {
      const lbl = Number.isInteger(n) ? String(n) : n.toFixed(1);
      labels.push(
        text(lbl, { x, y: y + tickHeight + labelSize, size: labelSize, fill: labelColor })
      );
    }
  }

  const arrows: Mobject[] = [];
  if (includeArrows) {
    const a = Math.max(10, tickHeight + 2);
    arrows.push(
      polygon(
        [
          { x: xR, y },
          { x: xR - a * 1.6, y: y - a },
          { x: xR - a * 1.6, y: y + a },
        ],
        { fill: color, stroke: color, strokeWidth: 2 }
      )
    );
    arrows.push(
      polygon(
        [
          { x: xL, y },
          { x: xL + a * 1.6, y: y - a },
          { x: xL + a * 1.6, y: y + a },
        ],
        { fill: color, stroke: color, strokeWidth: 2 }
      )
    );
  }

  return {
    axis,
    ticks,
    labels,
    arrows,
    unit,
    y,
    at: (v: number) => ({ x: v * unit, y }),
  };
}

export function text(
  str: string,
  opts: {
    x?: number;
    y?: number;
    size?: number;
    font?: string;
    align?: "left" | "center" | "right";
  } & Partial<BaseStyle> = {}
): Mobject {
  const {
    x = 0,
    y = 0,
    size = 64,
    font = "sans-serif",
    align = "center",
    ...style
  } = opts;
  const s = { ...DEFAULT_STYLE, fill: "#20242E", stroke: "#20242E", ...style };
  return {
    id: nextId(),
    kind: "text",
    text: str,
    pos: { x, y },
    size,
    font,
    align,
    style: s,
    center: () => ({ x, y }),
  };
}
