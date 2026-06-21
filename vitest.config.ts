import { defineConfig } from "vitest/config";

// Self-contained config so Vitest doesn't climb the filesystem and pick up a
// parent project's Vite config (this package lives inside another repo during
// local development).
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
