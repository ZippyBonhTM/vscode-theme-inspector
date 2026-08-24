import * as assert from 'assert';
import * as vscode from 'vscode';

import type { InspectorViewProvider } from '../adapter/inspector-view-provider';

async function getActivatedInspector(): Promise<InspectorViewProvider> {
  const extension = vscode.extensions.getExtension('vscode-theme-inspector.vscode-theme-inspector');
  assert.ok(extension, 'expected the extension to be discoverable by id');
  const inspector = (await extension.activate()) as InspectorViewProvider;
  assert.ok(inspector, 'expected activate() to return the InspectorViewProvider instance');
  return inspector;
}

function waitForResolution(
  inspector: InspectorViewProvider,
  id: string,
): Promise<{ id: string; cssValue: string | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting to resolve ${id}`)), 15_000);
    const subscription = inspector.onDidResolve((event) => {
      if (event.id !== id) return;
      clearTimeout(timer);
      subscription.dispose();
      resolve(event);
    });
  });
}

suite('Theme Inspector extension', () => {
  test('activates without throwing', async () => {
    const inspector = await getActivatedInspector();
    assert.ok(inspector);
  });

  test('registers the themeInspector.openInspector command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('themeInspector.openInspector'),
      'expected themeInspector.openInspector to be registered',
    );
  });
});

suite('InspectorViewProvider (real webview view, empirical resolution check)', () => {
  test('resolves a well-known Theme Color id to a real CSS color value', async function () {
    // Bringing the view into visibility for the first time in a fresh
    // Extension Development Host can be slow; the default Mocha timeout is
    // too tight.
    this.timeout(20_000);

    const inspector = await getActivatedInspector();
    await vscode.commands.executeCommand('themeInspector.view.focus');
    await inspector.whenReady();

    const resolvedPromise = waitForResolution(inspector, 'editor.background');
    inspector.search('editor.background');
    const resolved = await resolvedPromise;

    assert.strictEqual(resolved.id, 'editor.background');
    assert.ok(
      typeof resolved.cssValue === 'string' && resolved.cssValue.length > 0,
      `expected a non-empty resolved CSS value for editor.background, got ${JSON.stringify(resolved.cssValue)}`,
    );
  });

  test('browsing a category resolves its members too', async function () {
    this.timeout(20_000);

    const inspector = await getActivatedInspector();
    await vscode.commands.executeCommand('themeInspector.view.focus');
    await inspector.whenReady();

    const resolvedPromise = waitForResolution(inspector, 'sideBar.background');
    inspector.browseCategory('Side Bar');
    const resolved = await resolvedPromise;

    assert.ok(
      typeof resolved.cssValue === 'string' && resolved.cssValue.length > 0,
      `expected a non-empty resolved CSS value for sideBar.background, got ${JSON.stringify(resolved.cssValue)}`,
    );
  });
});
