/**
 * Public entry point for `@vscode-theme-inspector/core`.
 *
 * Everything re-exported from this module is considered part of the
 * package's public API and, once the package reaches a stable release, is
 * subject to semantic versioning guarantees. Internal modules (e.g. under
 * `src/internal/`, once introduced) must never be imported directly by
 * consumers.
 */

import { version } from '../package.json';

/** The current version of `@vscode-theme-inspector/core`. */
export const CORE_VERSION: string = version;

export {
  parseCssColor,
  parseHexColor,
  parseRgbFunctionColor,
  toHex,
  toRgbaCss,
} from './color/rgba-color';
export type { RgbaColor } from './color/rgba-color';

export type {
  ColorSource,
  Confidence,
  ResolvedColor,
  ThemeColorCandidate,
} from './inspection/types';

export {
  formatColorCustomizationsSnippet,
  generateOverride,
  mergeColorCustomization,
} from './json/generate-override';
export type { ColorCustomizations } from './json/generate-override';
