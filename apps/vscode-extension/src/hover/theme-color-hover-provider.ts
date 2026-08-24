import * as vscode from 'vscode';

import type { ThemeColorDefinition } from '@vscode-theme-inspector/theme-colors';
import { ThemeColorRegistry } from '@vscode-theme-inspector/theme-colors';

import type { HighlightDecorationController } from './highlight-decoration-controller';
import type { InspectorState } from '../state/inspector-state';

/** Matches a `--vscode-*` CSS custom property reference, e.g. in a stylesheet. */
const CSS_VARIABLE_PATTERN = /--vscode-[A-Za-z0-9-]+/;

/** Matches a dotted Theme Color ID, e.g. `sideBar.background` in JSON. */
const THEME_COLOR_ID_PATTERN = /[A-Za-z][\w]*(\.[A-Za-z][\w]*)+/;

/** Selector for documents where Theme Color IDs / CSS variables realistically appear. */
export const THEME_COLOR_HOVER_SELECTOR: vscode.DocumentSelector = [
  { language: 'json' },
  { language: 'jsonc' },
  { language: 'css' },
  { language: 'scss' },
  { language: 'less' },
];

/**
 * Shows Theme Color ID info (id, category, description) on hover, for
 * `sideBar.background`-style ids and `--vscode-*` CSS variable references
 * in text. Does not resolve a live color — see
 * docs/adr/0005-hover-inspector-strategy.md for why — instead links to the
 * Theme Color Explorer, which already resolves and copies colors.
 *
 * Gated by `InspectorState`: returns no hover at all while the Hover
 * Inspector is off (`Theme Inspector: Turn Off`).
 */
export class ThemeColorHoverProvider implements vscode.HoverProvider {
  constructor(
    private readonly state: InspectorState,
    private readonly highlight: HighlightDecorationController,
  ) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Hover> {
    if (!this.state.isEnabled()) return undefined;

    const match = this.matchThemeColor(document, position);
    if (!match) return undefined;

    const editor = vscode.window.visibleTextEditors.find((e) => e.document === document);
    if (editor) this.highlight.highlight(editor, match.range);

    return new vscode.Hover(this.buildContent(match.color), match.range);
  }

  private matchThemeColor(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): { range: vscode.Range; color: ThemeColorDefinition } | undefined {
    const cssVarRange = document.getWordRangeAtPosition(position, CSS_VARIABLE_PATTERN);
    if (cssVarRange) {
      const color = ThemeColorRegistry.getByCssVariable(document.getText(cssVarRange));
      if (color) return { range: cssVarRange, color };
    }

    const idRange = document.getWordRangeAtPosition(position, THEME_COLOR_ID_PATTERN);
    if (idRange) {
      const color = ThemeColorRegistry.get(document.getText(idRange));
      if (color) return { range: idRange, color };
    }

    return undefined;
  }

  private buildContent(color: ThemeColorDefinition): vscode.MarkdownString {
    const content = new vscode.MarkdownString(undefined, true);
    content.isTrusted = true;

    content.appendMarkdown(`**Theme Color:** \`${color.id}\`\n\n`);
    content.appendMarkdown(`**Category:** ${color.category}\n\n`);
    content.appendMarkdown(`${color.description}\n\n`);
    content.appendMarkdown('---\n\n');

    const args = encodeURIComponent(JSON.stringify([color.id]));
    content.appendMarkdown(
      `[Resolve live color & copy JSON →](command:themeInspector.searchInExplorer?${args})`,
    );

    return content;
  }
}
