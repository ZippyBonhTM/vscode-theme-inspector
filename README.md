# VS Code Theme Inspector

An open source tool for visually inspecting the colors and Theme Color tokens
behind the VS Code Workbench UI.

> **Early development — architecture and APIs are subject to change.**
> A proof of concept is working: click the Theme Inspector icon in the
> Activity Bar to search Theme Color IDs and see their currently resolved
> color. There is no visual element picker — see
> [docs/adr/0004-inspector-strategy.md](docs/adr/0004-inspector-strategy.md)
> for why. See [docs/implementation-plan.md](docs/implementation-plan.md)
> for the roadmap.

## Project status

Working: a Theme Color ID registry (910 entries, generated from the
official reference), a color engine (hex/`rgb()` parsing and formatting),
`workbench.colorCustomizations` JSON generation, and a webview-based
Inspector that resolves any known Theme Color ID to its live color. Not
yet implemented: a visual "point at a UI element" picker (not possible with
supported APIs — see the ADR above), per-theme-scoped overrides, and
applying changes back to `settings.json`.

## Architecture

The project is organized as a monorepo with a clear dependency direction:

```text
apps/vscode-extension  →  packages/core
                       →  packages/theme-colors
(official extension)      (reusable, VS Code-independent libraries)
```

The official extension is a _consumer_ of the core library, never the other
way around. This lets third parties reuse the core to build their own tools.

See [docs/architecture-decision.md](docs/architecture-decision.md) and
[docs/adr/](docs/adr/) for the reasoning behind these decisions.

## Repository layout

```text
apps/
  vscode-extension/   Official VS Code extension (consumer of the packages below)
packages/
  core/                Color engine, inspection models, JSON generation
  theme-colors/        Theme Color ID registry (generated from the official reference)
docs/                  Planning and architectural documentation
scripts/               Repo maintenance scripts (e.g. registry regeneration)
.github/workflows/      CI
```

## Development

Requirements: Node.js >= 20, npm (workspaces).

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)
