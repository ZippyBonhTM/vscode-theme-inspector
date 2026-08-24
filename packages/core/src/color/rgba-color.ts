/**
 * An RGBA color, normalized to a single in-memory representation regardless
 * of how it was originally expressed (hex, VS Code's 0–1 float `Color`,
 * etc.).
 *
 * `r`/`g`/`b` are integers in `[0, 255]`. `a` (alpha) is a float in
 * `[0, 1]`, matching both CSS `rgba()` and VS Code's `workbench.colorCustomizations`
 * alpha semantics.
 */
export interface RgbaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const HEX_PATTERN = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function expandShorthand(hex: string): string {
  return hex
    .split('')
    .map((digit) => digit + digit)
    .join('');
}

/**
 * Parses a hex color string in any of the formats VS Code documents as
 * valid for `workbench.colorCustomizations`: `#RGB`, `#RGBA`, `#RRGGBB`,
 * `#RRGGBBAA`. Returns `undefined` — never throws — for anything else, so
 * callers can treat "not a color" as a normal, expected outcome rather than
 * an exceptional one.
 *
 * If no alpha is present, it defaults to `1` (opaque), matching VS Code's
 * documented default for `#RGB`/`#RRGGBB`.
 */
export function parseHexColor(input: string): RgbaColor | undefined {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match?.[1]) return undefined;

  const digits = match[1].length <= 4 ? expandShorthand(match[1]) : match[1];
  const r = Number.parseInt(digits.slice(0, 2), 16);
  const g = Number.parseInt(digits.slice(2, 4), 16);
  const b = Number.parseInt(digits.slice(4, 6), 16);
  const a = digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
}

const RGB_FUNCTION_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9.]+)\s*)?\)$/i;

/**
 * Parses a CSS `rgb()`/`rgba()` function string (the legacy comma-separated
 * form, e.g. `rgb(24, 24, 24)` / `rgba(24, 24, 24, 0.5)`). Returns
 * `undefined` for anything else, including invalid channel values.
 */
export function parseRgbFunctionColor(input: string): RgbaColor | undefined {
  const match = RGB_FUNCTION_PATTERN.exec(input.trim());
  if (!match) return undefined;

  const [, rRaw, gRaw, bRaw, aRaw] = match;
  const r = Number(rRaw);
  const g = Number(gRaw);
  const b = Number(bRaw);
  const a = aRaw === undefined ? 1 : Number(aRaw);

  if ([r, g, b].some((channel) => channel > 255) || a < 0 || a > 1) return undefined;

  return { r, g, b, a };
}

/**
 * Parses a CSS color string in whatever format it happens to be in — hex
 * (`parseHexColor`) or `rgb()`/`rgba()` (`parseRgbFunctionColor`). Intended
 * for colors of unknown/external origin, such as a value read back from a
 * `--vscode-*` CSS custom property via `getComputedStyle`. Returns
 * `undefined` for anything neither parser recognizes (e.g. a named CSS
 * color, `hsl()`, or an empty/unset variable).
 */
export function parseCssColor(input: string): RgbaColor | undefined {
  return parseHexColor(input) ?? parseRgbFunctionColor(input);
}

function toHexByte(value: number): string {
  return Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Formats a color as a hex string. Omits the alpha channel (`#RRGGBB`)
 * when the color is fully opaque, unless `forceAlpha` is set — otherwise
 * emits `#RRGGBBAA`.
 */
export function toHex(color: RgbaColor, options: { forceAlpha?: boolean } = {}): string {
  const { r, g, b, a } = color;
  const rgb = `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
  const isOpaque = clamp(a, 0, 1) >= 1;
  if (isOpaque && !options.forceAlpha) return rgb;
  return `${rgb}${toHexByte(clamp(a, 0, 1) * 255)}`;
}

/** Formats a color as a CSS `rgba()` (or `rgb()` when fully opaque) string. */
export function toRgbaCss(color: RgbaColor): string {
  const { r, g, b, a } = color;
  const alpha = clamp(a, 0, 1);
  if (alpha >= 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
}
