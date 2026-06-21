---
name: Feature request
about: Suggest a mobject, animation, or capability
title: "[feat] "
labels: enhancement
---

**What would you like?**
e.g. an `axes()` coordinate plane, a `brace()` mobject, LaTeX `write`, …

**Motivation / use case**
What are you trying to build that this enables?

**Sketch of the API (optional)**
```ts
const ax = axes({ xRange: [-5, 5], yRange: [-3, 3] });
s.play(create(ax));
```
