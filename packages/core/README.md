# @vscode-theme-inspector/core

Framework-agnostic core library for VS Code Theme Inspector.

> **Bootstrap phase.** This package currently exports only an infrastructure
> placeholder to validate the build/test/publish pipeline. Domain logic
> (Theme Color registry, CSS variable parser, color resolver, JSON
> generator) has not been implemented yet — see
> [docs/implementation-plan.md](../../docs/implementation-plan.md).

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
