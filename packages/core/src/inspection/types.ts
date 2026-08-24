import type { RgbaColor } from '../color/rgba-color';

/**
 * How confident the resolver is that a given Theme Color ID actually
 * governs the color it is reporting.
 *
 * See `docs/implementation-plan.md` §11. Never widen a real result to
 * `"exact"` without direct evidence for it (e.g. a resolved value from
 * `ColorTheme.getColor`) — see `docs/adr/0004-inspector-strategy.md` for
 * why the MVP currently only ever produces `"exact"` or nothing.
 */
export type Confidence = 'exact' | 'likely' | 'possible' | 'unknown';

/** Where a resolved color's value came from. */
export type ColorSource =
  /** `vscode.window.activeColorTheme.getColor(id)` — the public, stable API. */
  | 'theme-color-api'
  /** A `--vscode-*` CSS custom property read from a webview. */
  | 'webview-css-variable'
  /** Supplied manually by the user (e.g. via the DevTools-assisted workflow). */
  | 'manual';

/** A color resolved for a specific Theme Color ID, with its provenance. */
export interface ResolvedColor {
  readonly color: RgbaColor;
  readonly source: ColorSource;
}

/** A candidate Theme Color ID for a given piece of evidence, with confidence. */
export interface ThemeColorCandidate {
  readonly id: string;
  readonly confidence: Confidence;
  readonly resolved?: ResolvedColor;
}
