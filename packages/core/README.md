# @vscode-theme-inspector/core

Framework-agnostic core library for VS Code Theme Inspector.

> **Early development.** Implements the color engine, the inspection models
> (`ThemeColorCandidate`, `ResolvedColor`, `Confidence`, `ColorSource`), and
> `workbench.colorCustomizations` JSON generation. It does **not** know how
> to look up a Theme Color ID (see
> [@vscode-theme-inspector/theme-colors](../theme-colors)) or how to talk to
> VS Code (see [apps/vscode-extension](../../apps/vscode-extension)) — see
> [docs/adr/0004-inspector-strategy.md](../../docs/adr/0004-inspector-strategy.md)
> for why the Inspector is id-driven rather than a live element picker.

## Public API

Everything exported from [`src/index.ts`](src/index.ts) is the package's
public API. Do not import from `src/internal/**` (once it exists) or any
other path — those are implementation details and may change without
notice.

## Design constraint

This package must not depend on the `vscode` module unless there is a
documented technical reason to. It must remain usable and testable from
plain Node.js.

## Development

```bash
npm run build -w packages/core
npm run typecheck -w packages/core
npm run test -w packages/core
```
