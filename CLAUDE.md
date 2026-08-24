# VS Code Theme Inspector — Agent Instructions

## Project Instructions

Before making any changes to the project, read the following documents in this order:

1. `docs/bootstrap-plan.md`
2. `docs/implementation-plan.md`

These documents define the project's setup process, architecture, roadmap, and engineering requirements.

Follow them unless a technical issue requires a deviation.

---

## Current Phase

The project is currently in the bootstrap phase.

Do not implement the Theme Inspector before completing the bootstrap described in:

`docs/bootstrap-plan.md`

---

## Architecture

The project must maintain a clear separation between:

Core
→ VS Code Adapter
→ Official VS Code Extension

The Core is intended to be reusable by third-party developers.

The official extension is a consumer of the Core.

Do not couple the Core unnecessarily to the VS Code Extension API.

---

## Engineering Principles

Prioritize:

1. Correctness
2. Architecture
3. Maintainability
4. Public API quality
5. Testability
6. Documentation
7. Performance
8. Features

Do not introduce abstractions without a clear reason.

Do not add dependencies without evaluating whether they are actually necessary.

Use TypeScript with strict typing.

Avoid `any` unless there is a documented technical reason.

Do not invent VS Code APIs.

When uncertain about VS Code behavior, research the official documentation and verify the behavior experimentally when appropriate.

---

## Public API

Treat the public API as a product.

Do not expose internal implementation details unnecessarily.

Clearly distinguish between:

- public API;
- experimental API;
- internal implementation.

Breaking changes to public APIs must be intentional and documented.

---

## Testing

Core logic must be testable independently of the VS Code UI.

Add tests for meaningful functionality.

Do not consider a feature complete if it introduces behavior without appropriate test coverage.

---

## Git

Use Conventional Commits consistently.

Examples:

- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `docs:`
- `build:`
- `ci:`
- `chore:`

Keep commits small and logically cohesive.

Never use generic commit messages such as:

- `update`
- `fix`
- `changes`
- `stuff`
- `final`

Before every commit:

1. Run relevant tests.
2. Run `git status`.
3. Review `git diff`.
4. Review staged changes.
5. Verify that no secrets or unrelated files are included.

Keep `main` stable.

Do not rewrite published history unless explicitly requested.

---

## Security

Never commit:

- passwords;
- API keys;
- tokens;
- credentials;
- private keys;
- certificates;
- `.env` files containing secrets;
- personal sensitive data.

---

## Scope Control

Do not implement unrelated features simply because they appear interesting.

If a technical discovery requires changing the architecture or roadmap, document the reason before proceeding.

If an approach depends on unsupported or internal VS Code APIs, explicitly identify that dependency and its risks.

---

## Communication

When a task involves an important architectural decision:

1. Explain the problem.
2. Present the available options.
3. Explain the trade-offs.
4. Choose the most appropriate option.
5. Document the decision when appropriate.

Do not silently make major architectural changes.

---

## Definition of Done

A task is not considered complete merely because the code works locally.

When applicable, completion should include:

- implementation;
- tests;
- type checking;
- linting;
- documentation;
- appropriate Git commit;
- clean working tree.
