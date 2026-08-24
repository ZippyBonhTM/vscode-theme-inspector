# @vscode-theme-inspector/theme-colors

Registry of VS Code Theme Color IDs — id, category, and description for
every color documented in the
[official Theme Color reference](https://code.visualstudio.com/api/references/theme-color).

## Why this is a separate package

This registry is pure, static data plus lookup/search logic — it does not
resolve colors and does not depend on `vscode` or on
`@vscode-theme-inspector/core`. Keeping it separate lets it be consumed
(and regenerated) independently, per
[docs/adr/0001-core-separation.md](../../docs/adr/0001-core-separation.md).

## Data freshness

`src/data/theme-colors.generated.ts` is generated, not hand-written. To
refresh it against the current official reference:

```bash
node scripts/generate-theme-colors.mjs
```

Review the `git diff` before committing — this fetches from
`microsoft/vscode-docs` at run time and is not run automatically in CI.

## Usage

```ts
import { ThemeColorRegistry } from '@vscode-theme-inspector/theme-colors';

ThemeColorRegistry.get('sideBar.background');
// { id: 'sideBar.background', category: 'Side Bar', description: '...' }

ThemeColorRegistry.search('sidebar');
ThemeColorRegistry.byCategory('Side Bar');
ThemeColorRegistry.categories();
```

## Development

```bash
npm run build -w packages/theme-colors
npm run typecheck -w packages/theme-colors
npm run test -w packages/theme-colors
```
