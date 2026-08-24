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

## Two features: Hover Inspector (primary) + Theme Color Explorer (secondary)

The product is two coexisting features, not one
([docs/implementation-plan.md](implementation-plan.md) §0):

1. **Hover Inspector** (primary) — move the mouse over the real Workbench,
   see the region highlighted, see its Theme Color ID / computed style /
   resolved color live. `Theme Inspector: Turn On` / `Turn Off`.
2. **Theme Color Explorer** (secondary, already implemented) — search/browse
   Theme Color IDs by category. `Theme Inspector: Open Theme Color Explorer`.
   Available regardless of Hover Inspector's on/off state.

### Theme Color Explorer strategy (FASE 0 research)

Extensions run in a separate Extension Host process and cannot access the
Workbench DOM; webviews are isolated pages and cannot either. There is no
supported way to build a literal "point at a live UI element" picker this
way. **There is also no public API to resolve a Theme Color ID to a color
value** — `vscode.ColorTheme` only exposes `kind` — confirmed directly
against `microsoft/vscode`'s `vscode.d.ts` (an earlier draft of this
decision wrongly claimed such an API existed; see the correction at the top
of [ADR 0004](adr/0004-inspector-strategy.md)). The only live resolution
mechanism available to the public API is a webview reading its injected
`--vscode-*` CSS variable for a given id. The Explorer resolves colors by
Theme Color ID (search/browse, not pixel-picking) through exactly that
mechanism. See [ADR 0004](adr/0004-inspector-strategy.md) for the full
evidence and the comparison of alternatives (A–F).

### Hover Inspector strategy (validated, not yet implemented)

A true live hover picker over the _real_ Workbench needs actual DOM access,
which — per the above — no public API provides. The only technically
verified path is the **Chrome DevTools Protocol**, attached to the
Workbench's own renderer via `--remote-debugging-port` (a switch VS Code's
own `src/main.ts` explicitly allowlists for persistent use via `argv.json`
— not a random Electron flag, but still outside the Extension API's
compatibility contract). This was **empirically validated this session**
against a real, isolated, disposable VS Code instance: real
`document.elementFromPoint` + `getComputedStyle` access, and real-time
`mousemove` streaming via `Runtime.addBinding`, both confirmed working, then
torn down. See [ADR 0005](adr/0005-hover-inspector-strategy.md) for the full
investigation, the alternatives rejected (OS accessibility APIs — wrong
data; the `EyeDropper` API — confirmed click-only by spec, no live hover
callback), and the security/UX trade-offs (local RCE-shaped attack surface
via the debug port; requires a full VS Code restart, not just reload;
Desktop-only) that must be explicitly accepted before implementation
proceeds — this ADR's status is "Proposed," not "Accepted."

## VS Code baseline

`apps/vscode-extension` declares `engines.vscode: ^1.90.0`. This is a
provisional floor, not yet validated against real users; it will be
reassessed once the extension actually exercises non-trivial API surface.
The extension has been verified to activate against VS Code `1.134.0`
(the version installed in this environment). `@types/vscode` is pinned to
match the `engines.vscode` floor, per the
[official guidance](https://code.visualstudio.com/api/references/extension-manifest).
