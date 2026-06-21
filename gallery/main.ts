import { DEMOS, type Demo } from "./demos";

// Each sample is presented as a COMPLETE, copy-pasteable HTML file in an editor
// on the left, rendered live in a sandboxed <iframe> on the right. The file
// loads the published package from a CDN, so what you see is exactly what a
// user gets if they save the file and open it in any browser.

const CDN = "https://esm.sh/@agarwal29796/manim-js@0.1.0";

function fullHtml(demo: Demo): string {
  const scene = demo.code.replace(/\n/g, "\n      "); // indent inside build()
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    `  <title>${demo.title} — Manim.js</title>`,
    "  <style>",
    "    html, body { margin: 0; height: 100%; background: #FBFAF6; }",
    "    canvas { display: block; width: 100%; height: 100%; }",
    "  </style>",
    "</head>",
    "<body>",
    '  <canvas id="scene"></canvas>',
    '  <script type="module">',
    "    import {",
    "      Scene, circle, square, rect, polygon, line, functionGraph, numberLine, text,",
    "      create, write, fadeIn, fadeOut, transform, shift, scaleBy, rotate, indicate,",
    "      linear, easeInOut, easeOut, easeIn, easeOutBack, smooth, thereAndBack,",
    `    } from "${CDN}";`,
    `    import { CanvasRenderer, Player } from "${CDN}/canvas";`,
    "",
    "    const W = 960, H = 600;",
    '    const canvas = document.getElementById("scene");',
    "    canvas.width = W; canvas.height = H;",
    '    const ctx = canvas.getContext("2d");',
    "",
    "    function build(width, height) {",
    `      ${scene}`,
    "    }",
    "",
    "    const scene = build(W, H);",
    "    const renderer = new CanvasRenderer(ctx, { background: scene.background, centerOrigin: true });",
    "    new Player(scene.compile(), renderer, W, H).play();",
    "  </script>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

const tabsEl = document.getElementById("tabs")!;
const editor = document.getElementById("code") as HTMLTextAreaElement;
const frame = document.getElementById("preview") as HTMLIFrameElement;
const fileLabel = document.getElementById("filename")!;
const copyBtn = document.getElementById("copy") as HTMLButtonElement;
const openBtn = document.getElementById("open") as HTMLButtonElement;
const resetBtn = document.getElementById("reset") as HTMLButtonElement;

let current = 0;
let blobUrl: string | null = null;

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function render(): void {
  frame.srcdoc = editor.value;
}

function load(i: number): void {
  current = i;
  editor.value = fullHtml(DEMOS[i]);
  fileLabel.textContent = `${slug(DEMOS[i].title)}.html`;
  render();
  for (const btn of tabsEl.querySelectorAll("button")) {
    btn.classList.toggle("active", Number(btn.dataset.i) === i);
  }
}

// build tabs
DEMOS.forEach((demo, i) => {
  const b = document.createElement("button");
  b.textContent = demo.title;
  b.dataset.i = String(i);
  b.addEventListener("click", () => load(i));
  tabsEl.appendChild(b);
});

// live re-render (debounced)
let timer = 0;
editor.addEventListener("input", () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(render, 400);
});

// Tab inserts two spaces
editor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const s = editor.selectionStart;
    editor.value = `${editor.value.slice(0, s)}  ${editor.value.slice(editor.selectionEnd)}`;
    editor.selectionStart = editor.selectionEnd = s + 2;
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(editor.value);
  copyBtn.textContent = "Copied!";
  window.setTimeout(() => {
    copyBtn.textContent = "Copy";
  }, 1200);
});

openBtn.addEventListener("click", () => {
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = URL.createObjectURL(new Blob([editor.value], { type: "text/html" }));
  window.open(blobUrl, "_blank");
});

resetBtn.addEventListener("click", () => load(current));

load(0);
