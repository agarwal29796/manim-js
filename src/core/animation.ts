import { type Ease, thereAndBack } from "./easing";
import type { Mobject } from "./mobject";
import type { Anim } from "./scene";

// ---------------------------------------------------------------------------
// Animation factories. Each returns an `Anim` whose build() snapshots the
// target's current recorded state into a Track. This is the Manim-flavoured
// authoring vocabulary: Create, Write, FadeIn/Out, Transform, Shift, Scale,
// Rotate, Indicate.
// ---------------------------------------------------------------------------

/** Draw a shape on, stroke flowing like ink (Manim's Create). */
export function create(m: Mobject, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      scene._work(m);
      scene._introduce(m, start);
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: { draw: { from: 0, to: 1 } },
      });
    },
  };
}

/** Reveal text (typewriter) or draw a shape on. */
export function write(m: Mobject, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      scene._work(m);
      scene._introduce(m, start);
      const field = m.kind === "text" ? "reveal" : "draw";
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: { [field]: { from: 0, to: 1 } } as never,
      });
    },
  };
}

export function fadeIn(m: Mobject, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      const w = scene._work(m);
      scene._introduce(m, start);
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: { opacity: { from: 0, to: w.opacity } },
      });
    },
  };
}

export function fadeOut(m: Mobject, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      const w = scene._work(m);
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: { opacity: { from: w.opacity, to: 0 } },
      });
      scene._remove(m, start + dur);
    },
  };
}

/**
 * Morph `m` into the shape/colours of `target`. `target` is a template — it is
 * not added to the scene. Works for ANY pair of poly shapes (circle -> square,
 * etc) because both are resampled to a common point count and interpolated.
 */
export function transform(m: Mobject, target: Mobject, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      const w = scene._work(m);
      const from = w.points.map((p) => ({ ...p }));
      const to = (target.points ?? []).map((p) => ({ ...p }));
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        points: { from, to, closed: w.closed || !!target.closed },
        colors: {
          stroke: { from: w.stroke, to: target.style.stroke },
          ...(w.fill && target.style.fill
            ? { fill: { from: w.fill, to: target.style.fill } }
            : {}),
        },
        nums: { strokeWidth: { from: w.strokeWidth, to: target.style.strokeWidth } },
      });
      // carry forward so chained transforms start from this shape
      w.points = to.map((p) => ({ ...p }));
      w.closed = !!target.closed;
      w.stroke = target.style.stroke;
      w.fill = target.style.fill;
      w.strokeWidth = target.style.strokeWidth;
    },
  };
}

export function shift(m: Mobject, dx: number, dy: number, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      const w = scene._work(m);
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: {
          tx: { from: w.tx, to: w.tx + dx },
          ty: { from: w.ty, to: w.ty + dy },
        },
      });
      w.tx += dx;
      w.ty += dy;
    },
  };
}

export function scaleBy(m: Mobject, factor: number, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      const w = scene._work(m);
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: {
          sx: { from: w.sx, to: w.sx * factor },
          sy: { from: w.sy, to: w.sy * factor },
        },
      });
      w.sx *= factor;
      w.sy *= factor;
    },
  };
}

export function rotate(m: Mobject, radians: number, run = 1): Anim {
  return {
    defaultRun: run,
    build(scene, start, dur, ease) {
      const w = scene._work(m);
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: { rot: { from: w.rot, to: w.rot + radians } },
      });
      w.rot += radians;
    },
  };
}

/** A there-and-back attention pulse (scale + optional colour flash). */
export function indicate(
  m: Mobject,
  opts: { scale?: number; color?: string; run?: number } = {}
): Anim {
  const { scale = 1.18, color, run = 0.8 } = opts;
  return {
    defaultRun: run,
    build(scene, start, dur) {
      const w = scene._work(m);
      const ease: Ease = thereAndBack;
      scene._push({
        targetId: m.id,
        start,
        dur,
        ease,
        nums: {
          sx: { from: w.sx, to: w.sx * scale },
          sy: { from: w.sy, to: w.sy * scale },
        },
        ...(color ? { colors: { stroke: { from: w.stroke, to: color } } } : {}),
      });
    },
  };
}
