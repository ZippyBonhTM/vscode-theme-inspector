# Theme Inspector (VS Code extension)

Official VS Code extension for the Theme Inspector project.

> **Early development — POC.** Run **Theme Inspector: Open Inspector** from
> the Command Palette to search Theme Color IDs and see their current
> resolved color. There is no visual "point at a UI element" picker — see
> [docs/adr/0004-inspector-strategy.md](../../docs/adr/0004-inspector-strategy.md)
> for why, and for how resolution actually works (a webview reading its own
> injected `--vscode-*` CSS variables — the only mechanism that exists for
> this).

This package is the **consumer** of `@vscode-theme-inspector/core` and
`@vscode-theme-inspector/theme-colors`; it must not contain domain logic
that belongs in those packages (parsing, resolution, color math, registry
lookups). Its responsibilities are activation, commands, the webview UI,
and integration with the VS Code Extension API.

## Development

Open this repository in VS Code and press `F5` (or "Run Extension" in the
Run and Debug view) to launch the Extension Development Host.

```bash
npm run build -w apps/vscode-extension
npm run typecheck -w apps/vscode-extension
npm run test -w apps/vscode-extension   # integration tests, Extension Development Host
```
