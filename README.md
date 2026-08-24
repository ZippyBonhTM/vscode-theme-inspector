# VS Code Theme Inspector

An open source tool for visually inspecting the colors and Theme Color tokens
behind the VS Code Workbench UI.

> **Early development — architecture and APIs are subject to change.**
> This project is currently in its bootstrap phase. No inspection features
> exist yet; see [docs/implementation-plan.md](docs/implementation-plan.md)
> for the roadmap.

## Project status

This repository is being prepared for development: workspace layout, tooling,
CI, and a minimal extension scaffold. The actual Theme Inspector
functionality (visual element picker, Theme Color resolution, CSS variable
parsing, JSON generation, etc.) has not been implemented yet.

## Architecture

The project is organized as a monorepo with a clear dependency direction:

```text
apps/vscode-extension  →  packages/core
(official extension)      (reusable, VS Code-independent library)
```

The official extension is a _consumer_ of the core library, never the other
way around. This lets third parties reuse the core to build their own tools.

See [docs/architecture-decision.md](docs/architecture-decision.md) and
[docs/adr/](docs/adr/) for the reasoning behind these decisions.

## Repository layout

```text
apps/
  vscode-extension/   Official VS Code extension (consumer of core)
packages/
  core/                Framework-agnostic core library
docs/                  Planning and architectural documentation
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
