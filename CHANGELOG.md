# Change Log
## 0.0.3
- Fix phpcbf hanging issue by closing stdin [@shivanandwp](https://github.com/shivanandwp) [#2](https://github.com/soderlind/vscode-phpcbf/issues/2)
- For relative links in settings executablePath, add support for multi-root workspaces, i.e. will look for phpcbf in all workspaces
- Add support for period in the path: `{ "phpcbf.executablePath" : "./vendor/bin/phpcbf" }`, i,e, the period is the workspace root
## 0.0.2
- Update documentation about the `phpcbf.executablePath` setting.
- Add credits, copyright and license.
## 0.0.1
- Initial release