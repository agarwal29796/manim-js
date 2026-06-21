import { describe, expect, it } from "vitest";
import { easeInOut, linear, thereAndBack } from "../src/core/easing";
import {
  Scene,
  circle,
  create,
  fadeIn,
  fadeOut,
  shift,
  square,
  text,
  transform,
} from "../src/core/index";
import { clamp, lerp, lerpColor, lerpPoints, resample } from "../src/core/util";

describe("easing", () => {
  it("hits the right endpoints", () => {
    expect(linear(0)).toBe(0);
    expect(linear(1)).toBe(1);
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 5);
  });

  it("thereAndBack returns to start at the midpoint peak", () => {
    expect(thereAndBack(0)).toBeCloseTo(0, 5);
    expect(thereAndBack(0.5)).toBeCloseTo(1, 5);
    expect(thereAndBack(1)).toBeCloseTo(0, 5);
  });
});

describe("util", () => {
  it("lerp / clamp", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(clamp(-3, 0, 1)).toBe(0);
    expect(clamp(9, 0, 1)).toBe(1);
  });

  it("lerpColor blends channels", () => {
    expect(lerpColor("#000000", "#ffffff", 0)).toBe("rgb(0, 0, 0)");
    expect(lerpColor("#000000", "#ffffff", 1)).toBe("rgb(255, 255, 255)");
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("rgb(128, 128, 128)");
  });

  it("resample yields exactly n evenly-spaced points (open path)", () => {
    const pts = resample(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      false,
      3
    );
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[1].x).toBeCloseTo(5, 5);
    expect(pts[2].x).toBeCloseTo(10, 5);
  });

  it("lerpPoints interpolates matched point sets", () => {
    const a = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const b = [
      { x: 0, y: 10 },
      { x: 10, y: 10 },
    ];
    const mid = lerpPoints(a, b, 0.5);
    expect(mid[0].y).toBeCloseTo(5, 5);
    expect(mid[1].y).toBeCloseTo(5, 5);
  });
});

describe("scene timeline", () => {
  it("computes total duration from play()/wait()", () => {
    const s = new Scene();
    const c = circle({ r: 10 });
    s.play(create(c), { run: 1 });
    s.wait(0.5);
    expect(s.compile().durationMs).toBe(1500);
  });

  it("create() animates draw 0 -> 1 with the chosen easing", () => {
    const s = new Scene();
    const c = circle({ r: 10 });
    s.play(create(c), { run: 1 }); // default ease = easeInOut
    const tl = s.compile();

    const start = tl.sample(0)[0];
    const mid = tl.sample(500)[0];
    const end = tl.sample(1000)[0];
    expect(start.kind).toBe("poly");
    if (start.kind === "poly") expect(start.draw).toBe(0);
    if (mid.kind === "poly") expect(mid.draw).toBeCloseTo(easeInOut(0.5), 5);
    if (end.kind === "poly") expect(end.draw).toBe(1);
  });

  it("is a pure function of time (same t -> identical ops)", () => {
    const s = new Scene();
    const c = circle({ r: 10 });
    s.play(create(c));
    s.play(transform(c, square({ size: 40 })));
    const tl = s.compile();
    expect(tl.sample(800)).toEqual(tl.sample(800));
  });

  it("respects intro (hidden before added) and fadeOut removal", () => {
    const s = new Scene();
    const c = circle({ r: 10 });
    s.wait(1); // c not introduced yet
    s.play(fadeIn(c), { run: 1 }); // 1000..2000
    s.play(fadeOut(c), { run: 1 }); // 2000..3000
    const tl = s.compile();

    expect(tl.sample(500)).toHaveLength(0); // before intro: nothing drawn
    expect(tl.sample(1500)).toHaveLength(1); // visible during fade-in
    expect(tl.sample(3000)).toHaveLength(0); // removed after fade-out ends
  });

  it("does not bleed a future track value backward", () => {
    // regression: an unstarted track must not apply its `from` early.
    const s = new Scene();
    const c = circle({ r: 10, stroke: "#5B5BD6" });
    const sq = square({ size: 40, stroke: "#FF6B5B" });
    s.play(create(c), { run: 1 }); // 0..1000
    s.play(transform(c, sq), { run: 1 }); // 1000..2000 (recolours to coral)
    const tl = s.compile();
    const before = tl.sample(500)[0];
    if (before.kind === "poly") expect(before.stroke).toBe("#5B5BD6"); // still indigo
  });

  it("text uses reveal (typewriter), not stroke draw", () => {
    const s = new Scene();
    const t = text("hello");
    s.play(fadeIn(t), { run: 1 });
    const op = s.compile().sample(0)[0];
    expect(op.kind).toBe("text");
    if (op.kind === "text") expect(op.opacity).toBe(0);
  });
});
