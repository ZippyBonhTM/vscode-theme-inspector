# 0004 — Inspector strategy: how the Inspector can actually resolve colors

## Status

Accepted (for the MVP scope). Revisit if VS Code ships new proposed APIs
relevant to theming.

## Status of this research

This is FASE 0 of `docs/implementation-plan.md` (§62–§64): technical
feasibility research, done _before_ writing any Inspector code, per
`docs/bootstrap-plan.md`'s rule against implementing functionality during
bootstrap and `docs/implementation-plan.md` §63's explicit instruction to
research, compare alternatives, and propose an architecture before coding.
No product code was written for this ADR — only this document.

## The central question

> Pode uma extensão instalada no VS Code acessar diretamente o DOM do
> Workbench? (implementation-plan §12)

**No — confirmed, not assumed.** VS Code's own extension architecture
document states extensions "can't touch the DOM, they can't call
`document.getElementById`, and they can't even import Electron APIs" — this
is a deliberate design choice, not a missing feature. Extensions run in a
separate **Extension Host** process (a plain Node.js process), communicating
with the renderer (where the real Workbench DOM lives) only through a
bidirectional RPC protocol that exposes the documented `vscode` API surface
— nothing DOM-shaped crosses that boundary.
([Our Approach to Extensibility](https://vscode-docs.readthedocs.io/en/stable/extensions/our-approach/))

**Webviews don't help here either.** A `Webview`/`WebviewView` is a
sandboxed iframe with its own isolated document — it cannot reach into the
Workbench's DOM any more than the extension host can. It is a _separate_,
extension-controlled page, not a window onto the real UI.
([Webview guide](https://code.visualstudio.com/api/extension-guides/webview))

**Consequence:** a literal "hover over a real pixel in the Explorer and see
which Theme Color ID paints it" picker, operating automatically over the
live Workbench, **is not achievable through any documented, stable VS Code
extension API.** This directly affects how "Selecionar elemento" in
implementation-plan §15/§60 can be implemented — see Decision, below.

## What _is_ available (evidence, not assumption)

| #   | Mechanism                                                                                                                                                                                                                        | What it gives us                                                                                                                                                                                                                                                                                                          | Classification                                                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `vscode.window.activeColorTheme: ColorTheme`, `ColorTheme.getColor(colorId: string): Color \| undefined`, `vscode.window.onDidChangeActiveColorTheme`                                                                            | Given a **known** Theme Color ID, resolve its current color (RGBA, 0–1 components) from the active theme, live, reactively.                                                                                                                                                                                               | **Official, stable public API.**                                                                                                                                                                                                                                                                          |
| 2   | Webview CSS variable injection: VS Code sets `--vscode-<id-with-dots-as-dashes>` custom properties on an extension Webview's document (e.g. `editor.foreground` → `--vscode-editor-foreground`), readable via `getComputedStyle` | A second, CSS-native way to read resolved theme colors inside a webview we control — useful for rendering swatches/previews, and as a cross-check against (1). Does **not** expose the real Workbench DOM, only our own webview page.                                                                                     | **Official, documented, stable.**                                                                                                                                                                                                                                                                         |
| 3   | `workbench.action.toggleDevTools` (opens Chromium DevTools on the main window)                                                                                                                                                   | Lets a **human** manually inspect the real Workbench DOM and read live computed `--vscode-*` values themselves.                                                                                                                                                                                                           | **Official command, but Desktop-only** — confirmed unavailable on vscode.dev/web ([microsoft/vscode#148660](https://github.com/microsoft/vscode/issues/148660), closed as-designed for web). Not something the extension can drive programmatically; it only opens a UI the user then manually navigates. |
| 4   | Theme Color Reference page (`code.visualstudio.com/api/references/theme-color`)                                                                                                                                                  | The canonical list of Theme Color IDs — but as prose/HTML documentation, not a machine-readable registry, and there is **no stable/proposed API to enumerate all IDs at runtime.**                                                                                                                                        | Documentation only; no API.                                                                                                                                                                                                                                                                               |
| 5   | `@vscode/theme-color-consumer` (Microsoft, **archived Dec 2022**)                                                                                                                                                                | Prior art: statically extracts default color values by cloning VS Code source and parsing its color registry + theme JSON — an offline/static resolution strategy, not a live one. Confirms there has never been an official live "enumerate all colors" API; the community workaround has always been static extraction. | Reference only — not a dependency (unmaintained).                                                                                                                                                                                                                                                         |
| 6   | Chrome DevTools Protocol attach (e.g. `--remote-debugging-port` on the Electron process)                                                                                                                                         | Would in principle allow reading the _real_ Workbench DOM/computed styles programmatically.                                                                                                                                                                                                                               | **Unsupported/internal** — not exposed to installed extensions through any documented mechanism; requires a launch flag the extension cannot set on an already-running instance. Rejected.                                                                                                                |

## Strategies compared (implementation-plan §14)

| Strategy                                        | Viability                         | Complexity                 | Stability                                                                                            | Notes                                                                                                                                                                                     |
| ----------------------------------------------- | --------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Public API** (`ColorTheme.getColor`)       | High, for ID → color              | Low                        | Stable                                                                                               | Cannot discover _which_ ID governs a given visual element; the user (or our registry) must supply the ID.                                                                                 |
| **B. Webview + communication**                  | High, for rendering/preview       | Low–Medium                 | Stable                                                                                               | Same limitation as A for discovery; good for swatches, category browsing UI, and future live-preview/theme-editor work.                                                                   |
| **C. DevTools**                                 | Only as a manual, user-driven aid | Low (just opens a command) | Desktop-only, officially supported as a command                                                      | Cannot be automated; the extension cannot read what the user sees in DevTools.                                                                                                            |
| **D. Electron/CDP integration**                 | Low                               | High                       | Unsupported                                                                                          | Rejected — no supported attach path from an installed extension.                                                                                                                          |
| **E. Extension + external auxiliary mechanism** | Not evaluated further             | —                          | —                                                                                                    | Would mean shipping/spawning an out-of-band process to attach to the renderer; same unsupported-attach problem as D, plus packaging/security concerns. Rejected for the same reason as D. |
| **F. Hybrid**                                   | **Selected**                      | Medium                     | Built from stable pieces (A + B), with an explicitly optional, manual DevTools-assisted workflow (C) | See Decision.                                                                                                                                                                             |

## Decision

The MVP Inspector is **not** a live element picker over the real Workbench.
It is:

1. **Search/browse by Theme Color ID or category** (implementation-plan
   §26–§27 already describe exactly this UX: search, categories like
   "Side Bar", "Editor", "Terminal"). This sidesteps the unsolvable
   "element → ID" direction entirely and only needs the solved "ID → color"
   direction.
2. **Resolve via Strategy A** — `activeColorTheme.getColor(id)` — as the
   primary, canonical resolution mechanism, confidence `"exact"` when it
   returns a value.
3. **Corroborate/preview via Strategy B** — a webview reading the same id's
   `--vscode-*` CSS variable — used for rendering the color swatch and as a
   sanity cross-check, not as a second independent resolution path (both
   ultimately reflect the same active theme).
4. An **explicitly optional, clearly-labeled "Advanced: inspect with
   DevTools"** action that runs `workbench.action.toggleDevTools` (Desktop
   only, feature-detected — never assumed available) and documents, in the
   UI, how the user can manually find a `--vscode-*` variable on a real
   element and paste the derived ID back into the Inspector. This is
   presented as a manual, human-in-the-loop workaround for the
   element→ID direction — never as something the extension itself performs
   — matching the honesty rule in implementation-plan §61 (no faking
   support that doesn't exist).

`vscode.window.onDidChangeActiveColorTheme` re-resolves shown colors
automatically when the user switches themes, satisfying
`docs/implementation-plan.md` §56 (event-driven, not polling).

## Consequences

- `Confidence` (implementation-plan §11) for MVP results is effectively
  always `"exact"` (resolved via the public API) or the candidate is simply
  not offered — there is no live evidence-gathering step yet that would
  produce `"likely"`/`"possible"` results. Those levels become meaningful
  once/if a DOM-adjacent evidence source (e.g. the manual DevTools
  workflow's user-supplied evidence) is wired into the model — worth
  revisiting once the registry (FASE 4) and resolver (FASE 3) exist.
- The Theme Color **registry** (FASE 4) must be sourced from static data
  (parsing the reference doc or VS Code's own `colorRegistry.ts`), not from
  a runtime enumeration API, since none exists. This is a real, ongoing
  maintenance cost — documented here so it isn't rediscovered later as a
  surprise.
- "Selecionar elemento" in the visual sense described in
  implementation-plan §15/§60 is deferred: it cannot be built as a
  supported feature today. If Microsoft ships a proposed API for this in
  the future, this ADR should be revisited.
