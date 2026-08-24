const CSS_VARIABLE_PREFIX = '--vscode-';

/**
 * Converts a Theme Color ID to the CSS custom property VS Code injects for
 * it into webviews, e.g. `editor.background` → `--vscode-editor-background`
 * (dots become dashes). See
 * [ADR 0004](../../../docs/adr/0004-inspector-strategy.md).
 */
export function themeColorIdToCssVariable(id: string): string {
  return CSS_VARIABLE_PREFIX + id.replace(/\./g, '-');
}

/**
 * The inverse of {@link themeColorIdToCssVariable}: recovers the Theme
 * Color ID from a `--vscode-*` CSS custom property name. Returns
 * `undefined` if `variable` doesn't start with the `--vscode-` prefix.
 *
 * This is unambiguous because no known Theme Color ID contains a literal
 * hyphen (verified against the generated registry) — every dash in a
 * `--vscode-*` variable name came from a dot in the original id.
 */
export function cssVariableToThemeColorId(variable: string): string | undefined {
  const trimmed = variable.trim();
  if (!trimmed.startsWith(CSS_VARIABLE_PREFIX)) return undefined;
  return trimmed.slice(CSS_VARIABLE_PREFIX.length).replace(/-/g, '.');
}
