import { defineConfig } from "tsup";

// Dual ESM + CJS build with type declarations for each format. Two entry
// points map to the two public subpaths: "manim-js" (core) and
// "manim-js/canvas" (reference Canvas2D renderer).
export default defineConfig({
  entry: {
    index: "src/core/index.ts",
    canvas: "src/canvas/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2020",
  outDir: "dist",
});
