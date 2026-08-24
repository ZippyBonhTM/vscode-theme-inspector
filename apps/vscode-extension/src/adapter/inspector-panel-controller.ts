import * as vscode from 'vscode';

import {
  formatColorCustomizationsSnippet,
  generateOverride,
  parseCssColor,
} from '@vscode-theme-inspector/core';
import { ThemeColorRegistry } from '@vscode-theme-inspector/theme-colors';

import { getInspectorHtml } from '../webview/get-inspector-html';
import type {
  HostToWebviewMessage,
  ThemeColorSearchResult,
  WebviewToHostMessage,
} from '../webview/protocol';

/** Caps how many results are sent to the webview per search, for render performance. */
const MAX_RESULTS = 200;

/**
 * Owns the singleton "Theme Inspector" webview panel: creates/reveals it,
 * runs search against the Theme Color registry on the host side, and
 * handles the "copy id" / "copy JSON" actions reported back by the webview.
 *
 * Color *resolution* itself does not happen here — it happens inside the
 * webview's own script, which is the only place `--vscode-*` CSS variables
 * are readable (docs/adr/0004-inspector-strategy.md). This controller only
 * relays search results in and resolved values out.
 */
export class InspectorPanelController {
  private panel: vscode.WebviewPanel | undefined;

  /** Fires whenever the webview reports a resolved (or unresolved) color for an id. */
  readonly onDidResolve: vscode.Event<{ id: string; cssValue: string | null }>;
  private readonly resolveEmitter = new vscode.EventEmitter<{
    id: string;
    cssValue: string | null;
  }>();

  constructor() {
    this.onDidResolve = this.resolveEmitter.event;
  }

  /** Creates the panel if it doesn't exist yet, or reveals the existing one. */
  open(): vscode.WebviewPanel {
    if (this.panel) {
      this.panel.reveal();
      return this.panel;
    }

    const panel = vscode.window.createWebviewPanel(
      'themeInspector.inspector',
      'Theme Inspector',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    panel.webview.html = getInspectorHtml(panel.webview);
    panel.webview.onDidReceiveMessage((message: WebviewToHostMessage) => {
      this.handleMessage(message);
    });
    panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel = panel;
    return panel;
  }

  /** Sends a search query to the (already open) webview, as if the user had typed it. */
  search(query: string): void {
    this.postSearchResults(query);
  }

  dispose(): void {
    this.panel?.dispose();
    this.resolveEmitter.dispose();
  }

  private handleMessage(message: WebviewToHostMessage): void {
    switch (message.type) {
      case 'ready':
      case 'search':
        this.postSearchResults(message.type === 'search' ? message.query : '');
        return;
      case 'resolved':
        this.resolveEmitter.fire({ id: message.id, cssValue: message.cssValue });
        return;
      case 'copyId':
        void vscode.env.clipboard.writeText(message.id);
        return;
      case 'copyJson':
        this.copyJson(message.id, message.cssValue);
        return;
    }
  }

  private postSearchResults(query: string): void {
    const results: ThemeColorSearchResult[] = ThemeColorRegistry.search(query)
      .slice(0, MAX_RESULTS)
      .map(({ id, category, description }) => ({ id, category, description }));
    const outgoing: HostToWebviewMessage = { type: 'searchResults', results };
    void this.panel?.webview.postMessage(outgoing);
  }

  private copyJson(id: string, cssValue: string | null): void {
    const color = cssValue ? parseCssColor(cssValue) : undefined;
    if (!color) {
      void vscode.window.showWarningMessage(
        `Theme Inspector: could not resolve a color for "${id}" — nothing to copy.`,
      );
      return;
    }
    const snippet = formatColorCustomizationsSnippet(generateOverride({ id, color }));
    void vscode.env.clipboard.writeText(snippet);
  }
}
