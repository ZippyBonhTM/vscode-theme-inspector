/**
 * Public entry point for `@vscode-theme-inspector/core`.
 *
 * Everything re-exported from this module is considered part of the
 * package's public API and, once the package reaches a stable release, is
 * subject to semantic versioning guarantees. Internal modules (e.g. under
 * `src/internal/`, once introduced) must never be imported directly by
 * consumers.
 *
 * This package intentionally has no domain logic yet — see
 * `docs/implementation-plan.md` for the roadmap (Theme Color registry, CSS
 * variable parser, color resolver, JSON generator). `CORE_VERSION` exists
 * only to give the bootstrap phase a real, testable public export.
 */

import { version } from '../package.json';

/** The current version of `@vscode-theme-inspector/core`. */
export const CORE_VERSION: string = version;
