import * as vscode from 'vscode';

import { INSPECTOR_VIEW_ID, InspectorViewProvider } from './adapter/inspector-view-provider';

/**
 * Extension entry point.
 *
 * Registers the Theme Inspector webview view (docked in its own Activity
 * Bar container) that lets the user search Theme Color IDs and see their
 * currently resolved colors (docs/adr/0004-inspector-strategy.md). All
 * domain logic (registry lookup, color parsing, JSON generation) lives in
 * `@vscode-theme-inspector/theme-colors` and `@vscode-theme-inspector/core`
 * — this file only wires VS Code's API to them.
 *
 * Returns the `InspectorViewProvider` instance as this extension's API
 * (`vscode.Extension.exports`) so integration tests can drive search /
 * category browsing directly against the one real, registered view,
 * instead of needing their own throwaway view registration (VS Code only
 * allows one provider per view id).
 */
export function activate(context: vscode.ExtensionContext): InspectorViewProvider {
  const inspector = new InspectorViewProvider();

  const viewRegistration = vscode.window.registerWebviewViewProvider(INSPECTOR_VIEW_ID, inspector);

  // For Command Palette users: reveals/focuses the same view the Activity
  // Bar icon opens. VS Code auto-generates a `<viewId>.focus` command for
  // every registered view.
  const commandRegistration = vscode.commands.registerCommand(
    'themeInspector.openInspector',
    () => {
      void vscode.commands.executeCommand(`${INSPECTOR_VIEW_ID}.focus`);
    },
  );

  context.subscriptions.push(viewRegistration, commandRegistration, inspector);

  return inspector;
}

export function deactivate(): void {
  // Disposables are released via context.subscriptions; nothing else to do.
}
