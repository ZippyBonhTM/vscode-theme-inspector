import * as assert from 'assert';
import * as vscode from 'vscode';

import { InspectorPanelController } from '../adapter/inspector-panel-controller';

suite('Theme Inspector extension', () => {
  test('activates without throwing', async () => {
    const extension = vscode.extensions.getExtension(
      'vscode-theme-inspector.vscode-theme-inspector',
    );
    assert.ok(extension, 'expected the extension to be discoverable by id');
    await extension?.activate();
    assert.strictEqual(extension?.isActive, true);
  });

  test('registers the themeInspector.openInspector command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('themeInspector.openInspector'),
      'expected themeInspector.openInspector to be registered',
    );
  });
});

suite('InspectorPanelController (real webview, empirical resolution check)', () => {
  test('resolves a well-known Theme Color id to a real CSS color value', async function () {
    // First resolution in a fresh Extension Development Host can be slow
    // (webview process startup); the default Mocha timeout is too tight.
    this.timeout(20_000);

    const controller = new InspectorPanelController();
    try {
      controller.open();

      const resolved = await new Promise<{ id: string; cssValue: string | null }>(
        (resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('timed out waiting for onDidResolve')),
            15_000,
          );
          const subscription = controller.onDidResolve((event) => {
            if (event.id !== 'editor.background') return;
            clearTimeout(timer);
            subscription.dispose();
            resolve(event);
          });
          controller.search('editor.background');
        },
      );

      assert.strictEqual(resolved.id, 'editor.background');
      assert.ok(
        typeof resolved.cssValue === 'string' && resolved.cssValue.length > 0,
        `expected a non-empty resolved CSS value for editor.background, got ${JSON.stringify(resolved.cssValue)}`,
      );
    } finally {
      controller.dispose();
    }
  });
});
