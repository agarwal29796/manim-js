# Security Policy

## Supported versions

Manim.js is pre-1.0; security fixes are applied to the latest `0.x` release.

## Reporting a vulnerability

Please **do not** open a public issue for security reports.

Instead, email **archit29796@gmail.com** with details and reproduction steps, or use
GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
on this repository.

We'll acknowledge within a few days and keep you updated on the fix.

## Note on scene code execution

Manim.js scene code is executed by the host application (e.g. via `new
Function`). The engine itself has no DOM or network access, but **treat
scene/source strings as trusted same-origin input** — do not run untrusted
user-supplied scene code without an additional sandbox.
