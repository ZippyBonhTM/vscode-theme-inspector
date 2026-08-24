/**
 * Message protocol between the extension host and the Inspector webview.
 *
 * Color resolution itself only happens inside the webview: it is the only
 * context with access to the `--vscode-*` CSS custom properties VS Code
 * injects (see docs/adr/0004-inspector-strategy.md). The host owns the
 * Theme Color registry and drives search; the webview owns rendering and
 * resolution, and reports resolved values back so the host can build
 * `workbench.colorCustomizations` JSON or copy an id to the clipboard.
 */

export interface ThemeColorSearchResult {
  readonly id: string;
  readonly category: string;
  readonly description: string;
}

export type HostToWebviewMessage = {
  readonly type: 'searchResults';
  readonly results: readonly ThemeColorSearchResult[];
};

export type WebviewToHostMessage =
  | { readonly type: 'ready' }
  | { readonly type: 'search'; readonly query: string }
  | { readonly type: 'resolved'; readonly id: string; readonly cssValue: string | null }
  | { readonly type: 'copyId'; readonly id: string }
  | { readonly type: 'copyJson'; readonly id: string; readonly cssValue: string | null };
