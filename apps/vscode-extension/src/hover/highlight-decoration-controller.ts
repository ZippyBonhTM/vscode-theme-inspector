import * as vscode from 'vscode';

/** How long a highlight stays visible after being shown, absent a newer one. */
const HIGHLIGHT_DURATION_MS = 3_000;

/**
 * Visually highlights the range that produced the current hover, and clears
 * it automatically shortly after (or immediately on `clear()` / Turn Off).
 * This is what "destacar a região" means within the Hover Inspector's
 * supported, editor-text-only scope (docs/adr/0005-hover-inspector-strategy.md)
 * — there is no custom overlay over the Workbench chrome itself.
 */
export class HighlightDecorationController implements vscode.Disposable {
  private readonly decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
    border: '1px solid',
    borderColor: new vscode.ThemeColor('editor.findMatchBorder'),
  });

  private timer: ReturnType<typeof setTimeout> | undefined;

  highlight(editor: vscode.TextEditor, range: vscode.Range): void {
    editor.setDecorations(this.decorationType, [range]);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.clear(), HIGHLIGHT_DURATION_MS);
  }

  clear(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    for (const editor of vscode.window.visibleTextEditors) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  dispose(): void {
    clearTimeout(this.timer);
    this.decorationType.dispose();
  }
}
