import type { Timeline } from "../core/renderer";
import { renderFrame } from "../core/renderer";
import type { Renderer } from "../core/renderer";

// A small play/pause/seek driver for live playback (rAF). Because the Timeline
// is a pure function of time, seeking is just rendering a different t — no
// state to unwind. Frame-accurate export would step `t` over the same sample().

export class Player {
  private timeline: Timeline;
  private renderer: Renderer;
  private width: number;
  private height: number;
  private raf = 0;
  private last = 0;
  t = 0; // ms
  playing = false;
  loop = true;
  onTick?: (t: number, duration: number) => void;

  constructor(timeline: Timeline, renderer: Renderer, width: number, height: number) {
    this.timeline = timeline;
    this.renderer = renderer;
    this.width = width;
    this.height = height;
  }

  get duration(): number {
    return this.timeline.durationMs;
  }

  seek(tMs: number): void {
    this.t = Math.max(0, Math.min(tMs, this.duration));
    this.renderOnce();
    this.onTick?.(this.t, this.duration);
  }

  renderOnce(): void {
    renderFrame(this.renderer, this.timeline, this.t, this.width, this.height);
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.last = now();
    const step = () => {
      if (!this.playing) return;
      const n = now();
      this.t += n - this.last;
      this.last = n;
      if (this.t >= this.duration) {
        if (this.loop) this.t = 0;
        else {
          this.t = this.duration;
          this.playing = false;
        }
      }
      this.renderOnce();
      this.onTick?.(this.t, this.duration);
      if (this.playing) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }

  toggle(): void {
    this.playing ? this.pause() : this.play();
  }
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
