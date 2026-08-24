/**
 * Public entry point for `@vscode-theme-inspector/theme-colors`.
 *
 * Everything re-exported from this module is public API. `src/data/` and the
 * internal `byId`/`categories` indexes in `src/registry.ts` are
 * implementation details and must not be imported directly.
 */

export { cssVariableToThemeColorId, themeColorIdToCssVariable } from './css-variable';
export { ThemeColorRegistry } from './registry';
export type { ThemeColorDefinition } from './types';
