# 0002 — Monorepo with npm workspaces

## Status

Accepted

## Context

`docs/bootstrap-plan.md` (§16) asks us to evaluate whether a monorepo is
actually warranted, comparing:

- **A.** Monorepo from the start (`apps/` + `packages/`).
- **B.** Core and extension in the same package, separated only
  architecturally (by folder/module boundary, not by package boundary).
- **C.** Core as a separate package/repo from day one, with the extension
  elsewhere.

And, independently, which package manager to standardize on: npm, pnpm, or
yarn.

## Decision: Option A — npm workspaces monorepo

`docs/implementation-plan.md` already assumes an `apps/` + `packages/`
layout and a `@scope/core` import from the extension (§5–§7). Option B would
mean the "package boundary" is just a folder convention, which is easy to
violate accidentally (nothing stops `apps/vscode-extension` from importing
`../core/src/internal/...` directly) and gives no separate build/test/publish
unit for the core. Option C (separate repositories) adds real overhead
(cross-repo versioning, publishing, CI wiring) that isn't justified yet: the
core has exactly one consumer today (the official extension) and no external
consumers to protect against breaking changes from local development.

A monorepo with real package boundaries (Option A) gives the enforcement
Option B lacks, without the cross-repo overhead of Option C. It also matches
the structure the implementation plan already documents, so there is no
migration needed later.

## Decision: npm workspaces (not pnpm, not yarn)

| Criterion                                | npm                        | pnpm                                                         | yarn (berry)                               |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| Already available                        | Yes (bundled with Node.js) | No (needs separate install)                                  | No (needs separate install/corepack)       |
| Workspaces support                       | Yes (npm 7+)               | Yes                                                          | Yes                                        |
| Extra tooling/learning cost              | None                       | Low-moderate                                                 | Moderate                                   |
| Ecosystem fit for a small 2-package repo | Sufficient                 | Better at large scale (strict node_modules, faster installs) | Better at large scale (PnP, zero-installs) |

For a two-package repo (`packages/core`, `apps/vscode-extension`), pnpm's
stricter `node_modules` and disk-efficient store, and yarn Berry's PnP, solve
problems this project does not have yet (hundreds of packages, disk-space
pressure in CI, phantom-dependency bugs at scale). npm workspaces does
everything required here — install, run scripts per workspace, link
workspace packages — with zero additional dependencies, which matches the
bootstrap-plan's instruction to keep dependencies minimal. This can be
revisited if the workspace grows substantially.

`package-lock.json` is committed.

## Consequences

- One `npm install` at the root installs and links both packages.
- Build ordering between `packages/core` and `apps/vscode-extension` is
  explicit in `package.json` scripts (`build:core` before `build:extension`)
  rather than relying on npm's (non-guaranteed) workspace script ordering,
  since there are only two packages and hand-written ordering is simpler
  than adding a task-graph tool like Turborepo or Nx at this stage.
- If a third package is added and ordering becomes error-prone, a task
  runner may be reconsidered — not before.
