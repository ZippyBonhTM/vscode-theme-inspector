import * as vscode from 'vscode';

import { InspectorPanelController } from './adapter/inspector-panel-controller';

/**
 * Extension entry point.
 *
 * Registers the Theme Inspector command, which opens a webview that lets
 * the user search Theme Color IDs and see their currently resolved colors
 * (docs/adr/0004-inspector-strategy.md). All domain logic (registry lookup,
 * color parsing, JSON generation) lives in
 * `@vscode-theme-inspector/theme-colors` and `@vscode-theme-inspector/core`
 * — this file only wires VS Code's API to them.
 */
export function activate(context: vscode.ExtensionContext): void {
  const inspector = new InspectorPanelController();

  const disposable = vscode.commands.registerCommand('themeInspector.openInspector', () => {
    inspector.open();
  });

  context.subscriptions.push(disposable, inspector);
}

export function deactivate(): void {
  // Disposables are released via context.subscriptions; nothing else to do.
}
