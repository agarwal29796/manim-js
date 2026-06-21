// The gallery's demo scenes. Each `code` string is the EXACT source shown in
// the card and the EXACT source that runs (compiled via new Function with the
// manim-js API in scope) — so the gallery never lies about what produces a
// preview. (0,0) is the centre of each canvas; `width`/`height` are injected.

export interface Demo {
  title: string;
  desc: string;
  code: string;
}

export const DEMOS: Demo[] = [
  {
    title: "Shape morph",
    desc: "transform() interpolates any pair of shapes — circle → square → triangle.",
    code: `const s = new Scene({ width, height });
const c = circle({ r: 90, stroke: "#5B5BD6", strokeWidth: 8 });

s.play(create(c));
s.play(transform(c, square({ size: 170, stroke: "#FF6B5B", strokeWidth: 8 })));
s.play(transform(c, polygon(
  [{ x: 0, y: -100 }, { x: 95, y: 70 }, { x: -95, y: 70 }],
  { stroke: "#13B8A6", strokeWidth: 8 }
)));
return s;`,
  },
  {
    title: "Number line",
    desc: "The numberLine() helper, plus a marker dot hopping between values.",
    code: `const s = new Scene({ width, height });
const nl = numberLine({ min: -4, max: 4, unit: 55, y: 20 });
const dot = circle({ x: nl.at(0).x, y: nl.at(0).y, r: 11, stroke: "#FF6B5B", fill: "#FF6B5B" });

s.play(create(nl.axis), ...nl.arrows.map((a) => create(a)), { run: 0.7 });
s.play(...nl.ticks.map((t) => create(t)), { run: 0.6 });
s.play(...nl.labels.map((l) => write(l)), { run: 0.6 });
s.play(fadeIn(dot), { run: 0.3 });
s.play(shift(dot, nl.at(3).x - nl.at(0).x, 0));
s.play(indicate(dot, { scale: 1.5, color: "#13B8A6" }));
s.play(shift(dot, nl.at(-2).x - nl.at(3).x, 0));
return s;`,
  },
  {
    title: "Function graph",
    desc: "functionGraph() samples y = f(x); create() draws the curve on.",
    code: `const s = new Scene({ width, height });
const ax = line({ x: -240, y: 0 }, { x: 240, y: 0 }, { stroke: "#C9C4B8", strokeWidth: 3 });
const ay = line({ x: 0, y: -150 }, { x: 0, y: 150 }, { stroke: "#C9C4B8", strokeWidth: 3 });
const g = functionGraph((x) => Math.sin(x), {
  x0: -6, x1: 6, sx: 38, sy: 70, stroke: "#13B8A6", strokeWidth: 6,
});
s.add(ax, ay);
s.play(create(g), { run: 1.6 });
return s;`,
  },
  {
    title: "Curve morph",
    desc: "Curves are point sets too — morph a sine wave into a parabola.",
    code: `const s = new Scene({ width, height });
const sine = functionGraph((x) => Math.sin(x), {
  x0: -3.14, x1: 3.14, sx: 60, sy: 80, stroke: "#5B5BD6", strokeWidth: 6,
});
const para = functionGraph((x) => 0.25 * x * x - 1.2, {
  x0: -3.14, x1: 3.14, sx: 60, sy: 80, stroke: "#F5A524", strokeWidth: 6,
});
s.play(create(sine));
s.play(transform(sine, para), { run: 1.2 });
return s;`,
  },
  {
    title: "Write text",
    desc: "Typewriter reveal for text, then a hand-drawn underline.",
    code: `const s = new Scene({ width, height });
const t = text("Hello, Manim.js", { y: -16, size: 52, fill: "#20242E" });
const u = line({ x: -190, y: 34 }, { x: 190, y: 34 }, { stroke: "#FF6B5B", strokeWidth: 6 });
s.play(write(t, 1.2));
s.play(create(u), { run: 0.6 });
return s;`,
  },
  {
    title: "Rotate & scale",
    desc: "Affine animations: rotate, scaleBy, and an indicate() pulse.",
    code: `const s = new Scene({ width, height });
const sq = square({ size: 140, stroke: "#5B5BD6", strokeWidth: 8 });
s.play(create(sq));
s.play(rotate(sq, Math.PI / 2), { run: 0.9 });
s.play(scaleBy(sq, 1.4), { run: 0.6 });
s.play(indicate(sq, { scale: 1.2, color: "#FF6B5B" }));
s.play(rotate(sq, -Math.PI / 2), { run: 0.9 });
return s;`,
  },
  {
    title: "Polygon morph",
    desc: "Define shapes from raw points — triangle → pentagon → star.",
    code: `const s = new Scene({ width, height });
const ring = (n, r, rot) => Array.from({ length: n }, (_, i) => {
  const a = rot + (i / n) * Math.PI * 2;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
});
const star = (n, R, r, rot) => Array.from({ length: 2 * n }, (_, i) => {
  const a = rot + (i / (2 * n)) * Math.PI * 2;
  const rr = i % 2 ? r : R;
  return { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
});
const top = -Math.PI / 2;
const p = polygon(ring(3, 100, top), { stroke: "#13B8A6", strokeWidth: 7 });
s.play(create(p));
s.play(transform(p, polygon(ring(5, 100, top), { stroke: "#5B5BD6", strokeWidth: 7 })));
s.play(transform(p, polygon(star(5, 110, 46, top), { stroke: "#F5A524", strokeWidth: 7 })));
return s;`,
  },
  {
    title: "Bar chart",
    desc: "Bars grow from the baseline by morphing flat rects into full ones.",
    code: `const s = new Scene({ width, height });
const base = 120, bw = 46;
const data = [
  { x: -180, h: 60,  c: "#5B5BD6" },
  { x: -90,  h: 150, c: "#FF6B5B" },
  { x: 0,    h: 100, c: "#13B8A6" },
  { x: 90,   h: 200, c: "#F5A524" },
  { x: 180,  h: 130, c: "#3DA5F5" },
];
const flat = (d) => rect({ x: d.x - bw / 2, y: base, w: bw, h: 0.1, stroke: d.c, fill: d.c, strokeWidth: 3 });
const full = (d) => rect({ x: d.x - bw / 2, y: base - d.h, w: bw, h: d.h, stroke: d.c, fill: d.c, strokeWidth: 3 });
const bars = data.map(flat);
s.add(...bars);
s.play(...bars.map((b, i) => transform(b, full(data[i]))), { run: 1 });
return s;`,
  },
  {
    title: "Sketch (draw-on)",
    desc: "create() reveals strokes like a pen — a little house, drawn on.",
    code: `const s = new Scene({ width, height });
const walls = rect({ x: -80, y: -20, w: 160, h: 140, stroke: "#5B5BD6", strokeWidth: 7 });
const roof = polygon([{ x: -100, y: -20 }, { x: 0, y: -110 }, { x: 100, y: -20 }], { stroke: "#FF6B5B", strokeWidth: 7 });
const door = rect({ x: -25, y: 55, w: 50, h: 65, stroke: "#13B8A6", strokeWidth: 6 });
const sun = circle({ x: 150, y: -90, r: 30, stroke: "#F5A524", strokeWidth: 6 });
s.play(create(walls));
s.play(create(roof), { run: 0.6 });
s.play(create(door), { run: 0.6 });
s.play(create(sun), { run: 0.6 });
return s;`,
  },
  {
    title: "Color cycle",
    desc: "transform() interpolates fill + stroke colours, not just geometry.",
    code: `const s = new Scene({ width, height });
const disc = (col) => circle({ r: 90, stroke: col, fill: col, strokeWidth: 6 });
const c = disc("#5B5BD6");
s.play(fadeIn(c));
s.play(transform(c, disc("#FF6B5B")));
s.play(transform(c, disc("#13B8A6")));
s.play(transform(c, disc("#F5A524")));
return s;`,
  },
];
