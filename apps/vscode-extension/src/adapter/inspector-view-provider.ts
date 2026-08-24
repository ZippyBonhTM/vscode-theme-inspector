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

/** The view id declared under `contributes.views.themeInspector` in package.json. */
export const INSPECTOR_VIEW_ID = 'themeInspector.view';

/** Caps how many results are sent to the webview per search, for render performance. */
const MAX_RESULTS = 200;

/**
 * Provides the "Theme Inspector" webview view, docked in its own Activity
 * Bar container: runs search/category browsing against the Theme Color
 * registry on the host side, and handles the "copy id" / "copy JSON"
 * actions reported back by the webview.
 *
 * Color *resolution* itself does not happen here — it happens inside the
 * webview's own script, which is the only place `--vscode-*` CSS variables
 * are readable (docs/adr/0004-inspector-strategy.md). This provider only
 * relays search results in and resolved values out.
 */
export class InspectorViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view: vscode.WebviewView | undefined;

  /**
   * Whether the webview's own script has finished loading and told us it's
   * ready (`{ type: 'ready' }`). Posting a message before that point is
   * unreliable — `Webview.postMessage` can resolve `false` (silently
   * dropped) if the page hasn't attached its message listener yet.
   */
  private ready = false;
  private readonly readyEmitter = new vscode.EventEmitter<void>();

  /** Fires whenever the webview reports a resolved (or unresolved) color for an id. */
  readonly onDidResolve: vscode.Event<{ id: string; cssValue: string | null }>;
  private readonly resolveEmitter = new vscode.EventEmitter<{
    id: string;
    cssValue: string | null;
  }>();

  constructor() {
    this.onDidResolve = this.resolveEmitter.event;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getInspectorHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message: WebviewToHostMessage) => {
      this.handleMessage(message);
    });
    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.view = undefined;
        this.ready = false;
      }
    });

    this.view = webviewView;
  }

  /**
   * Resolves once the webview has signaled it's ready to receive messages
   * (immediately, if it already has). `search`/`browseCategory` calls made
   * before this resolves are not guaranteed to reach the webview.
   */
  whenReady(): Promise<void> {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve) => {
      const subscription = this.readyEmitter.event(() => {
        subscription.dispose();
        resolve();
      });
    });
  }

  /** Sends a search query to the (already resolved) view, as if the user had typed it. */
  search(query: string): void {
    this.postResults(ThemeColorRegistry.search(query));
  }

  /** Selects a category in the (already resolved) view, as if the user had clicked it. */
  browseCategory(category: string): void {
    this.postResults(ThemeColorRegistry.byCategory(category));
  }

  dispose(): void {
    this.resolveEmitter.dispose();
    this.readyEmitter.dispose();
  }

  private handleMessage(message: WebviewToHostMessage): void {
    switch (message.type) {
      case 'ready':
        this.ready = true;
        this.readyEmitter.fire();
        this.postMessage({ type: 'categories', categories: ThemeColorRegistry.categories() });
        this.postResults([]);
        return;
      case 'search':
        // An empty query intentionally shows nothing rather than dumping
        // all 900+ colors — the user searches or picks a category.
        this.postResults(
          message.query.trim().length === 0 ? [] : ThemeColorRegistry.search(message.query),
        );
        return;
      case 'browseCategory':
        this.postResults(ThemeColorRegistry.byCategory(message.category));
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

  private postResults(
    results: readonly { id: string; category: string; description: string }[],
  ): void {
    const capped: ThemeColorSearchResult[] = results
      .slice(0, MAX_RESULTS)
      .map(({ id, category, description }) => ({ id, category, description }));
    this.postMessage({ type: 'searchResults', results: capped });
  }

  private postMessage(message: HostToWebviewMessage): void {
    void this.view?.webview.postMessage(message);
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
