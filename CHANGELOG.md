# Changelog

All notable changes to this project are documented here. This file is managed
by [Changesets](https://github.com/changesets/changesets); see the
[Keep a Changelog](https://keepachangelog.com) format and
[Semantic Versioning](https://semver.org).

## 0.1.0 (unreleased)

Initial release.

- Deterministic scene → timeline engine (`Scene`, `play`/`wait`, pure `sample(t)`).
- Mobjects: `circle`, `square`, `rect`, `polygon`, `line`, `functionGraph`, `numberLine`, `text`.
- Animations: `create`, `write`, `fadeIn`, `fadeOut`, `transform` (any-shape morph), `shift`, `scaleBy`, `rotate`, `indicate`.
- Easing: `linear`, `easeInOut`, `easeOut`, `easeIn`, `easeOutBack`, `thereAndBack`.
- Renderer-agnostic IR + `Renderer` interface; reference `CanvasRenderer` and `Player` under `manim-js/canvas`.
- Live-coding `studio/` playground.
