import * as vscode from 'vscode';

import { CORE_VERSION } from '@vscode-theme-inspector/core';

/**
 * Extension entry point.
 *
 * This is intentionally minimal during the bootstrap phase: it registers a
 * single command that confirms the extension activated and that it can
 * successfully import from `@vscode-theme-inspector/core`, validating the
 * `apps/vscode-extension` → `packages/core` dependency direction end to end.
 */
export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('themeInspector.showStatus', () => {
    void vscode.window.showInformationMessage(`Theme Inspector is active (core v${CORE_VERSION}).`);
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  // No resources to clean up yet.
}
