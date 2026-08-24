import * as vscode from 'vscode';

import type { InspectorState } from '../state/inspector-state';

/**
 * Makes the Hover Inspector's ON/OFF state explicit and visible at all
 * times (docs/implementation-plan.md §0: "O estado de ativação deve ser
 * explícito"), and doubles as a click-to-toggle affordance.
 */
export class InspectorStatusBarItem implements vscode.Disposable {
  private readonly item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  private readonly subscription: vscode.Disposable;

  constructor(private readonly state: InspectorState) {
    this.item.command = 'themeInspector.toggleInspector';
    this.subscription = state.onDidChangeEnabled(() => this.render());
    this.render();
    this.item.show();
  }

  private render(): void {
    const enabled = this.state.isEnabled();
    this.item.text = `$(eye) Theme Inspector: ${enabled ? 'On' : 'Off'}`;
    this.item.tooltip = enabled
      ? 'Hover Inspector is on — hover a Theme Color ID or --vscode-* variable. Click to turn off.'
      : 'Hover Inspector is off. Click to turn on.';
  }

  dispose(): void {
    this.subscription.dispose();
    this.item.dispose();
  }
}
