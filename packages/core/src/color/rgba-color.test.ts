import { describe, expect, it } from 'vitest';

import {
  parseCssColor,
  parseHexColor,
  parseRgbFunctionColor,
  toHex,
  toRgbaCss,
} from './rgba-color';

describe('parseHexColor', () => {
  it('parses #RRGGBB', () => {
    expect(parseHexColor('#181818')).toEqual({ r: 0x18, g: 0x18, b: 0x18, a: 1 });
  });

  it('parses #RRGGBBAA', () => {
    expect(parseHexColor('#20202080')).toEqual({
      r: 0x20,
      g: 0x20,
      b: 0x20,
      a: 0x80 / 255,
    });
  });

  it('expands #RGB shorthand', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('expands #RGBA shorthand exactly like the VS Code docs example (#e35f -> #ee3355ff)', () => {
    expect(parseHexColor('#e35f')).toEqual(parseHexColor('#ee3355ff'));
  });

  it('is case-insensitive', () => {
    expect(parseHexColor('#ABCDEF')).toEqual(parseHexColor('#abcdef'));
  });

  it('returns undefined for invalid input instead of throwing', () => {
    expect(parseHexColor('not-a-color')).toBeUndefined();
    expect(parseHexColor('#12')).toBeUndefined();
    expect(parseHexColor('rgb(0,0,0)')).toBeUndefined();
  });
});

describe('toHex', () => {
  it('omits alpha when fully opaque', () => {
    expect(toHex({ r: 24, g: 24, b: 24, a: 1 })).toBe('#181818');
  });

  it('includes alpha when translucent', () => {
    expect(toHex({ r: 32, g: 32, b: 32, a: 0.5 })).toBe('#20202080');
  });

  it('forces alpha when requested even if opaque', () => {
    expect(toHex({ r: 255, g: 255, b: 255, a: 1 }, { forceAlpha: true })).toBe('#ffffffff');
  });

  it('round-trips through parseHexColor', () => {
    const original = '#e35f';
    const parsed = parseHexColor(original);
    expect(parsed).toBeDefined();
    expect(toHex(parsed!)).toBe(toHex(parseHexColor('#ee3355ff')!));
  });
});

describe('parseRgbFunctionColor', () => {
  it('parses rgb()', () => {
    expect(parseRgbFunctionColor('rgb(24, 24, 24)')).toEqual({ r: 24, g: 24, b: 24, a: 1 });
  });

  it('parses rgba()', () => {
    expect(parseRgbFunctionColor('rgba(32, 32, 32, 0.5)')).toEqual({
      r: 32,
      g: 32,
      b: 32,
      a: 0.5,
    });
  });

  it('tolerates missing whitespace after commas', () => {
    expect(parseRgbFunctionColor('rgba(1,2,3,0.25)')).toEqual({ r: 1, g: 2, b: 3, a: 0.25 });
  });

  it('returns undefined for out-of-range channels or alpha', () => {
    expect(parseRgbFunctionColor('rgb(256, 0, 0)')).toBeUndefined();
    expect(parseRgbFunctionColor('rgba(0, 0, 0, 1.5)')).toBeUndefined();
  });

  it('returns undefined for non-rgb input', () => {
    expect(parseRgbFunctionColor('#181818')).toBeUndefined();
    expect(parseRgbFunctionColor('hsl(0, 0%, 0%)')).toBeUndefined();
  });
});

describe('parseCssColor', () => {
  it('parses hex colors', () => {
    expect(parseCssColor('#181818')).toEqual({ r: 24, g: 24, b: 24, a: 1 });
  });

  it('parses rgb()/rgba() colors', () => {
    expect(parseCssColor('rgba(24, 24, 24, 0.5)')).toEqual({ r: 24, g: 24, b: 24, a: 0.5 });
  });

  it('returns undefined for formats it does not recognize', () => {
    expect(parseCssColor('hsl(0, 0%, 0%)')).toBeUndefined();
    expect(parseCssColor('')).toBeUndefined();
  });
});

describe('toRgbaCss', () => {
  it('formats opaque colors as rgb()', () => {
    expect(toRgbaCss({ r: 24, g: 24, b: 24, a: 1 })).toBe('rgb(24, 24, 24)');
  });

  it('formats translucent colors as rgba()', () => {
    expect(toRgbaCss({ r: 32, g: 32, b: 32, a: 0.5 })).toBe('rgba(32, 32, 32, 0.5)');
  });
});
