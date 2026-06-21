# Contributing to Manim.js

Thanks for your interest in contributing! 🎉

## Development setup

Requires **Node ≥ 18**.

```bash
git clone git@github.com:agarwal29796/manim-js.git
cd manim-js
npm install
npm run studio   # live playground at http://localhost:8123
```

## Project layout

```
src/core/     engine — mobjects, animations, scene/timeline, IR (zero deps)
src/canvas/   reference Canvas2D renderer + rAF Player
studio/       browser playground
test/         vitest specs
```

**Golden rule:** `src/core/` must stay dependency-free and never touch the DOM.
Anything that paints pixels belongs in a renderer package behind the `Renderer`
interface. This is what keeps the engine portable.

## Before you open a PR

```bash
npm run typecheck
npm run lint          # biome (use `npm run lint:fix` to autofix)
npm test              # vitest
npm run build
npm run check:exports # publint + are-the-types-wrong
```

## Changesets

If your change is user-facing, add a changeset so it lands in the changelog and
a release:

```bash
npm run changeset
```

Pick the bump type (patch / minor / major per [SemVer](https://semver.org)) and
write a one-line summary. Commit the generated file with your PR.

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org)
(`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## License

By contributing, you agree your contributions are licensed under the
[Apache-2.0](./LICENSE) license.
