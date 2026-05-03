# Change Log

## 0.0.10 (unreleased)
* Fix hang when phpcbf finds no violations (exit code 0 now settles the Promise). Closes #39.
* Always close stdin after spawning phpcbf, regardless of `phpcbf.debug` mode, preventing save-listener timeout errors. Closes #35.
* Replace async `fs.exists()` with synchronous `fs.existsSync()` in `addRootPath()` to eliminate race condition that left `executablePath` unresolved on first format after reload. Closes #36.
* Resolve `~`, `./`, `${workspaceFolder}`, and `${workspaceRoot}` in `phpcbf.standard` (consistent with `phpcbf.executablePath` handling). Closes #7, #38.
* Fix spurious "Formatter failed" notification — return empty edits instead of rejecting the provider Promise when phpcbf makes no changes. Closes #19.
* Fix stdout capture for exit code 3 errors — `stdout` listener is now registered before spawn so error output is always visible.
* Read `phpcbf.onsave` per-document URI in `onWillSaveTextDocument` so per-folder settings work correctly in multi-root workspaces. Closes #27.
* Only reload settings when a `phpcbf.*` configuration key changes (not on every VS Code settings change).
* Set `cwd: TmpDir` when spawning phpcbf so temporary diff files can be written on all platforms.
* Use `path.join()` for temp file path construction to fix path separator on Windows. Closes #23.
* Clean up temp file on spawn error to prevent file leaks.
* Fix `console.group`/`console.time` crash when `phpcbf.debug` is enabled — debug output now goes to the VS Code Output panel (`View → Output → phpcbf`). Closes #14.
* Fix operator precedence in `phpcbf.enable` check so the setting is respected correctly.
* Prevent `findFiles` from walking above the workspace root when the file is outside the workspace.
* Improve `.vscodeignore` to reduce published extension package size.

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
