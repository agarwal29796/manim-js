# Manim.js

> **Manim-inspired, framework-agnostic animation engine for the web.**
> Author scenes in code, compile them to a deterministic timeline, and render
> anywhere through a tiny `Renderer` interface.

[![npm](https://img.shields.io/npm/v/@agarwal29796/manim-js.svg)](https://www.npmjs.com/package/@agarwal29796/manim-js)
[![license](https://img.shields.io/npm/l/@agarwal29796/manim-js.svg)](./LICENSE)

**🔗 [Live examples & editor →](https://agarwal29796.github.io/manim-js/)**

> Independent project inspired by [Manim](https://www.manim.community/); not
> affiliated with or endorsed by the Manim Community.

## Why

- **Deterministic.** A scene compiles to a `Timeline` whose `sample(t)` is a
  pure function of time. Scrubbing, seeking and frame-accurate export all just
  work — no live state to unwind.
- **Renderer-agnostic.** The engine (`core/`) has zero dependencies and never
  touches a canvas. Pixels are someone else's job, behind a 2-method `Renderer`
  interface. The package ships a Canvas2D renderer; embed your own to draw
  through an existing pipeline.
- **Real morphing.** Shapes are point sets, so `transform(circle, square)`
  interpolates *any* pair of shapes by resampling to a common point count.

## Install

```bash
npm i @agarwal29796/manim-js
```

## Quick start

```ts
import { Scene, circle, square, text, create, write, transform } from "@agarwal29796/manim-js";
import { CanvasRenderer, Player } from "@agarwal29796/manim-js/canvas";

const s = new Scene({ width: 1280, height: 720 });
const title = text("hello", { y: -200, size: 80 });
const c = circle({ r: 120, stroke: "#5B5BD6" });

s.play(write(title));
s.play(create(c));
s.play(transform(c, square({ size: 220, stroke: "#FF6B5B" })));

const timeline = s.compile();
const renderer = new CanvasRenderer(canvas.getContext("2d")!);
new Player(timeline, renderer, 1280, 720).play();
```

## Authoring vocabulary

`Scene.play(...anims, { run, ease })`, `Scene.wait(s)`, `Scene.add(...)`.

- **Shapes:** `circle`, `square`, `rect`, `polygon`, `line`, `functionGraph`, `numberLine`, `text`
- **Animations:** `create`, `write`, `fadeIn`, `fadeOut`, `transform`, `shift`, `scaleBy`, `rotate`, `indicate`
- **Easing:** `linear`, `easeInOut`, `easeOut`, `easeIn`, `easeOutBack`, `thereAndBack`

## The seam (for custom renderers)

```ts
interface Renderer {
  clear(width: number, height: number): void;
  draw(op: DrawOp): void; // DrawOp = PolyOp | TextOp
}
```

That is the *entire* public contract between engine and pixels. Implement it and
the engine runs unchanged. (This is how it renders natively inside other apps.)

## Layout

```
src/core/     engine — mobjects, animations, scene/timeline, IR (zero deps)
src/canvas/   reference Canvas2D renderer + rAF Player
studio/       browser playground (npm run studio)
```

## Develop

```bash
npm install
npm run build           # tsup -> dist (ESM + CJS + .d.ts)
npm run studio          # bundle + serve the live-coding playground at :8123
npm test                # vitest
npm run check:exports   # publint + are-the-types-wrong
```

## Roadmap

- LaTeX `Write` (MathJax → SVG paths)
- `axes()` / coordinate plane, `brace()`, `vector()`
- Easing `lag`/stagger in `play`
- Frame-accurate MP4 export off the timeline

## License

[Apache-2.0](./LICENSE) © Archit Agarwal
