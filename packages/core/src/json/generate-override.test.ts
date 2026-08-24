import { describe, expect, it } from 'vitest';

import {
  formatColorCustomizationsSnippet,
  generateOverride,
  mergeColorCustomization,
} from './generate-override';

describe('generateOverride', () => {
  it('produces a single-entry override with a hex color', () => {
    expect(
      generateOverride({ id: 'sideBar.background', color: { r: 32, g: 32, b: 32, a: 1 } }),
    ).toEqual({ 'sideBar.background': '#202020' });
  });

  it('includes alpha when translucent', () => {
    expect(
      generateOverride({ id: 'editor.background', color: { r: 0, g: 0, b: 0, a: 0.5 } }),
    ).toEqual({ 'editor.background': '#00000080' });
  });
});

describe('mergeColorCustomization', () => {
  it('preserves existing entries and adds the new one', () => {
    const existing = { 'editor.background': '#000000' };
    const merged = mergeColorCustomization(existing, 'sideBar.background', {
      r: 32,
      g: 32,
      b: 32,
      a: 1,
    });
    expect(merged).toEqual({
      'editor.background': '#000000',
      'sideBar.background': '#202020',
    });
  });

  it('overwrites only the targeted id', () => {
    const existing = { 'sideBar.background': '#000000', 'editor.background': '#111111' };
    const merged = mergeColorCustomization(existing, 'sideBar.background', {
      r: 255,
      g: 255,
      b: 255,
      a: 1,
    });
    expect(merged).toEqual({
      'sideBar.background': '#ffffff',
      'editor.background': '#111111',
    });
  });

  it('does not mutate the existing object', () => {
    const existing = Object.freeze({ 'editor.background': '#000000' });
    expect(() =>
      mergeColorCustomization(existing, 'sideBar.background', { r: 1, g: 2, b: 3, a: 1 }),
    ).not.toThrow();
    expect(existing).toEqual({ 'editor.background': '#000000' });
  });
});

describe('formatColorCustomizationsSnippet', () => {
  it('wraps the customizations under workbench.colorCustomizations as pretty JSON', () => {
    const snippet = formatColorCustomizationsSnippet({ 'sideBar.background': '#202020' });
    expect(JSON.parse(snippet)).toEqual({
      'workbench.colorCustomizations': { 'sideBar.background': '#202020' },
    });
    expect(snippet).toContain('\n');
  });
});
