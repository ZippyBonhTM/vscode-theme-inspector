/**
 * A single Theme Color ID as documented by VS Code, with its category and
 * human-readable description.
 *
 * `id` is the exact string used both in `workbench.colorCustomizations` and
 * as the argument to `vscode.window.activeColorTheme.getColor(id)` (e.g.
 * `"sideBar.background"`).
 */
export interface ThemeColorDefinition {
  readonly id: string;
  readonly category: string;
  readonly description: string;
}
