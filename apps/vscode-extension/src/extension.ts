import * as vscode from 'vscode';

import { INSPECTOR_VIEW_ID, InspectorViewProvider } from './adapter/inspector-view-provider';
import { HighlightDecorationController } from './hover/highlight-decoration-controller';
import {
  THEME_COLOR_HOVER_SELECTOR,
  ThemeColorHoverProvider,
} from './hover/theme-color-hover-provider';
import { InspectorState } from './state/inspector-state';
import { InspectorStatusBarItem } from './status-bar/inspector-status-bar-item';

/** This extension's API, returned by `activate()` — see integration tests. */
export interface ThemeInspectorApi {
  readonly state: InspectorState;
  readonly explorer: InspectorViewProvider;
}

/**
 * Extension entry point. Wires two independent, coexisting features
 * (docs/implementation-plan.md §0):
 *
 * - **Hover Inspector** (`Theme Inspector: Turn On` / `Turn Off`): a
 *   `vscode.languages.registerHoverProvider`-based hover over Theme Color
 *   ID / `--vscode-*` references in text documents. Scoped to editor text
 *   because that is what a fully supported API can reach — see
 *   docs/adr/0005-hover-inspector-strategy.md for why a live picker over
 *   the Workbench UI itself was investigated and rejected.
 * - **Theme Color Explorer** (`Theme Inspector: Open Theme Color
 *   Explorer`): the pre-existing search/category webview view, unaffected
 *   by the above and reused (not duplicated) by the hover's "resolve live
 *   color" link.
 *
 * All domain logic lives in `@vscode-theme-inspector/theme-colors` and
 * `@vscode-theme-inspector/core` — this file only wires VS Code's API to
 * them.
 */
export function activate(context: vscode.ExtensionContext): ThemeInspectorApi {
  const state = new InspectorState();
  const highlight = new HighlightDecorationController();
  const explorer = new InspectorViewProvider();

  const viewRegistration = vscode.window.registerWebviewViewProvider(INSPECTOR_VIEW_ID, explorer);

  const hoverRegistration = vscode.languages.registerHoverProvider(
    THEME_COLOR_HOVER_SELECTOR,
    new ThemeColorHoverProvider(state, highlight),
  );

  const statusBarItem = new InspectorStatusBarItem(state);

  // Clear any lingering highlight the instant the Hover Inspector turns
  // off, rather than waiting for its auto-clear timer.
  const stateSubscription = state.onDidChangeEnabled((enabled) => {
    if (!enabled) highlight.clear();
  });

  const turnOnRegistration = vscode.commands.registerCommand('themeInspector.turnOn', () => {
    state.turnOn();
  });
  const turnOffRegistration = vscode.commands.registerCommand('themeInspector.turnOff', () => {
    state.turnOff();
  });
  const toggleRegistration = vscode.commands.registerCommand(
    'themeInspector.toggleInspector',
    () => {
      state.toggle();
    },
  );

  // For Command Palette users: reveals/focuses the Explorer view. VS Code
  // auto-generates a `<viewId>.focus` command for every registered view.
  const openExplorerRegistration = vscode.commands.registerCommand(
    'themeInspector.openThemeColorExplorer',
    () => {
      void vscode.commands.executeCommand(`${INSPECTOR_VIEW_ID}.focus`);
    },
  );

  // Bridges the hover's "resolve live color" link into the Explorer,
  // reusing its search rather than duplicating resolution logic.
  const searchInExplorerRegistration = vscode.commands.registerCommand(
    'themeInspector.searchInExplorer',
    async (id: string) => {
      await vscode.commands.executeCommand(`${INSPECTOR_VIEW_ID}.focus`);
      await explorer.whenReady();
      explorer.search(id);
    },
  );

  context.subscriptions.push(
    state,
    highlight,
    explorer,
    viewRegistration,
    hoverRegistration,
    statusBarItem,
    stateSubscription,
    turnOnRegistration,
    turnOffRegistration,
    toggleRegistration,
    openExplorerRegistration,
    searchInExplorerRegistration,
  );

  return { state, explorer };
}

export function deactivate(): void {
  // Disposables are released via context.subscriptions; nothing else to do.
}
