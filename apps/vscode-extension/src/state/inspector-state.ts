import * as vscode from 'vscode';

/**
 * Explicit ON/OFF state for the Hover Inspector
 * (`OFF -> Turn On -> ON -> Turn Off -> OFF`, docs/implementation-plan.md
 * §0). This is the single source of truth the hover provider, status bar
 * item, and commands all read/drive — nothing infers the state implicitly.
 */
export class InspectorState implements vscode.Disposable {
  private enabled = false;

  readonly onDidChangeEnabled: vscode.Event<boolean>;
  private readonly changeEmitter = new vscode.EventEmitter<boolean>();

  constructor() {
    this.onDidChangeEnabled = this.changeEmitter.event;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  turnOn(): void {
    this.setEnabled(true);
  }

  turnOff(): void {
    this.setEnabled(false);
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  private setEnabled(value: boolean): void {
    if (this.enabled === value) return;
    this.enabled = value;
    this.changeEmitter.fire(value);
  }

  dispose(): void {
    this.changeEmitter.dispose();
  }
}
