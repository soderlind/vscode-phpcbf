# AGENTS.md

Guidelines for AI coding assistants working on this repository.

## Project Overview

`vscode-phpcbf` is a VS Code extension that integrates PHP Code Beautifier and
Fixer (phpcbf) as a document formatting provider.  The extension is written in
plain JavaScript (CommonJS, no TypeScript, no bundler).

## Directory Layout

```
extension.js          Main extension entry point
lib/utils.js          Pure utility functions (findFiles)
test/unit.test.js     Unit tests (Node.js built-in test runner, Node ≥18)
test/index.js         VS Code integration test runner (not runnable in CI)
test/extension.test.js  Integration test stubs
package.json          Extension manifest and npm scripts
.eslintrc.json        ESLint configuration
```

## Running Tests

Unit tests (no VS Code required, works in CI):

```sh
node --test test/unit.test.js
# or
npm run test:unit
```

All 7 unit tests must pass before opening a PR.

The integration test suite (`npm test`) requires a running VS Code instance and
cannot be executed in a headless CI environment without additional tooling.

## Protected Files

The following files **cannot be modified by automated PRs** because they are
protected by repository settings.  Do not open PRs that only touch these files;
create an issue instead and describe what should change and why.

- `package.json` — extension manifest, scripts, and dependencies
- `.github/workflows/**` — GitHub Actions workflow files

If your fix or improvement requires changing a protected file, document the
required change in an issue and note in the PR that a maintainer must apply
that part manually.

## Coding Conventions

- Plain **CommonJS** (`require`/`module.exports`).  No ES Modules, no TypeScript.
- `"use strict"` at the top of every file.
- Indentation: **4 spaces** (matches existing code).
- Maximum line length: ~100 characters (soft limit, match surrounding code).
- Prefer `const` and `let`; avoid `var`.
- No new runtime dependencies.  The extension has zero production dependencies.
- Match the style of the surrounding code; avoid cosmetic reformatting in PRs
  that fix bugs or add features.

## Architecture Notes

- `PHPCBF` class in `extension.js` owns settings, formatting, and process
  management.  `loadSettings(uri)` is called on every format to honour
  per-folder settings in multi-root workspaces.
- Temp file lifecycle: a random temp `.php` file is created, passed to the
  `phpcbf` subprocess, then deleted on exit.
- `lib/utils.js` contains pure Node.js functions only — no `vscode` imports.
  Keep it that way so unit tests run without VS Code.

## Before Opening a PR

1. Read this file.
2. Run `node --test test/unit.test.js` and confirm all tests pass.
3. If you add new logic to `lib/utils.js`, add corresponding unit tests.
4. Keep PRs small and focused on one concern.
5. If a fix requires touching `package.json` or workflow files, create an issue
   instead (or note it clearly in the PR description).
