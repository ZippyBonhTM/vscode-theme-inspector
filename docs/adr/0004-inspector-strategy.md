# 0004 — Inspector strategy: how the Inspector can actually resolve colors

## Status

Accepted (for the MVP scope). Revisit if VS Code ships new proposed APIs
relevant to theming.

**Correction (same day):** the first version of this ADR claimed
`vscode.window.activeColorTheme.getColor(colorId)` exists as a stable
public API. **It does not.** That claim came from web search summaries
that, on inspection, were describing `ColorTheme.getColor()` from the
third-party (Microsoft-authored but separate, archived)
`@vscode/theme-color-consumer` npm package — not from the built-in
`vscode` API. This was caught by checking the actual type declarations
(`@types/vscode`, and directly against
`microsoft/vscode`'s `src/vscode-dts/vscode.d.ts`) before writing any
adapter code against it, per `CLAUDE.md`'s "do not invent APIs" rule.
`vscode.ColorTheme` has exactly one member: `kind`. There is no `getColor`,
in the stable API or in any of the ~170 proposed-API declaration files in
the VS Code repository. This version of the ADR reflects the corrected,
verified findings; Strategy A below is written the way it actually is,
not the way it was first (wrongly) described.

## Status of this research

This is FASE 0 of `docs/implementation-plan.md` (§62–§64): technical
feasibility research, done _before_ writing any Inspector code, per
`docs/bootstrap-plan.md`'s rule against implementing functionality during
bootstrap and `docs/implementation-plan.md` §63's explicit instruction to
research, compare alternatives, and propose an architecture before coding.

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

**Webviews don't help with the _real_ Workbench DOM either.** A
`Webview`/`WebviewView` is a sandboxed iframe with its own isolated
document — it cannot reach into the Workbench's DOM any more than the
extension host can. It is a _separate_, extension-controlled page, not a
window onto the real UI.

**Consequence:** a literal "hover over a real pixel in the Explorer and see
which Theme Color ID paints it" picker, operating automatically over the
live Workbench, **is not achievable through any documented, stable VS Code
extension API.** This affects "Selecionar elemento" in implementation-plan
§15/§60 — see Decision, below.

## What _is_ available (evidence, verified against primary sources)

| #   | Mechanism                                                                                                                                                                                                                                                        | What it gives us                                                                                                                                                                                                                                                                                                                                                                                                                              | Classification                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Webview CSS variable injection: VS Code sets `--vscode-<id-with-dots-as-dashes>` custom properties on an extension Webview's document (e.g. `editor.foreground` → `--vscode-editor-foreground`), readable via `getComputedStyle` inside the webview's own script | Given a **known** Theme Color ID, resolve its current color by running a script inside a webview we control. **This is the only live color-resolution mechanism that actually exists.** Confirmed directly against the primary source ([`api/extension-guides/webview.md`](https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/extension-guides/webview.md), "Theming webview content" section), not a search summary.           | **Official, documented, stable.**                                                                                                                                                                                                                                                                         |
| 2   | `vscode.window.activeColorTheme: ColorTheme` (`{ kind: ColorThemeKind }` only), `vscode.window.onDidChangeActiveColorTheme: Event<ColorTheme>`                                                                                                                   | Tells us the theme _kind_ (light/dark/high-contrast) and fires when the user switches themes — useful to know _when_ to re-resolve, and whether to expect `vscode-light`/`vscode-dark`/`vscode-high-contrast` on the webview body — but resolves **no actual color values**. Verified directly against `vscode.d.ts` (line 8678 `ColorThemeKind`, line 8700 `ColorTheme`, line 11843/11848 `activeColorTheme`/`onDidChangeActiveColorTheme`). | **Official, stable — but not a color resolver.**                                                                                                                                                                                                                                                          |
| 3   | `body` element attributes on a webview: `vscode-light`/`vscode-dark`/`vscode-high-contrast` classes, `data-vscode-theme-id` attribute (active theme's id)                                                                                                        | Theme-kind-aware styling and theme identification inside a webview, without a resolve round trip.                                                                                                                                                                                                                                                                                                                                             | **Official, documented, stable.**                                                                                                                                                                                                                                                                         |
| 4   | `workbench.action.toggleDevTools` (opens Chromium DevTools on the main window)                                                                                                                                                                                   | Lets a **human** manually inspect the real Workbench DOM and read live computed `--vscode-*` values themselves.                                                                                                                                                                                                                                                                                                                               | **Official command, but Desktop-only** — confirmed unavailable on vscode.dev/web ([microsoft/vscode#148660](https://github.com/microsoft/vscode/issues/148660), closed as-designed for web). Not something the extension can drive programmatically; it only opens a UI the user then manually navigates. |
| 5   | Theme Color Reference page (`code.visualstudio.com/api/references/theme-color`)                                                                                                                                                                                  | The canonical list of Theme Color IDs. Its Markdown source (`vscode-docs` repo) is structured enough (`## Category` headings, `- \`id\`: description`bullets) to parse programmatically — see`scripts/generate-theme-colors.mjs`and`packages/theme-colors`. There is **no stable/proposed API to enumerate all IDs at runtime.**                                                                                                              | Documentation only, but machine-parseable; no runtime API.                                                                                                                                                                                                                                                |
| 6   | `@vscode/theme-color-consumer` (Microsoft, **archived Dec 2022**) — the package the original (wrong) version of this ADR confused with the built-in API                                                                                                          | Prior art: statically extracts default color values by cloning VS Code source and parsing its color registry + theme JSON — an offline/static resolution strategy, not a live one. Its own `ColorTheme` class (with `.getColor()`) is that package's own type, unrelated to `vscode.ColorTheme`.                                                                                                                                              | Reference only — not a dependency (unmaintained, and easy to confuse with the real API, as this ADR's first draft demonstrates).                                                                                                                                                                          |
| 7   | Chrome DevTools Protocol attach (e.g. `--remote-debugging-port` on the Electron process)                                                                                                                                                                         | Would in principle allow reading the _real_ Workbench DOM/computed styles programmatically.                                                                                                                                                                                                                                                                                                                                                   | **Unsupported/internal** — not exposed to installed extensions through any documented mechanism; requires a launch flag the extension cannot set on an already-running instance. Rejected.                                                                                                                |

## Strategies compared (implementation-plan §14)

| Strategy                                        | Viability                                                                                           | Complexity                                                                    | Stability                                                                                        | Notes                                                                                                                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Public API**                               | **Not viable** — no such API exists for resolving colors. Rejected (this was the original mistake). | —                                                                             | —                                                                                                | Corrected above.                                                                                                                                                                          |
| **B. Webview + communication**                  | High — the only viable live resolution mechanism                                                    | Medium (needs a request/response protocol between extension host and webview) | Stable                                                                                           | Selected as the resolution mechanism. Cannot discover _which_ ID governs a given visual element; the user (or our registry) must supply the ID.                                           |
| **C. DevTools**                                 | Only as a manual, user-driven aid                                                                   | Low (just opens a command)                                                    | Desktop-only, officially supported as a command                                                  | Cannot be automated; the extension cannot read what the user sees in DevTools.                                                                                                            |
| **D. Electron/CDP integration**                 | Low                                                                                                 | High                                                                          | Unsupported                                                                                      | Rejected — no supported attach path from an installed extension.                                                                                                                          |
| **E. Extension + external auxiliary mechanism** | Not evaluated further                                                                               | —                                                                             | —                                                                                                | Would mean shipping/spawning an out-of-band process to attach to the renderer; same unsupported-attach problem as D, plus packaging/security concerns. Rejected for the same reason as D. |
| **F. Hybrid**                                   | **Selected**                                                                                        | Medium                                                                        | Built from stable pieces (B), with an explicitly optional, manual DevTools-assisted workflow (C) | See Decision.                                                                                                                                                                             |

## Decision

The MVP Inspector is **not** a live element picker over the real Workbench.
It is:

1. **Search/browse by Theme Color ID or category** (implementation-plan
   §26–§27 already describe exactly this UX: search, categories like
   "Side Bar", "Editor", "Terminal"). This sidesteps the unsolvable
   "element → ID" direction entirely and only needs the solved "ID → color"
   direction.
2. **Resolve via Strategy B** — a small, extension-owned webview that, on
   request, reads `getComputedStyle(document.body).getPropertyValue('--vscode-' + id.replace(/\./g, '-'))`
   for a given id and posts the raw CSS value back to the extension host.
   The extension host owns the request/response protocol; the webview
   itself contains no domain logic. Confidence `"exact"` when the variable
   resolves to a non-empty value, otherwise the id is treated as
   unresolved (not guessed at).
3. An **explicitly optional, clearly-labeled "Advanced: inspect with
   DevTools"** action that runs `workbench.action.toggleDevTools` (Desktop
   only, feature-detected — never assumed available) and documents, in the
   UI, how the user can manually find a `--vscode-*` variable on a real
   element and paste the derived ID back into the Inspector. This is
   presented as a manual, human-in-the-loop workaround for the
   element→ID direction — never as something the extension itself performs
   — matching the honesty rule in implementation-plan §61.

`vscode.window.onDidChangeActiveColorTheme` is used to know when to
re-resolve/refresh already-shown colors after a theme switch, satisfying
`docs/implementation-plan.md` §56 (event-driven, not polling) — even though
it carries no color data itself.

## Consequences

- Every single color resolution requires a live webview round trip
  (request → `postMessage` → webview script → `postMessage` back). This is
  more moving parts than a hypothetical direct API call would have been —
  there is no way around it given finding #1 above (no such API exists).
  The adapter should keep exactly one long-lived webview for this purpose
  rather than creating one per lookup.
- The raw value returned by `getComputedStyle` for a `--vscode-*` variable
  was confirmed empirically, not assumed: the FASE 7 POC
  (`apps/vscode-extension/src/test/extension.test.ts`) opens a real webview
  in the Extension Development Host and reads `editor.background` back
  through the actual message round trip. Observed value: `"#121314"` — a
  plain 6-digit hex string, not `rgb()`/`rgba()`. `parseCssColor` in
  `packages/core` still tries `rgb()`/`rgba()` as a fallback (some
  translucent overlay colors may resolve that way), but hex is the
  confirmed common case.
- `Confidence` (implementation-plan §11) for MVP results is effectively
  always `"exact"` (resolved via the webview) or the candidate is simply
  not offered. `"likely"`/`"possible"` become meaningful once a DOM-adjacent
  evidence source (e.g. the manual DevTools workflow's user-supplied
  evidence) is wired into the model.
- The Theme Color **registry** (FASE 4) must be sourced from static data
  (parsing the reference doc), not from a runtime enumeration API, since
  none exists.
- "Selecionar elemento" in the visual sense described in
  implementation-plan §15/§60 is deferred: it cannot be built as a
  supported feature today. If Microsoft ships a proposed API for this in
  the future, this ADR should be revisited.
