import { describe, expect, it } from 'vitest';

import { cssVariableToThemeColorId, themeColorIdToCssVariable } from './css-variable';
import { ThemeColorRegistry } from './registry';

describe('themeColorIdToCssVariable', () => {
  it('replaces dots with dashes and adds the --vscode- prefix', () => {
    expect(themeColorIdToCssVariable('sideBar.background')).toBe('--vscode-sideBar-background');
  });
});

describe('cssVariableToThemeColorId', () => {
  it('is the inverse of themeColorIdToCssVariable', () => {
    expect(cssVariableToThemeColorId('--vscode-sideBar-background')).toBe('sideBar.background');
  });

  it('returns undefined for a variable without the --vscode- prefix', () => {
    expect(cssVariableToThemeColorId('--not-vscode-foo')).toBeUndefined();
    expect(cssVariableToThemeColorId('color')).toBeUndefined();
  });

  it('round-trips every real registry id through both directions', () => {
    for (const { id } of ThemeColorRegistry.all()) {
      const variable = themeColorIdToCssVariable(id);
      expect(cssVariableToThemeColorId(variable)).toBe(id);
    }
  });
});

describe('ThemeColorRegistry.getByCssVariable', () => {
  it('finds a known id by its CSS variable name', () => {
    expect(ThemeColorRegistry.getByCssVariable('--vscode-sideBar-background')?.id).toBe(
      'sideBar.background',
    );
  });

  it('returns undefined for an unknown variable', () => {
    expect(ThemeColorRegistry.getByCssVariable('--vscode-not-a-real-color')).toBeUndefined();
    expect(ThemeColorRegistry.getByCssVariable('not-a-css-variable-at-all')).toBeUndefined();
  });
});
