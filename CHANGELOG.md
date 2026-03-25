# Change Log

## 0.0.10
* Fix hang when phpcbf has nothing to fix (exit code 0 now resolves cleanly with no edits). Closes #39.
* Always close stdin in `format()` regardless of debug mode, preventing timeout errors on some phpcbf builds. Closes #35.
* Use `path.join()` for temp file path to avoid path separator issues on Windows.
* Set `cwd: TmpDir` in `cp.spawn` so phpcbf can write temporary diff files on read-only working directories (macOS compatibility). Closes #16.
* Fix `fs.exists` async race condition in `addRootPath()` — replaced with synchronous `fs.existsSync` so `executablePath` is always resolved before `format()` is called. Closes #36.
* Fix broken error-display pattern for phpcbf exit code 3 (stdout was not being read when `phpcbfError` was true). Show actual phpcbf error output in the status bar.
* Add `resolve([])` instead of `reject()` in `provideDocumentFormattingEdits` when no changes are needed, eliminating spurious "Formatter failed" notifications in VS Code. Closes #19.
* Read `phpcbf.onsave` scoped to the document URI in `onWillSaveTextDocument` so per-folder settings in multi-root workspaces are respected. Closes #27.
* Only reload extension settings when a `phpcbf.*` configuration key changes (not on every VS Code settings change).
* Resolve `~`, `./` relative paths, and `${workspaceFolder}`/`${workspaceRoot}` variables in the `phpcbf.standard` setting. Closes #7, #38.
* Clean up temp file when a spawn error occurs.

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
