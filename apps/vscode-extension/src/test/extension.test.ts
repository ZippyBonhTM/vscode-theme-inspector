import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Theme Inspector extension', () => {
  test('activates without throwing', async () => {
    const extension = vscode.extensions.getExtension(
      'vscode-theme-inspector.vscode-theme-inspector',
    );
    assert.ok(extension, 'expected the extension to be discoverable by id');
    await extension?.activate();
    assert.strictEqual(extension?.isActive, true);
  });

  test('registers the themeInspector.showStatus command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('themeInspector.showStatus'),
      'expected themeInspector.showStatus to be registered',
    );
  });
});
