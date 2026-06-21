import { CanvasRenderer, Player } from "../src/canvas/index";
import * as ML from "../src/core/index";
import { DEMOS, type Demo } from "./demos";

// Each demo card compiles its source the same way TeachBoard / the studio do
// (new Function + injected API), renders it into its own canvas, and loops.
// Cards only animate while on-screen (IntersectionObserver) to stay light.

const W = 560;
const H = 360;

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

function compile(src: string): { timeline?: ML.Timeline; bg?: string; error?: string } {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...API_NAMES, "width", "height", `"use strict";\n${src}`);
    const args = API_NAMES.map((n) => (ML as unknown as Record<string, unknown>)[n]);
    const scene = fn(...args, W, H) as ML.Scene | undefined;
    if (!scene || typeof scene.compile !== "function") {
      return { error: "Scene code must `return` a Scene." };
    }
    return { timeline: scene.compile(), bg: scene.background };
  } catch (e) {
    return { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function buildCard(demo: Demo): HTMLElement {
  const card = el("article", "card");

  const canvas = el("canvas", "stage");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  card.appendChild(canvas);

  const body = el("div", "body");
  body.appendChild(el("h2", "title", demo.title));
  body.appendChild(el("p", "desc", demo.desc));

  const actions = el("div", "actions");
  const codeBtn = el("button", "btn", "</> Code");
  const replayBtn = el("button", "btn ghost", "↻ Replay");
  actions.append(codeBtn, replayBtn);
  body.appendChild(actions);

  const pre = el("pre", "code");
  const codeEl = el("code");
  codeEl.textContent = demo.code;
  pre.appendChild(codeEl);
  pre.style.display = "none";
  body.appendChild(pre);

  card.appendChild(body);

  const { timeline, bg, error } = compile(demo.code);
  if (error || !timeline) {
    ctx.fillStyle = "#2c1d1f";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fda4a4";
    ctx.font = "16px monospace";
    ctx.fillText(error ?? "error", 16, 28);
    pre.style.display = "block"; // surface the broken source
    return card;
  }

  const renderer = new CanvasRenderer(ctx, {
    background: bg ?? "#FBFAF6",
    centerOrigin: true,
  });
  const player = new Player(timeline, renderer, W, H);
  player.seek(0);

  codeBtn.addEventListener("click", () => {
    const showing = pre.style.display !== "none";
    pre.style.display = showing ? "none" : "block";
    codeBtn.textContent = showing ? "</> Code" : "✕ Hide";
  });
  replayBtn.addEventListener("click", () => {
    player.seek(0);
    player.play();
  });

  // Only run while visible — keeps a page full of canvases cheap.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) player.play();
        else player.pause();
      }
    },
    { threshold: 0.2 }
  );
  io.observe(canvas);

  return card;
}

const grid = document.getElementById("grid")!;
for (const demo of DEMOS) grid.appendChild(buildCard(demo));
