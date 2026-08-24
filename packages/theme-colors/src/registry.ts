import { cssVariableToThemeColorId } from './css-variable';
import { THEME_COLORS } from './data/theme-colors.generated';
import type { ThemeColorDefinition } from './types';

const byId = new Map<string, ThemeColorDefinition>(THEME_COLORS.map((color) => [color.id, color]));

const categories = Array.from(new Set(THEME_COLORS.map((color) => color.category))).sort((a, b) =>
  a.localeCompare(b),
);

/**
 * Read-only registry of every Theme Color ID documented by VS Code (see
 * `scripts/generate-theme-colors.mjs` for the source and regeneration
 * process).
 *
 * This registry only knows about IDs and their metadata (category,
 * description) — it does not resolve colors. There is no VS Code API that
 * resolves a Theme Color ID to its current color value; resolving one
 * requires a webview reading its own injected `--vscode-*` CSS variable
 * (see [ADR 0004](../../../docs/adr/0004-inspector-strategy.md)) and
 * belongs to the extension, not this package.
 */
export const ThemeColorRegistry = {
  /** All known Theme Color definitions, in the order documented by VS Code. */
  all(): readonly ThemeColorDefinition[] {
    return THEME_COLORS;
  },

  /** Look up a single Theme Color definition by its exact id, if known. */
  get(id: string): ThemeColorDefinition | undefined {
    return byId.get(id);
  },

  /**
   * Look up a Theme Color definition by its `--vscode-*` CSS custom
   * property name (e.g. `--vscode-editor-background`), if known.
   */
  getByCssVariable(variable: string): ThemeColorDefinition | undefined {
    const id = cssVariableToThemeColorId(variable);
    return id === undefined ? undefined : byId.get(id);
  },

  /** Whether `id` is a known Theme Color ID. */
  has(id: string): boolean {
    return byId.has(id);
  },

  /** All category names, sorted alphabetically. */
  categories(): readonly string[] {
    return categories;
  },

  /** All Theme Color definitions belonging to `category` (exact match). */
  byCategory(category: string): readonly ThemeColorDefinition[] {
    return THEME_COLORS.filter((color) => color.category === category);
  },

  /**
   * Case-insensitive substring search over both `id` and `description`.
   * An empty or whitespace-only query returns every definition.
   */
  search(query: string): readonly ThemeColorDefinition[] {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return THEME_COLORS;
    return THEME_COLORS.filter(
      (color) =>
        color.id.toLowerCase().includes(needle) || color.description.toLowerCase().includes(needle),
    );
  },
};
