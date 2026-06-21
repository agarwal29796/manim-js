import { CanvasRenderer, Player } from "../src/canvas/index";
import * as ML from "../src/core/index";

// ---------------------------------------------------------------------------
// Live-coding studio. The textarea holds the scene SOURCE; editing it
// recompiles the scene and updates the preview without a reload. The source is
// evaluated in the browser via `new Function`, with the motionlab authoring API
// injected as locals — the same approach TeachBoard's src/motion.ts uses, so
// what you write here runs identically inside the app.
// ---------------------------------------------------------------------------

const W = 1280;
const H = 720;
const STORAGE_KEY = "motionlab-studio-src-v2";

// The authoring API exposed to scene code, by name.
const API_NAMES = [
  "Scene",
  "circle",
  "square",
  "rect",
  "polygon",
  "line",
  "functionGraph",
  "numberLine",
  "text",
  "create",
  "write",
  "fadeIn",
  "fadeOut",
  "transform",
  "shift",
  "scaleBy",
  "rotate",
  "indicate",
  "linear",
  "easeInOut",
  "easeOut",
  "easeIn",
  "easeOutBack",
  "smooth",
  "thereAndBack",
] as const;

const DEFAULT_SRC = `// A number line — edit it and the preview updates as you type.
// (0,0) is the centre. Return a Scene at the end.
const s = new Scene({ width, height, background: "#FBFAF6" });

const title = text("Number line", { y: -210, size: 56, fill: "#20242E" });

// numberLine() returns { axis, ticks[], labels[], arrows[], at(value) }.
const nl = numberLine({ min: -5, max: 5, unit: 95, y: 30 });

// a marker dot we'll move along the line
const dot = circle({
  x: nl.at(0).x, y: nl.at(0).y, r: 15,
  stroke: "#FF6B5B", fill: "#FF6B5B", strokeWidth: 3,
});

// 1) draw the axis + arrowheads, then ticks, then labels
s.play(write(title), { run: 0.8, ease: easeOutBack });
s.play(create(nl.axis), ...nl.arrows.map((a) => create(a)), { run: 0.9 });
s.play(...nl.ticks.map((t) => create(t)), { run: 0.7 });
s.play(...nl.labels.map((l) => write(l)), { run: 0.7 });
s.wait(0.2);

// 2) drop the dot at 0 and hop it to +3, then to -2
s.play(fadeIn(dot), { run: 0.4 });
s.play(shift(dot, nl.at(3).x - nl.at(0).x, 0), { run: 0.9 });
s.play(indicate(dot, { scale: 1.4, color: "#13B8A6" }), { run: 0.7 });
s.play(shift(dot, nl.at(-2).x - nl.at(3).x, 0), { run: 1.1 });
s.play(indicate(dot, { scale: 1.4, color: "#13B8A6" }), { run: 0.7 });

return s;
`;

function compileSource(src: string): {
  timeline?: ML.Timeline;
  background?: string;
  error?: string;
} {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...API_NAMES, "width", "height", `"use strict";\n${src}`);
    const args = API_NAMES.map((n) => (ML as unknown as Record<string, unknown>)[n]);
    const scene = fn(...args, W, H) as ML.Scene | undefined;
    if (!scene || typeof scene.compile !== "function") {
      return { error: "Your code must `return` a Scene, e.g. `return s;`" };
    }
    return { timeline: scene.compile(), background: scene.background };
  } catch (e) {
    return { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

// ---- DOM ------------------------------------------------------------------
const canvas = document.getElementById("stage") as HTMLCanvasElement;
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d")!;

const editor = document.getElementById("code") as HTMLTextAreaElement;
const status = document.getElementById("status") as HTMLElement;
const scrub = document.getElementById("scrub") as HTMLInputElement;
const timeLabel = document.getElementById("time") as HTMLElement;
const playBtn = document.getElementById("play") as HTMLButtonElement;

let renderer = new CanvasRenderer(ctx, { background: "#FBFAF6", centerOrigin: true });
let player: Player | null = null;

function setStatus(ok: boolean, msg: string) {
  status.className = `status ${ok ? "ok" : "err"}`;
  status.textContent = msg;
}

// Recompile `src` and swap the timeline in, preserving playhead + play state so
// editing doesn't jolt the preview back to the start.
function rebuild(src: string): Player | null {
  const { timeline, background, error } = compileSource(src);
  if (error || !timeline) {
    setStatus(false, error ?? "unknown error");
    return null; // keep the last good frame on screen
  }
  const prevT = player?.t ?? 0;
  const wasPlaying = player?.playing ?? true;
  player?.pause();

  renderer = new CanvasRenderer(ctx, {
    background: background ?? "#FBFAF6",
    centerOrigin: true,
  });
  player = new Player(timeline, renderer, W, H);
  player.onTick = (t, d) => {
    scrub.value = String(Math.round(t));
    timeLabel.textContent = `${(t / 1000).toFixed(2)}s / ${(d / 1000).toFixed(2)}s`;
  };
  scrub.max = String(Math.max(1, Math.round(timeline.durationMs)));

  player.seek(Math.min(prevT, timeline.durationMs));
  if (wasPlaying) {
    player.play();
    playBtn.textContent = "Pause";
  } else {
    playBtn.textContent = "Play";
  }
  const secs = (timeline.durationMs / 1000).toFixed(2);
  setStatus(true, `compiled ✓  ·  ${secs}s timeline`);
  return player;
}

// ---- events ---------------------------------------------------------------
let debounce = 0;
editor.addEventListener("input", () => {
  localStorage.setItem(STORAGE_KEY, editor.value);
  window.clearTimeout(debounce);
  debounce = window.setTimeout(() => rebuild(editor.value), 250);
});

editor.addEventListener("keydown", (e) => {
  // Cmd/Ctrl+Enter — run immediately
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    window.clearTimeout(debounce);
    rebuild(editor.value);
    return;
  }
  // Tab inserts two spaces instead of moving focus
  if (e.key === "Tab") {
    e.preventDefault();
    const s = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = `${editor.value.slice(0, s)}  ${editor.value.slice(end)}`;
    editor.selectionStart = editor.selectionEnd = s + 2;
  }
});

playBtn.addEventListener("click", () => {
  if (!player) return;
  player.toggle();
  playBtn.textContent = player.playing ? "Pause" : "Play";
});

scrub.addEventListener("input", () => {
  if (!player) return;
  player.pause();
  player.seek(Number(scrub.value));
  playBtn.textContent = "Play";
});

// ---- init -----------------------------------------------------------------
editor.value = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SRC;
const initPlayer = rebuild(editor.value);

// ?t=<ms> — pause and seek to a fixed frame (handy for screenshots / sharing).
const qt = new URLSearchParams(location.search).get("t");
if (qt != null && initPlayer) {
  initPlayer.pause();
  initPlayer.seek(Number(qt));
  playBtn.textContent = "Play";
}
