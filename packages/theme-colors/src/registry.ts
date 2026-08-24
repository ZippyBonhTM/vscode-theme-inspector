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
 * description) — it does not resolve colors. Resolving a specific ID to its
 * current color requires a running VS Code instance and belongs to the
 * extension (`vscode.window.activeColorTheme.getColor(id)`).
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
