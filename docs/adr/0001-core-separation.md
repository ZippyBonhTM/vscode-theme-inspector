# 0001 — Separate the core from the VS Code extension

## Status

Accepted

## Context

`docs/implementation-plan.md` requires a reusable engine (Theme Color
registry, CSS variable parser, color resolver, JSON generator) that third
parties can use without depending on the official extension's UI or the VS
Code Extension API. If domain logic is written directly inside
`apps/vscode-extension`, it becomes implicitly coupled to `vscode` imports,
extension activation lifecycle, and UI concerns, making it unusable as a
library and hard to unit test.

## Decision

Split the codebase along a strict dependency direction:

```text
apps/vscode-extension  →  packages/core
```

- `packages/core` contains domain logic and must not import `vscode` unless
  there is a documented technical reason. It must be testable with plain
  Node.js/Vitest, with no VS Code host required.
- `apps/vscode-extension` is a consumer: activation, commands, UI, and any
  direct use of the VS Code Extension API.
- A dedicated VS Code adapter package (e.g. `packages/vscode-adapter`) will
  be introduced later (implementation plan FASE 6) if and when the
  adapter-specific surface (workbench integration, configuration
  translation) grows large enough to be worth extracting from the extension
  app. Creating it now, empty, would violate the bootstrap-plan's rule
  against empty abstractions.
- Each package's public surface is its `src/index.ts`. Internal modules are
  not to be imported directly by consumers, including by
  `apps/vscode-extension`.

## Consequences

- The extension cannot short-circuit the core to reach into its internals;
  this is enforced by convention now (documented here and in
  `CLAUDE.md`/`CONTRIBUTING.md`) and can be enforced with lint rules later
  if violations occur in practice.
- Core logic gets fast, VS-Code-independent unit tests (Vitest).
- Slightly more ceremony than a single flat package, justified by the
  explicit reusability requirement in the implementation plan.
