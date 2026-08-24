# 0003 — TypeScript, lint, format, and test tooling

## Status

Accepted

## Context

`docs/bootstrap-plan.md` (§17–§20) asks for explicit, evaluated choices for
TypeScript configuration, linting, formatting, and the test framework,
without over-configuring "just to look rigorous."

## Decision

### TypeScript

- `typescript` latest stable on npm at bootstrap time is `7.0.2` (the native,
  Go-based compiler rewrite; verified via `npm view typescript
version`/`dist-tags`, not assumed). However, `typescript-eslint@8.67.0`
  declares a peer range of `>=4.8.4 <6.1.0` — it does not support TypeScript
  7 yet. Since linting the whole workspace with `typescript-eslint` is a
  bootstrap requirement, `typescript@^6.0.3` (the newest release still
  inside that peer range) is used instead of 7.x for now. This is a tooling
  compatibility constraint, not a preference — revisit once
  `typescript-eslint` adds TypeScript 7 support.
- `strict: true`, plus `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch` — each catches a real
  class of bugs (missing array bounds checks, dead code, accidental
  fallthrough) relevant to a parser/resolver-heavy core.
- `exactOptionalPropertyTypes` was evaluated and **not** enabled yet: it
  tends to force verbose `| undefined` unions across an evolving domain
  model before that model exists. Revisit once `InspectionResult` /
  `ThemeColorCandidate` are actually implemented.
- `module`/`moduleResolution`: `CommonJS`/`Node`. The VS Code extension host
  loads extensions as CommonJS; using the same module system for
  `packages/core` avoids a dual CJS/ESM build for a package with exactly one
  current consumer. This can be revisited if/when the core needs to run in
  a browser or ESM-only context.
- No TypeScript project references/composite build graph: with only two
  packages, a root `tsconfig.json` (non-composite, `noEmit`, with a `paths`
  mapping straight to `packages/core/src`) is used purely for the
  `npm run typecheck` script, so type-checking always reflects current
  source, not stale build output. Each package additionally has its own
  `tsconfig.json` for its own `build` script. Project references would add
  real value once there are more than two interdependent packages; for two,
  it's ceremony without payoff.

### Lint: ESLint (flat config)

Evaluated against Biome. ESLint + `typescript-eslint` remains the more
mature choice for a VS Code extension project: broader rule coverage for
TypeScript-specific issues, and it is what the VS Code extension samples and
tooling ecosystem assume. Biome is faster but its VS Code/TypeScript-specific
rule set is comparatively young. Configuration is a single flat
`eslint.config.mjs` using `@eslint/js` recommended + `typescript-eslint`
recommended, with `eslint-config-prettier` last to disable stylistic rules
that Prettier already owns. No custom rule pile — only one project-specific
rule (`no-unused-vars` allowing a `_`-prefixed escape hatch).

### Formatting: Prettier

Single formatting strategy, applied to the whole repo via `.prettierrc.json`

- `.prettierignore`, matching bootstrap-plan §19's requirement of one
  convention for all TypeScript files. ESLint does not perform formatting;
  `eslint-config-prettier` guarantees no rule conflicts between the two.

### Tests

- `packages/core`: **Vitest**. Fast, native TypeScript/ESM support, minimal
  configuration, Jest-compatible API. Chosen over Jest (heavier
  configuration for TS/ESM) and the built-in `node:test` runner (adequate,
  but Vitest's watch mode and assertion ergonomics are worth the single
  added dependency for a package that will grow real parsing/resolution
  test suites).
- `apps/vscode-extension`: the **official** `@vscode/test-cli` +
  `@vscode/test-electron`, per the current VS Code extension testing
  documentation. This is the only supported way to run tests inside a real
  Extension Development Host, so there was no alternative to evaluate here.

## Consequences

- Two different test runners exist in the repo (Vitest for core, Mocha via
  `@vscode/test-cli` for the extension). This is intentional: they test
  different things (pure logic vs. VS Code integration) and forcing a single
  runner would mean either testing the extension without a real VS Code host
  (weaker guarantee) or pulling Electron into every core unit test run
  (slower, unnecessary).
- CI must handle the extension's integration tests needing a virtual display
  on Linux (`xvfb-run`), per VS Code's own CI guidance.
