import * as assert from 'assert';
import * as vscode from 'vscode';

import type { ThemeInspectorApi } from '../extension';

async function getActivatedApi(): Promise<ThemeInspectorApi> {
  const extension = vscode.extensions.getExtension('vscode-theme-inspector.vscode-theme-inspector');
  assert.ok(extension, 'expected the extension to be discoverable by id');
  const api = (await extension.activate()) as ThemeInspectorApi;
  assert.ok(api?.state, 'expected activate() to return { state, explorer }');
  return api;
}

function waitForResolution(
  explorer: ThemeInspectorApi['explorer'],
  id: string,
): Promise<{ id: string; cssValue: string | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting to resolve ${id}`)), 15_000);
    const subscription = explorer.onDidResolve((event) => {
      if (event.id !== id) return;
      clearTimeout(timer);
      subscription.dispose();
      resolve(event);
    });
  });
}

suite('Theme Inspector extension', () => {
  test('activates without throwing', async () => {
    const api = await getActivatedApi();
    assert.ok(api);
  });

  test('registers the expected Command Palette commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of [
      'themeInspector.turnOn',
      'themeInspector.turnOff',
      'themeInspector.toggleInspector',
      'themeInspector.openThemeColorExplorer',
    ]) {
      assert.ok(commands.includes(command), `expected ${command} to be registered`);
    }
  });
});

suite('Hover Inspector (registerHoverProvider, real Extension Development Host)', () => {
  test('shows nothing while off, and Theme Color info once turned on', async () => {
    const { state } = await getActivatedApi();
    await vscode.commands.executeCommand('themeInspector.turnOff');
    assert.strictEqual(state.isEnabled(), false);

    const document = await vscode.workspace.openTextDocument({
      language: 'json',
      content: '{ "workbench.colorCustomizations": { "sideBar.background": "#000000" } }',
    });
    const idIndex = document.getText().indexOf('sideBar.background');
    const position = document.positionAt(idIndex + 1);

    const whileOff = await vscode.commands.executeCommand<vscode.Hover[]>(
      'vscode.executeHoverProvider',
      document.uri,
      position,
    );
    assert.strictEqual(whileOff.length, 0, 'expected no hover while the Hover Inspector is off');

    await vscode.commands.executeCommand('themeInspector.turnOn');
    assert.strictEqual(state.isEnabled(), true);

    const whileOn = await vscode.commands.executeCommand<vscode.Hover[]>(
      'vscode.executeHoverProvider',
      document.uri,
      position,
    );
    assert.ok(whileOn.length > 0, 'expected a hover once the Hover Inspector is on');
    const content = whileOn[0]?.contents
      .map((c) => (typeof c === 'string' ? c : c.value))
      .join('\n');
    assert.ok(
      content?.includes('sideBar.background'),
      `expected hover content to mention the id, got: ${content}`,
    );
    assert.ok(
      content?.includes('Side Bar'),
      `expected hover content to mention the category, got: ${content}`,
    );

    await vscode.commands.executeCommand('themeInspector.turnOff');
  });

  test('resolves a --vscode-* CSS variable reference back to its Theme Color id', async () => {
    await vscode.commands.executeCommand('themeInspector.turnOn');

    const document = await vscode.workspace.openTextDocument({
      language: 'css',
      content: 'body { background: var(--vscode-sideBar-background); }',
    });
    const variableIndex = document.getText().indexOf('--vscode-sideBar-background');
    const position = document.positionAt(variableIndex + 1);

    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
      'vscode.executeHoverProvider',
      document.uri,
      position,
    );
    assert.ok(hovers.length > 0, 'expected a hover for the CSS variable reference');
    const content = hovers[0]?.contents
      .map((c) => (typeof c === 'string' ? c : c.value))
      .join('\n');
    assert.ok(
      content?.includes('sideBar.background'),
      `expected the CSS variable to resolve back to the id, got: ${content}`,
    );

    await vscode.commands.executeCommand('themeInspector.turnOff');
  });

  test('toggleInspector flips the state', async () => {
    const { state } = await getActivatedApi();
    await vscode.commands.executeCommand('themeInspector.turnOff');
    assert.strictEqual(state.isEnabled(), false);

    await vscode.commands.executeCommand('themeInspector.toggleInspector');
    assert.strictEqual(state.isEnabled(), true);

    await vscode.commands.executeCommand('themeInspector.toggleInspector');
    assert.strictEqual(state.isEnabled(), false);
  });
});

suite('Hover -> Theme Color Explorer bridge', () => {
  test("the hover's 'resolve live color' command reaches the real Explorer", async function () {
    this.timeout(20_000);

    const { explorer } = await getActivatedApi();
    const resolvedPromise = waitForResolution(explorer, 'editor.background');
    await vscode.commands.executeCommand('themeInspector.searchInExplorer', 'editor.background');
    const resolved = await resolvedPromise;

    assert.ok(
      typeof resolved.cssValue === 'string' && resolved.cssValue.length > 0,
      `expected the bridged search to resolve a real color, got ${JSON.stringify(resolved.cssValue)}`,
    );
  });
});
