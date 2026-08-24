# 0005 — Hover Inspector strategy

## Status

**Decided.** The CDP-based approach (Strategy F) was validated technically
and presented to the user with its security trade-off made explicit; the
user **declined it**, choosing to keep the extension on fully supported
APIs only, even though that means no hover coverage outside the text
editor. See "Decision" at the end of this document for what was actually
chosen and why the CDP investigation is kept here rather than deleted.

## Context

The product's primary requirement, corrected from the original
interpretation, is a **hover-driven visual inspector**: move the mouse over
any region of the real VS Code Workbench, see it highlighted, and see its
Theme Color ID / computed style / resolved color live, updating as the
mouse moves, with click-to-freeze. See the top-level request for the full
flow.

ADR 0004 already established that:

- Extensions run in a separate Extension Host process with no DOM access to
  the Workbench.
- Webviews are isolated pages and cannot see the Workbench DOM either.
- There is no public Extension API to resolve a Theme Color ID to a color,
  let alone to identify which element is under an arbitrary screen point.

None of that is wrong, and it still means: **a hover inspector over the
real Workbench cannot be built on the public, documented Extension API
alone.** This ADR investigates what else is technically possible, per this
request's explicit instruction not to assume the answer is "impossible"
without researching alternatives — including internal/unsupported ones,
with the requirement that any such dependency be explicitly documented as
a major architectural decision.

## What was investigated

| #   | Mechanism                                                                                        | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Public Extension API (`vscode.*`)                                                                | No DOM access exists (ADR 0004). Rejected for this purpose.                                                                                                                                                                                                                                                                                                                                                                                                                |
| B   | Webview only                                                                                     | Isolated page, can't see the real Workbench. Still useful for rendering the inspector's _own_ panel UI (info readout), just not for hover detection over the real UI.                                                                                                                                                                                                                                                                                                      |
| C   | `vscode.languages.registerHoverProvider`                                                         | **Real, stable, supported API** — but only fires for hovers over text inside a text editor's content, using markdown-rendered tooltips VS Code positions itself. It cannot report raw mouse coordinates, cannot be used over the Activity Bar/Side Bar/Status Bar/Panel, and cannot draw a custom highlight overlay. Too narrow to be the primary mechanism, but worth reusing later as a supported, zero-risk fallback for the editor-text case specifically.             |
| D   | OS-level accessibility APIs (UI Automation / AX API / AT-SPI) via a native Node addon            | Would need heavy, per-platform native modules; accessibility trees expose role/bounds, not CSS/computed style, so it cannot answer "which Theme Color ID" at all. Rejected — wrong data, not just risky.                                                                                                                                                                                                                                                                   |
| E   | `EyeDropper` Web API (in a webview)                                                              | **Real, standard, fully supported** web platform API — lets a webview open an OS-wide pixel color picker. Verified via the spec/WICG discussion: it is deliberately **click-only, single-shot** — no continuous hover callback exists or is planned, specifically to prevent screen-scraping via mouse movement. Cannot satisfy "move the mouse → live update." Kept as a candidate for a _secondary_, fully-safe "pick a pixel color" action, not the primary hover flow. |
| F   | Chrome DevTools Protocol (CDP), attached to the Workbench renderer via `--remote-debugging-port` | **Empirically verified working**, this session, against a real, isolated VS Code 1.134.0 Desktop instance (not simulated) — see Empirical validation below.                                                                                                                                                                                                                                                                                                                |

## Empirical validation (this session)

Rather than take CDP feasibility on faith, it was tested end-to-end against
a real, throwaway, fully isolated VS Code instance (own `--user-data-dir`
and `--extensions-dir`, so nothing about this touched the developer's real
VS Code session), then torn down and the port confirmed closed afterward.

1. **Launch with a debug port**:
   `code --remote-debugging-port=9333 --user-data-dir=<tmp> --extensions-dir=<tmp> --new-window <tmp>`
   → `http://localhost:9333/json` returned a real target for
   `.../workbench/workbench.html`, with a `webSocketDebuggerUrl`.
2. **Real DOM access confirmed**: connecting to that WebSocket and calling
   `Runtime.evaluate` with `document.elementFromPoint(200, 200)` returned
   the actual hovered-region element (`<div class="monaco-list-rows">` on
   the Welcome page) and its real `getComputedStyle()` (e.g.
   `backgroundColor: "rgb(25, 26, 27)"`) — genuine Workbench DOM, not a
   webview.
3. **Real-time streaming confirmed**: `Runtime.addBinding('themeInspectorReport')`,
   injecting a `window.addEventListener('mousemove', ...)` in the real
   page, calling that binding on every move, correctly streamed live
   `{x, y, tag, class}` payloads back over the CDP connection as
   `Runtime.bindingCalled` events — including correctly identifying a
   different element (`<button class="button-link">`) at a different
   point. This is the exact mechanism (`Runtime.addBinding`, the same one
   Puppeteer's `page.exposeFunction` uses) a live hover inspector needs.
4. **Cleanup verified**: the isolated instance's processes were terminated
   and `http://localhost:9333/json` confirmed unreachable afterward.

## `--remote-debugging-port` is a VS Code-sanctioned switch, not a raw Electron hack

Checked directly against `microsoft/vscode`'s `src/main.ts`
(`SUPPORTED_ELECTRON_SWITCHES`): `'remote-debugging-port'` is explicitly
listed there, alongside a handful of other switches VS Code deliberately
allows to be set persistently via the user's `argv.json` (opened via the
**Preferences: Configure Runtime Arguments** command). This is not an
undocumented Electron flag being smuggled through — VS Code's own source
allowlists it for exactly this kind of use. It is still **not part of the
Extension API**, has no compatibility guarantee, and is not intended for
production automation — so it remains "internal/unsupported" for our
purposes, just with better provenance than a random Electron switch would
have.

## Reverse-mapping a color to a Theme Color ID

CDP gives a resolved `getComputedStyle()` value (e.g. an RGB string), not
"which Theme Color ID was used." The plan: enumerate all 910 known ids from
`@vscode-theme-inspector/theme-colors`, read each one's current
`--vscode-<id>` custom property value from the real page (same JS
evaluated once per hover, cached and only invalidated on theme change), and
compare against the hovered element's actual computed
background/foreground/border color. An exact string match is `"exact"`
confidence; if multiple ids resolve to the identical color (common — many
tokens intentionally share a value), all of them are reported as `"likely"`
candidates rather than arbitrarily picking one. This reuses
`ThemeColorCandidate`/`Confidence`/`ResolvedColor` from `packages/core`
as-is — no new domain model needed.

## Decision

The CDP approach (Strategy F) was presented to the user with all four
consequences below made explicit, and **rejected**:

1. **Requires a full VS Code restart** (not just "Reload Window") the first
   time it's enabled, because Electron command-line switches are read once
   at process start (`main.ts`), before any window exists.
2. **Security**: an open `--remote-debugging-port` accepts `Runtime.evaluate`
   — arbitrary JavaScript execution in the Workbench's renderer — from
   anything that can reach that local port. Binding to `127.0.0.1` and
   using a high, extension-chosen port mitigates but does not eliminate
   this; browser-based DNS-rebinding attacks against local CDP ports are a
   documented real-world attack class, which is exactly why Chrome/Electron
   don't enable this by default. **This was the deciding factor** — the
   user chose not to accept this trade-off, even in exchange for full
   Workbench-wide hover coverage.
3. **Desktop-only**: no such switch/process model exists on vscode.dev,
   Codespaces, or other web hosts.
4. **No compatibility guarantee**: `SUPPORTED_ELECTRON_SWITCHES` could be
   changed or removed by Microsoft at any time without notice, since it
   isn't part of the Extension API contract.

**Chosen instead: `vscode.languages.registerHoverProvider` (Strategy C),
scoped to Theme Color ID references in text.** This is fully supported, has
none of the above risks, and needs no restart or opt-in flow — at the
explicit cost of not covering the Activity Bar, Side Bar chrome, Status
Bar, or Panel (only text _content_ inside editors). Concretely:

- Registered for JSON/JSONC/CSS/SCSS/LESS documents (where Theme Color IDs
  and `--vscode-*` variables actually appear in real files: `settings.json`
  `workbench.colorCustomizations`, theme definition JSON, stylesheets).
- On hover, the word/range under the cursor is matched against two
  patterns: a dotted Theme Color ID (`sideBar.background`) or a
  `--vscode-*` CSS custom property, reverse-mapped back to its id. Either
  way the id is looked up in `@vscode-theme-inspector/theme-colors`'
  `ThemeColorRegistry` — reusing it exactly as-is.
- The hover shows the id, category, and description unconditionally (all
  static registry data, no resolution needed). It does **not** show a live
  resolved color inline — resolving requires the webview mechanism from
  ADR 0004, which needs a webview to already be alive; forcing one open
  just to answer a hover would be a surprising side effect (an editor tab
  or sidebar panel appearing uninvited). Instead the hover includes a
  trusted command link that opens/reveals the Theme Color Explorer
  pre-searched on that exact id, where live resolution, the color swatch,
  and Copy ID/JSON already work and are already tested.
- `Theme Inspector: Turn On` / `Turn Off` gate a simple boolean the
  provider checks (`provideHover` returns `undefined` when off) — trivial
  to reason about, and "no highlight remains" is automatically true since
  there's no custom highlight without an active hover response, beyond an
  editor decoration that is explicitly cleared on Turn Off.
- A small `TextEditorDecorationType` highlights the exact matched range
  while its hover is showing (auto-cleared after a short delay, and
  explicitly cleared on Turn Off), giving real, if editor-scoped, visual
  highlight feedback — satisfying that part of the original request within
  the supported surface.

## Consequences

- `apps/vscode-extension` gains a hover provider, a small highlight
  decoration controller, an explicit on/off state, and a status bar item
  reflecting it — no new runtime dependencies, no CDP client.
- The existing Theme Color Explorer (`InspectorViewProvider`,
  `packages/theme-colors`, `packages/core`'s color engine and JSON
  generator) is **unaffected and fully reused** by the hover feature (same
  registry, same resolution/JSON-generation code, reached via a command
  link instead of duplicated).
- Coverage gap, accepted knowingly: hovering over the Activity Bar, Side
  Bar chrome (not its content), Status Bar, or Panel UI itself shows
  nothing, because none of that is text in an editor. If a future,
  supported VS Code API closes this gap, this ADR should be revisited —
  the CDP investigation above stays in this document as prior art, not
  deleted, precisely so that work isn't repeated from scratch.
