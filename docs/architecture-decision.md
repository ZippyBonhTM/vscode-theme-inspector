# Architecture Decisions — Bootstrap Phase

This document summarizes the technical decisions made while bootstrapping
the repository. Individual decisions with lasting consequences are also
recorded as ADRs in [docs/adr/](adr/).

## Why the core exists

The project's long-term goal (see
[docs/implementation-plan.md](implementation-plan.md)) is a reusable theme
inspection engine, not just a VS Code extension. If parsing, resolution, and
color logic live inside `extension.ts`, no one can reuse them without
depending on the VS Code Extension API and copying code. The core package
(`packages/core`) exists to hold that logic independent of any host, so the
official extension — and, in principle, other tools — can consume it as a
library. See [ADR 0001](adr/0001-core-separation.md).

## Why there is a VS Code Adapter boundary

`packages/core` must not import `vscode` unless strictly necessary. Anything
that talks to the Extension API, the Workbench, commands, or configuration
belongs in `apps/vscode-extension` (or a future `packages/vscode-adapter`,
introduced when the adapter surface is large enough to justify its own
package — see [ADR 0001](adr/0001-core-separation.md) and
[ADR 0002](adr/0002-monorepo-and-package-manager.md)). During bootstrap this
package does not exist yet; creating it now would be an empty abstraction.

## Monorepo & package manager

npm workspaces, no separate monorepo tool. See
[ADR 0002](adr/0002-monorepo-and-package-manager.md) for the comparison
against a single-package layout and against pnpm/yarn.

## TypeScript, lint, format, test

Strict TypeScript, ESLint (flat config) + typescript-eslint, Prettier, and
Vitest for the core package; the extension is tested with the official
`@vscode/test-cli` + `@vscode/test-electron` integration test runner. See
[ADR 0003](adr/0003-typescript-and-tooling.md) for the reasoning and the
versions evaluated.

## Public API

The public API boundary is each package's `src/index.ts`. Anything not
re-exported from there is internal and may change without notice. Both
packages are currently `"private": true` (not published) since the API is
still unstable; this will be revisited before any npm publish.

## Node.js baseline

The workspace targets Node.js `>=22` (`engines.node` in the root
`package.json`, enforced via `.npmrc`'s `engine-strict=true`). This floor
was not chosen upfront: it was discovered by evidence. `>=20` was tried
first, but with `engine-strict=true`, `npm ci` on CI (Node 20) failed
because several devDependencies declare a stricter `engines.node`:
`eslint-config-prettier`, `@vscode/test-cli`, and `@vscode/test-electron`
all require `node >=22`. The floor was raised to `>=22` to match what the
toolchain actually requires, `@types/node` was re-pinned to `^22` to match,
and CI (`.github/workflows/ci.yml`) was updated to run on Node.js `22` — CI
validates against the declared minimum, not whatever is newest. Locally,
Node.js `v24.19.0` LTS was installed during this bootstrap (the environment
had no Node.js installed beforehand) since it was the current LTS at the
time; this is a dev-machine convenience and does not change the declared
floor.

## Inspector strategy (FASE 0 research)

Extensions run in a separate Extension Host process and cannot access the
Workbench DOM; webviews are isolated pages and cannot either. There is no
supported way to build a literal "point at a live UI element" picker.
**There is also no public API to resolve a Theme Color ID to a color value**
— `vscode.ColorTheme` only exposes `kind` — confirmed directly against
`microsoft/vscode`'s `vscode.d.ts` (an earlier draft of this decision
wrongly claimed such an API existed; see the correction at the top of
[ADR 0004](adr/0004-inspector-strategy.md)). The only live resolution
mechanism that actually exists is a webview reading its injected
`--vscode-*` CSS variable for a given id. The Inspector resolves colors by
Theme Color ID (search/browse, not pixel-picking) through exactly that
mechanism. See [ADR 0004](adr/0004-inspector-strategy.md) for the full
evidence and the comparison of alternatives (A–F).

## VS Code baseline

`apps/vscode-extension` declares `engines.vscode: ^1.90.0`. This is a
provisional floor, not yet validated against real users; it will be
reassessed once the extension actually exercises non-trivial API surface.
The extension has been verified to activate against VS Code `1.134.0`
(the version installed in this environment). `@types/vscode` is pinned to
match the `engines.vscode` floor, per the
[official guidance](https://code.visualstudio.com/api/references/extension-manifest).
