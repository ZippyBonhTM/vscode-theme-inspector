# Theme Inspector (VS Code extension)

Official VS Code extension for the Theme Inspector project.

> **Bootstrap phase.** This extension currently only registers a placeholder
> command that confirms activation and wiring to `@vscode-theme-inspector/core`.
> No inspection functionality exists yet — see
> [docs/implementation-plan.md](../../docs/implementation-plan.md).

This package is the **consumer** of `@vscode-theme-inspector/core`; it must
not contain domain logic that belongs in the core (parsing, resolution,
color math). Its responsibilities are activation, commands, UI, and
integration with the VS Code Extension API.

## Development

Open this repository in VS Code and press `F5` (or "Run Extension" in the
Run and Debug view) to launch the Extension Development Host.

```bash
npm run build -w apps/vscode-extension
npm run typecheck -w apps/vscode-extension
npm run test -w apps/vscode-extension   # integration tests, Extension Development Host
```
