# Contributing to vscode-phpcbf

Thank you for considering contributing! This is a VS Code extension that runs [PHP Code Beautifier and Fixer (PHPCBF)](https://github.com/PHPCSStandards/PHP_CodeSniffer) on PHP files.

## Getting started

1. **Fork** the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open the project in VS Code. Press **F5** to launch a new Extension Development Host window with the extension loaded.

## Project layout

```
extension.js      Main extension entry point — PHPCBF class and activation logic
lib/utils.js      Pure utility functions (findFiles, etc.)
test/
  unit.test.js    Unit tests (no VS Code required) — run with: npm run test:unit
  extension.test.js  VS Code integration tests — run via F5 + test runner
package.json      Extension manifest (contributes, activationEvents, settings)
CHANGELOG.md      Release notes
```

## Running tests

### Unit tests (fast, no VS Code needed)

```bash
npm run test:unit
```

Requires Node.js 18+.

### VS Code integration tests

Press **F5** in VS Code to open the Extension Development Host, then run the test suite from there. These tests require a display environment and cannot run headlessly in most CI setups.

## Code style

- Plain JavaScript (ES6, CommonJS modules) — no TypeScript compilation step.
- 4-space indentation; match the style of the surrounding code.
- Run ESLint before submitting: `./node_modules/.bin/eslint extension.js lib/`
- Keep changes focused — one logical change per PR.

## Submitting a pull request

1. Create a feature branch off `master`: `git checkout -b fix/description`.
2. Make your changes and add or update tests where possible.
3. Run `npm run test:unit` to confirm tests pass.
4. Open a pull request against `master` with a clear title and description.
5. Reference any related issues using `Closes #N` or `Related to #N`.

## Reporting bugs

Please include:
- VS Code version and OS
- The `phpcbf.executablePath` you are using (output of `which phpcbf` or equivalent)
- Whether `phpcbf.debug: true` output shows anything useful (View → Output → phpcbf)
- Steps to reproduce

## Common configuration tips

| Problem | Setting to try |
|---------|---------------|
| Extension can't find `phpcbf` | Set `phpcbf.executablePath` to the absolute path |
| phpcs.xml not picked up | Enable `phpcbf.configSearch: true` |
| Relative path in `phpcbf.standard` fails | Use `"${workspaceFolder}/phpcs.xml"` |
| Formatting doesn't run on save | Add `"[php]": { "editor.defaultFormatter": "soderlind.phpcbf", "editor.formatOnSave": true }` |

## Notes for maintainers

- `package.json` changes (version bumps, new settings) must be made manually as they are in a protected branch context for automated workflows.
- The extension ID on the Marketplace is `persoderlind.phpcbf` (note the `per` prefix).
