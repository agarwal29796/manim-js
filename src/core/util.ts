// Small math / color / geometry helpers used across the engine.
// No DOM, no dependencies — this file (and all of core/) must stay
// renderer-agnostic so it can be open-sourced and embedded anywhere.

export interface Vec {
  x: number;
  y: number;
}

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

// ---- colours -------------------------------------------------------------

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseColor(c: string): Rgb {
  const m = HEX.exec(c.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

export function lerpColor(a: string, b: string, t: number): string {
  const x = parseColor(a);
  const y = parseColor(b);
  const r = Math.round(lerp(x.r, y.r, t));
  const g = Math.round(lerp(x.g, y.g, t));
  const bl = Math.round(lerp(x.b, y.b, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

// ---- polyline geometry ---------------------------------------------------

export function centroid(pts: Vec[]): Vec {
  if (pts.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}

export function pathLength(pts: Vec[], closed: boolean): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  if (closed && pts.length > 1) {
    const a = pts[pts.length - 1];
    const b = pts[0];
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}

// Resample a polyline to exactly `n` points evenly spaced by arc length.
// This is the heart of shape morphing: two different shapes resampled to the
// same point count can be interpolated component-wise (circle -> square, etc).
export function resample(src: Vec[], closed: boolean, n: number): Vec[] {
  if (src.length === 0) return [];
  if (src.length === 1) return new Array(n).fill(0).map(() => ({ ...src[0] }));

  const pts = closed ? [...src, src[0]] : src;
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return new Array(n).fill(0).map(() => ({ ...src[0] }));

  const out: Vec[] = [];
  const step = total / (closed ? n : n - 1);
  let seg = 0;
  let accum = 0; // distance covered up to start of current segment
  for (let i = 0; i < n; i++) {
    const target = i * step;
    while (seg < segLens.length - 1 && accum + segLens[seg] < target) {
      accum += segLens[seg];
      seg++;
    }
    const segLen = segLens[seg] || 1;
    const f = clamp((target - accum) / segLen, 0, 1);
    out.push(lerpVec(pts[seg], pts[seg + 1], f));
  }
  return out;
}

export function lerpPoints(a: Vec[], b: Vec[], t: number): Vec[] {
  const n = Math.max(a.length, b.length);
  const aa = a.length === n ? a : resample(a, true, n);
  const bb = b.length === n ? b : resample(b, true, n);
  const out: Vec[] = [];
  for (let i = 0; i < n; i++) out.push(lerpVec(aa[i], bb[i], t));
  return out;
}
