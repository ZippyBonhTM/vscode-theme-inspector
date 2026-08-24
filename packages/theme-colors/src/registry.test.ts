import { describe, expect, it } from 'vitest';

import { ThemeColorRegistry } from './registry';

describe('ThemeColorRegistry', () => {
  it('contains a well-known color id with the expected shape', () => {
    const color = ThemeColorRegistry.get('sideBar.background');
    expect(color).toBeDefined();
    expect(color?.id).toBe('sideBar.background');
    expect(color?.category.length).toBeGreaterThan(0);
    expect(color?.description.length).toBeGreaterThan(0);
  });

  it('returns undefined for an unknown id', () => {
    expect(ThemeColorRegistry.get('not.a.real.color.id')).toBeUndefined();
  });

  it('has() agrees with get()', () => {
    expect(ThemeColorRegistry.has('editor.background')).toBe(true);
    expect(ThemeColorRegistry.has('not.a.real.color.id')).toBe(false);
  });

  it('has no duplicate ids', () => {
    const ids = ThemeColorRegistry.all().map((color) => color.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups by category consistently with categories()', () => {
    for (const category of ThemeColorRegistry.categories()) {
      const colors = ThemeColorRegistry.byCategory(category);
      expect(colors.length).toBeGreaterThan(0);
      for (const color of colors) {
        expect(color.category).toBe(category);
      }
    }
  });

  it('search matches by id and by description, case-insensitively', () => {
    expect(
      ThemeColorRegistry.search('SIDEBAR.BACKGROUND').some((c) => c.id === 'sideBar.background'),
    ).toBe(true);
    expect(ThemeColorRegistry.search('side bar background').length).toBeGreaterThan(0);
  });

  it('search with an empty query returns everything', () => {
    expect(ThemeColorRegistry.search('  ').length).toBe(ThemeColorRegistry.all().length);
  });
});
