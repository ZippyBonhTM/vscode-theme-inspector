import { toHex } from '../color/rgba-color';
import type { RgbaColor } from '../color/rgba-color';

/**
 * The shape of the (global-scope) `workbench.colorCustomizations` setting
 * value: a flat map of Theme Color ID to hex color string.
 *
 * Per-theme scoping (`"[Theme Name]": { ... }`, implementation-plan §19) is
 * out of scope for the MVP — see `docs/adr/0004-inspector-strategy.md`.
 */
export type ColorCustomizations = Readonly<Record<string, string>>;

/**
 * Builds the single-entry override object for one Theme Color ID, e.g.
 * `generateOverride({ id: 'sideBar.background', color })` →
 * `{ "sideBar.background": "#202020" }` (implementation-plan §17).
 */
export function generateOverride(input: { id: string; color: RgbaColor }): ColorCustomizations {
  return { [input.id]: toHex(input.color) };
}

/**
 * Returns a new `workbench.colorCustomizations` value with `id` set to
 * `color`, preserving every other existing entry untouched
 * (implementation-plan §18). Never mutates `existing`.
 */
export function mergeColorCustomization(
  existing: ColorCustomizations,
  id: string,
  color: RgbaColor,
): ColorCustomizations {
  return { ...existing, [id]: toHex(color) };
}

/**
 * Formats a `ColorCustomizations` value as a pretty-printed, directly
 * pasteable `settings.json` snippet:
 * `{ "workbench.colorCustomizations": { "id": "#hex" } }`
 * (implementation-plan §17).
 */
export function formatColorCustomizationsSnippet(customizations: ColorCustomizations): string {
  return JSON.stringify({ 'workbench.colorCustomizations': customizations }, null, 2);
}
