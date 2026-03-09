# Change Log

## [Unreleased] — 0.0.10

### Bug Fixes

* Fix formatter hang (infinite "Formatting…" spinner) when a file has no fixable errors (phpcbf exit code 0). Closes #39. _(PR #49)_
* Fix `phpcbf.enable: false` having no effect — formatting still ran. _(PR #56)_
* Fix temp file not being cleaned up when the phpcbf process emits an error event, preventing a resource leak. _(PR #58)_
* Fix `onWillSaveTextDocument` listener using `executeCommand` instead of returning `TextEdit[]`, which could cause save timeouts. Closes #35. _(PR #53)_
* Fix deprecated async `fs.exists` in `addRootPath`, replaced with `fs.existsSync`. Closes #36. _(PR #51)_
* Fix `window.showErrorMessage` called with `undefined` when an unrecognised phpcbf exit code is received; now skipped when message is not defined. _(PR #61)_
* Fix Windows-incompatible temp file path: use `path.join` instead of hardcoded `/` separator. _(PR #49)_

### Improvements

* Add VS Code output channel (`PHP Code Beautifier`) for debug logging and error display, replacing `console.log`. _(PR #50)_
* Improve real-time phpcbf error display: stdout is now always buffered so error messages from exit code 3 are shown correctly. _(PR #49)_
* Refactor `getArgs` to use a local variable for the coding standard, removing an unnecessary side-effect write to `this.standard`. _(PR #60)_
* Fix `.eslintrc.json` `sourceType` from `"module"` to `"script"` (extension uses CommonJS); adopt `eslint:recommended` baseline; fix `no-case-declarations` in switch blocks.

### Documentation

* Document `phpcbf.configSearch`, `${workspaceFolder}` in `phpcbf.standard`, and VS Code 1.61+ requirement to set `editor.defaultFormatter`. _(PR #55)_

## 0.0.9
* Fix crash on activation and configuration reload when no text editor is active (`window.activeTextEditor` is `null`). Closes #35, #43.
* Reload settings per-document on every format call, so per-folder and multi-root workspace settings are respected. Closes #36.
* Resolve `${workspaceFolder}` and `${workspaceRoot}` variables in the `phpcbf.standard` setting. Closes #38.
* Use `event.document.uri` (instead of `window.activeTextEditor`) in the `onWillSaveTextDocument` listener to avoid potential null-reference errors.

## 0.0.8
* Allow configuration from `.vscode/settings.json` when in a Multi-root project. [@WraithKenny](https://github.com/WraithKenny) [#6](https://github.com/soderlind/vscode-phpcbf/pull/6)
## 0.0.7
* In documentation, rename named anchor.
## 0.0.6
* Minor fixes.
* Add license file.
* Update documentation.
## 0.0.5

* Fix format on save, either set setting `"phpcbf.onsave": true` or `"editor.formatOnSave": true`
## 0.0.4
* Add the `phpcbf.debug` setting. When enabled, output from phpcbf will be written to the console.
## 0.0.3
* Fix phpcbf hanging issue by closing stdin [@shivanandwp](https://github.com/shivanandwp) [#2](https://github.com/soderlind/vscode-phpcbf/issues/2)
* For relative links in settings executablePath, add support for multi-root workspaces, i.e. will look for phpcbf in all workspaces
* Add support for period in the path: `{ "phpcbf.executablePath" : "./vendor/bin/phpcbf" }`, i,e, the period is the workspace root
## 0.0.2
* Update documentation about the `phpcbf.executablePath` setting.
* Add credits, copyright and license.
## 0.0.1
* Initial release.
