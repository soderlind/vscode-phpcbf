# Change Log

## Unreleased
* Default `phpcbf.configSearch` to `true` so phpcs.xml / .phpcs.xml / phpcs.xml.dist / ruleset.xml files are discovered automatically. Users who set `phpcbf.standard` explicitly and do **not** want workspace config files to override it should set `phpcbf.configSearch: false`. Closes #17.

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
