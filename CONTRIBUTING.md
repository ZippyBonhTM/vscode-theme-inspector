# Contributing

Thanks for your interest in contributing to VS Code Theme Inspector. The
project is in early development; expect the architecture and APIs to change.

## Setup

Requirements:

- Node.js >= 20 (LTS recommended)
- npm (this repository uses npm workspaces; do not use pnpm or yarn)

```bash
git clone https://github.com/ZippyBonhTM/vscode-theme-inspector.git
cd vscode-theme-inspector
npm install
```

## Common tasks

```bash
npm run lint          # ESLint across the workspace
npm run typecheck      # TypeScript, no emit
npm run test           # Unit tests (core) + extension integration tests
npm run build           # Compile all packages
```

Run the extension in the Extension Development Host with `F5` from
`apps/vscode-extension` (see `.vscode/launch.json`).

## Branching

- `main` must always build, lint, typecheck, test, and pass CI.
- Feature branches: `feat/<short-description>`
- Fixes: `fix/<short-description>`
- Refactors: `refactor/<short-description>`
- Technical experiments / proofs of concept: `experiment/<short-description>`

## Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add theme color registry
fix: preserve alpha channel during color conversion
refactor: isolate theme resolution from vscode adapter
test: add coverage for theme color parser
docs: document public resolver API
build: configure workspace packages
ci: validate extension build
chore: update dependencies
```

Guidelines:

- One commit = one logical change. Avoid bundling unrelated changes.
- No generic messages (`update`, `fix`, `changes`, `wip`, `final`).
- Before committing: run `git status`, review `git diff` and
  `git diff --cached`, and run the relevant tests.

## Pull requests

- Keep PRs focused and reasonably small.
- Describe _why_, not just _what_.
- Ensure lint, typecheck, test, and build all pass locally before opening
  the PR. CI must be green before merge.
- Update documentation (README, package docs, ADRs) when behavior or public
  API changes.

## Public API

Code exported from a package's `src/index.ts` is considered public API and is
subject to the stability guarantees described in
[docs/architecture-decision.md](docs/architecture-decision.md). Do not import
internal modules directly from another package.

## Tests

- Core logic (`packages/core`) must be covered by unit tests independent of
  VS Code, using Vitest.
- The extension (`apps/vscode-extension`) is covered by integration tests
  running in the Extension Development Host (`@vscode/test-cli` +
  `@vscode/test-electron`).
- Do not consider a feature complete without appropriate test coverage.
