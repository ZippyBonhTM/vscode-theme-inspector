import * as vscode from 'vscode';

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Builds the HTML for the Inspector webview.
 *
 * The page renders a search box and a result list. Search itself is driven
 * by the extension host (see `InspectorPanelController`), but resolving a
 * Theme Color ID to an actual color happens right here, in the webview's
 * own script, by reading the `--vscode-<id-with-dashes>` CSS custom
 * property VS Code injects — the only place that value is available (see
 * docs/adr/0004-inspector-strategy.md).
 */
export function getInspectorHtml(webview: vscode.Webview): string {
  const nonce = getNonce();
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>Theme Inspector</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 0.5rem 1rem;
    }
    #search {
      width: 100%;
      box-sizing: border-box;
      padding: 0.4rem;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
    }
    .result {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--vscode-widget-border, transparent);
    }
    .swatch {
      width: 1rem;
      height: 1rem;
      flex: none;
      border: 1px solid var(--vscode-widget-border, #8888);
    }
    .meta {
      flex: 1;
      min-width: 0;
    }
    .id {
      font-family: var(--vscode-editor-font-family, monospace);
    }
    .description {
      color: var(--vscode-descriptionForeground);
      font-size: 0.9em;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 0.2rem 0.5rem;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <input id="search" type="text" placeholder="Search Theme Color IDs (e.g. sideBar, editor.background)…" />
  <div id="results"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const searchInput = document.getElementById('search');
    const resultsEl = document.getElementById('results');

    function resolveCssValue(id) {
      const variable = '--vscode-' + id.replace(/\\./g, '-');
      const value = getComputedStyle(document.body).getPropertyValue(variable).trim();
      return value.length > 0 ? value : null;
    }

    function render(results) {
      resultsEl.textContent = '';
      for (const result of results) {
        const cssValue = resolveCssValue(result.id);
        vscode.postMessage({ type: 'resolved', id: result.id, cssValue });

        const row = document.createElement('div');
        row.className = 'result';

        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.background = cssValue ?? 'transparent';

        const meta = document.createElement('div');
        meta.className = 'meta';
        const idEl = document.createElement('div');
        idEl.className = 'id';
        idEl.textContent = result.id + (cssValue ? ' — ' + cssValue : ' (unresolved)');
        const descEl = document.createElement('div');
        descEl.className = 'description';
        descEl.textContent = result.description;
        meta.appendChild(idEl);
        meta.appendChild(descEl);

        const copyIdBtn = document.createElement('button');
        copyIdBtn.textContent = 'Copy ID';
        copyIdBtn.addEventListener('click', () => vscode.postMessage({ type: 'copyId', id: result.id }));

        const copyJsonBtn = document.createElement('button');
        copyJsonBtn.textContent = 'Copy JSON';
        copyJsonBtn.addEventListener('click', () =>
          vscode.postMessage({ type: 'copyJson', id: result.id, cssValue }),
        );

        row.appendChild(swatch);
        row.appendChild(meta);
        row.appendChild(copyIdBtn);
        row.appendChild(copyJsonBtn);
        resultsEl.appendChild(row);
      }
    }

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'searchResults') {
        render(message.results);
      }
    });

    searchInput.addEventListener('input', () => {
      vscode.postMessage({ type: 'search', query: searchInput.value });
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}
