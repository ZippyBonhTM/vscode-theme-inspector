# Theme Inspector (VS Code extension)

Official VS Code extension for the Theme Inspector project. Two coexisting
features (see [docs/implementation-plan.md](../../docs/implementation-plan.md) §0):

## Hover Inspector

`Theme Inspector: Turn On` / `Turn Off` (or click the status bar item, or
`Theme Inspector: Toggle Inspector`). While on, hovering a Theme Color ID
(`sideBar.background`) or a `--vscode-*` CSS variable inside a
JSON/CSS/SCSS/LESS document shows its category and description, and briefly
highlights it. This is scoped to editor text, not the Workbench UI itself
— see [docs/adr/0005-hover-inspector-strategy.md](../../docs/adr/0005-hover-inspector-strategy.md)
for why a true live picker over the real UI (Activity Bar, Side Bar,
Status Bar, Panel) was investigated via the Chrome DevTools Protocol and
rejected on security grounds.

## Theme Color Explorer

Click the Theme Inspector icon in the Activity Bar (or run
**Theme Inspector: Open Theme Color Explorer**) to search/browse all Theme
Color IDs and see their live resolved color. Available regardless of the
Hover Inspector's on/off state. The hover's "Resolve live color & copy
JSON" link opens this, pre-searched — see
[docs/adr/0004-inspector-strategy.md](../../docs/adr/0004-inspector-strategy.md)
for how resolution actually works (a webview reading its own injected
`--vscode-*` CSS variables — the only mechanism that exists for this).

This package is the **consumer** of `@vscode-theme-inspector/core` and
`@vscode-theme-inspector/theme-colors`; it must not contain domain logic
that belongs in those packages (parsing, resolution, color math, registry
lookups). Its responsibilities are activation, commands, the hover
provider, the webview UI, and integration with the VS Code Extension API.

## Development

Open this repository in VS Code and press `F5` (or "Run Extension" in the
Run and Debug view) to launch the Extension Development Host.

```bash
npm run build -w apps/vscode-extension
npm run typecheck -w apps/vscode-extension
npm run test -w apps/vscode-extension   # integration tests, Extension Development Host
```
