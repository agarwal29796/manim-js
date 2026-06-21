import { type Ease, easeInOut } from "./easing";
import type { Mobject } from "./mobject";
import type { DrawOp, Timeline } from "./renderer";
import { type Vec, centroid, clamp, lerp, lerpColor, lerpPoints } from "./util";

// ---------------------------------------------------------------------------
// Recording model.
//
// A Scene is built by calling play()/wait() in sequence. Rather than mutating
// objects live, each animation records a `Track`: a time window plus the
// from/to snapshots of whatever fields it changes. Compiling produces a
// Timeline whose sample(t) rebuilds every mobject from its construction state
// and replays the tracks up to t. That makes the whole thing a pure function
// of time — so scrubbing, seeking and frame-accurate export all just work.
// ---------------------------------------------------------------------------

type NumField =
  | "tx"
  | "ty"
  | "sx"
  | "sy"
  | "rot"
  | "opacity"
  | "draw"
  | "reveal"
  | "strokeWidth";

export interface Track {
  targetId: string;
  start: number;
  dur: number;
  ease: Ease;
  nums?: Partial<Record<NumField, { from: number; to: number }>>;
  colors?: {
    stroke?: { from: string; to: string };
    fill?: { from: string; to: string };
  };
  points?: { from: Vec[]; to: Vec[]; closed: boolean };
}

// Mutable bookkeeping kept ONLY during recording, so animations can snapshot
// the current value of a field as their `from`.
export interface Work {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  rot: number;
  opacity: number;
  stroke: string;
  fill: string | null;
  strokeWidth: number;
  points: Vec[];
  closed: boolean;
}

export interface Anim {
  defaultRun: number; // seconds
  build: (scene: Scene, start: number, dur: number, ease: Ease) => void;
}

interface PlayOpts {
  run?: number; // seconds
  ease?: Ease;
}

interface Meta {
  introAt: number;
  removeAt: number | null;
  order: number;
}

export class Scene {
  width: number;
  height: number;
  background: string;

  private cursor = 0; // ms
  private order = 0;
  readonly mobs = new Map<string, Mobject>();
  readonly meta = new Map<string, Meta>();
  readonly work = new Map<string, Work>();
  readonly tracks: Track[] = [];

  constructor(opts: { width?: number; height?: number; background?: string } = {}) {
    this.width = opts.width ?? 1280;
    this.height = opts.height ?? 720;
    this.background = opts.background ?? "#FBFAF6";
  }

  // ---- API used by animation factories (treated as internal) -------------

  _work(m: Mobject): Work {
    let w = this.work.get(m.id);
    if (!w) {
      this.mobs.set(m.id, m);
      w = {
        tx: 0,
        ty: 0,
        sx: 1,
        sy: 1,
        rot: 0,
        opacity: m.style.opacity,
        stroke: m.style.stroke,
        fill: m.style.fill,
        strokeWidth: m.style.strokeWidth,
        points: (m.points ?? []).map((p) => ({ ...p })),
        closed: !!m.closed,
      };
      this.work.set(m.id, w);
    }
    return w;
  }

  _introduce(m: Mobject, at: number) {
    if (!this.meta.has(m.id)) {
      this.meta.set(m.id, { introAt: at, removeAt: null, order: this.order++ });
    } else {
      this.meta.get(m.id)!.introAt = Math.min(this.meta.get(m.id)!.introAt, at);
    }
  }

  _remove(m: Mobject, at: number) {
    const meta = this.meta.get(m.id);
    if (meta) meta.removeAt = at;
  }

  _push(t: Track) {
    this.tracks.push(t);
  }

  // ---- authoring surface -------------------------------------------------

  add(...mobs: Mobject[]): this {
    for (const m of mobs) {
      this._work(m);
      this._introduce(m, this.cursor);
    }
    return this;
  }

  play(...args: (Anim | PlayOpts)[]): this {
    let opts: PlayOpts = {};
    const last = args[args.length - 1];
    if (last && typeof (last as Anim).build !== "function") {
      opts = args.pop() as PlayOpts;
    }
    const anims = args as Anim[];
    const dur = (opts.run ?? Math.max(...anims.map((a) => a.defaultRun))) * 1000;
    const ease = opts.ease ?? easeInOut;
    for (const a of anims) a.build(this, this.cursor, dur, ease);
    this.cursor += dur;
    return this;
  }

  wait(seconds = 1): this {
    this.cursor += seconds * 1000;
    return this;
  }

  // ---- compile to a deterministic timeline -------------------------------

  compile(): Timeline {
    const byTarget = new Map<string, Track[]>();
    let end = this.cursor;
    for (const tr of this.tracks) {
      if (!byTarget.has(tr.targetId)) byTarget.set(tr.targetId, []);
      byTarget.get(tr.targetId)!.push(tr);
      end = Math.max(end, tr.start + tr.dur);
    }
    for (const list of byTarget.values()) list.sort((a, b) => a.start - b.start);

    const ordered = [...this.mobs.entries()].sort(
      (a, b) => this.meta.get(a[0])!.order - this.meta.get(b[0])!.order
    );

    const sample = (tMs: number): DrawOp[] => {
      const ops: DrawOp[] = [];
      for (const [id, mob] of ordered) {
        const meta = this.meta.get(id)!;
        if (tMs < meta.introAt) continue;
        if (meta.removeAt != null && tMs >= meta.removeAt) continue;

        const st = freshState(mob);
        const tracks = byTarget.get(id) ?? [];
        for (const tr of tracks) {
          // Only replay tracks that have started. A not-yet-started track's
          // `from` is the value AFTER prior tracks complete (a future state),
          // so applying it early would bleed that future value backward.
          if (tMs < tr.start) continue;
          const p = tr.ease(clamp((tMs - tr.start) / tr.dur, 0, 1));
          applyTrack(st, tr, p);
        }
        emit(mob, st, ops);
      }
      return ops;
    };

    return { durationMs: end, sample };
  }
}

// ---- sampling internals ---------------------------------------------------

interface State {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  rot: number;
  opacity: number;
  draw: number;
  reveal: number;
  strokeWidth: number;
  stroke: string;
  fill: string | null;
  points: Vec[];
  closed: boolean;
}

function freshState(m: Mobject): State {
  return {
    tx: 0,
    ty: 0,
    sx: 1,
    sy: 1,
    rot: 0,
    opacity: m.style.opacity,
    draw: 1,
    reveal: 1,
    strokeWidth: m.style.strokeWidth,
    stroke: m.style.stroke,
    fill: m.style.fill,
    points: (m.points ?? []).map((p) => ({ ...p })),
    closed: !!m.closed,
  };
}

function applyTrack(st: State, tr: Track, p: number) {
  if (tr.nums) {
    for (const k in tr.nums) {
      const seg = tr.nums[k as NumField]!;
      (st as unknown as Record<string, number>)[k] = lerp(seg.from, seg.to, p);
    }
  }
  if (tr.colors) {
    if (tr.colors.stroke)
      st.stroke = lerpColor(tr.colors.stroke.from, tr.colors.stroke.to, p);
    if (tr.colors.fill) st.fill = lerpColor(tr.colors.fill.from, tr.colors.fill.to, p);
  }
  if (tr.points) {
    st.points = lerpPoints(tr.points.from, tr.points.to, p);
    st.closed = tr.points.closed;
  }
}

function emit(m: Mobject, st: State, ops: DrawOp[]) {
  if (m.kind === "text") {
    ops.push({
      kind: "text",
      text: m.text ?? "",
      x: (m.pos?.x ?? 0) + st.tx,
      y: (m.pos?.y ?? 0) + st.ty,
      size: (m.size ?? 64) * st.sy,
      font: m.font ?? "sans-serif",
      color: st.fill ?? st.stroke,
      opacity: st.opacity,
      align: m.align ?? "center",
      reveal: st.reveal,
    });
    return;
  }

  // poly: bake the affine transform into absolute coordinates.
  const c = centroid(st.points);
  const cos = Math.cos(st.rot);
  const sin = Math.sin(st.rot);
  const pts: Vec[] = st.points.map((p) => {
    const dx = (p.x - c.x) * st.sx;
    const dy = (p.y - c.y) * st.sy;
    return {
      x: c.x + (dx * cos - dy * sin) + st.tx,
      y: c.y + (dx * sin + dy * cos) + st.ty,
    };
  });

  ops.push({
    kind: "poly",
    points: pts,
    closed: st.closed,
    stroke: st.stroke,
    strokeWidth: st.strokeWidth,
    fill: st.fill,
    opacity: st.opacity,
    draw: st.draw,
  });
}
