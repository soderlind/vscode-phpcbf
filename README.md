# PHP Code Beautifier and Fixer for Visual Studio Code

This extension provides the PHP Code Beautifier and Fixer (`phpcbf`) command for Visual Studio Code.

`phpcbf` is the lesser known sibling of `phpcs` ([PHP_CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer)). `phpcbf` will try to fix and beautify your code according to a [coding standard](#coding-standards).

## Preview

> ![phpcbf preview](https://raw.githubusercontent.com/soderlind/vscode-phpcbf/master/images/phpcbf-preview.gif)
>
> ###### right mouse-click, in context menu, select 'Format Document'. Here using the `WordPress-Core` standard. You can also enable formatting on save.

## Requirements

phpcbf must be installed. phpcbf is installed when you [install phpcs](https://github.com/squizlabs/PHP_CodeSniffer#installation).

> I recommend phpcs version 3.2.2 or later.

A quick install is using [composer](https://getcomposer.org/). After [installing composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx), in your workspace root, run the following command:

`composer require "squizlabs/php_codesniffer=*"`

## Extension Settings

This extension has the following settings:

* `phpcbf.enable`: [ Optional | Default: `true` ] enable/disable this extension.
* `phpcbf.executablePath`: [ **Required** | Default: `phpcbf` ] Can be:
  * `${workspaceRoot}/vendor/bin/phpcbf`
  * `./vendor/bin/phpcbf`
  * `~/.composer/vendor/bin/phpcbf`
  * `phpcbf.bat`
  * `/usr/local/bin/phpcbf`
  * etc
* `phpcbf.documentFormattingProvider`: [ Optional | Default: `true` ] Register PHP document formatting provider, right mouse-click context menu, select 'Format Document'
* `phpcbf.onsave`: [ Optional | Default: `false` ]. Format on save. `"editor.formatOnSave": true` will override this setting.
* `phpcbf.debug`: [ Optional | Default: `false` ]. Write phpcbf stdout to the console.
* `phpcbf.standard`: [ Optional | Default: `null` ]. The [coding standard](#coding-standards).


The default settings are

```json
{
    "phpcbf.enable": true,
    "phpcbf.executablePath": "phpcbf",
    "phpcbf.documentFormattingProvider": true,
    "phpcbf.onsave": false,
    "phpcbf.standard": null
}
```

In a multi-root project, settings can be saved in `.vscode/settings.json`

## Coding standards

### null
When set to `null`, phpcbf will use, if it's set, the `default_standard`, otherwise fallback to `Pear`. You set the default standard using `phpcs`, eg:

    phpcs --config-set default_standard PSR2

### Available standards
By default, the following standards are available: `PEAR`, `Zend`, `PSR2`, `MySource`, `Squiz` and `PSR1`

### Additional standards

If you add a standard to phpcs, it will be available for phpcbf. Some popular standards are: [Drupal](https://github.com/klausi/coder), [WordPress](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards), [Yii2](https://github.com/yiisoft/yii2-coding-standards), [Magento](https://github.com/magento/marketplace-eqp) and [Symfony](https://github.com/djoos/Symfony-coding-standard).

### Rules file

You can also point to a [phpcs.xml rules file](https://github.com/squizlabs/PHP_CodeSniffer/wiki/Annotated-ruleset.xml), eg: `"phpcbf.standard": "/file/path/phpcs.xml"`


## Troubleshooting

### Extension does nothing / no output in the debug console

1. **Check the executable path.** Open the VS Code Output panel (`View › Output`) and choose the *Extension Host* channel. A message like `PHPCBF: … executablePath not found` means the path configured in `phpcbf.executablePath` cannot be found. Set it to the absolute path of your `phpcbf` binary (e.g. `which phpcbf` on Linux/macOS or `where phpcbf.bat` on Windows).
2. **Enable debug mode.** Add `"phpcbf.debug": true` to your settings, then save a PHP file. The command and arguments will be printed to the Output panel so you can see what is being invoked.
3. **Reload the extension host.** After changing settings, run the *Developer: Reload Window* command to ensure the new values take effect.
4. **Language check.** The extension only activates for files recognised as PHP by VS Code. Confirm that the status bar shows `PHP` as the file language.

### `phpcbf.onsave` is not formatting on save

VS Code's built-in `"editor.formatOnSave"` takes precedence when it is set to `true`. The extension's own `phpcbf.onsave` option is intended as a fallback for when `editor.formatOnSave` is `false`. To format on save, use either:

```json
{
  "[php]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "persoderlind.vscode-phpcbf"
  }
}
```

or keep `editor.formatOnSave` set to `false` and use `"phpcbf.onsave": true` instead.

### "There is no formatter for 'PHP' files installed" / formatter not selected

VS Code requires an explicit default formatter when more than one formatting provider is registered. Add the following to your `settings.json`:

```json
{
  "[php]": {
    "editor.defaultFormatter": "persoderlind.vscode-phpcbf"
  }
}
```

Alternatively open a PHP file, press `Shift+Alt+F` and choose **Configure Default Formatter** from the prompt.

### Coding standard not found

If you see `ERROR: the "…" coding standard is not installed`, check:

* The `phpcbf.standard` value is spelled correctly and phpcs can find it (`phpcs -i` lists installed standards).
* If you are pointing to a rules file, use an absolute path or `${workspaceFolder}/phpcs.xml`.
* If different sub-directories use different standards, enable `"phpcbf.configSearch": true` so the extension auto-discovers the nearest `phpcs.xml` / `.phpcs.xml` file.

### Relative `executablePath` stops working after VS Code restarts

The extension resolves relative paths (starting with `./`, `${workspaceFolder}`, or `~`) at load time. If the path resolves correctly the first time but not after a restart, it usually means the extension is loading before the workspace folders are available. Use an absolute path as a workaround, or prefix with `${workspaceFolder}`:

```json
{
  "phpcbf.executablePath": "${workspaceFolder}/vendor/bin/phpcbf"
}
```

## Known Issues

None, but this is my first vscode extension, you're warned :)

## Release Notes

Please see the [changelog](https://marketplace.visualstudio.com/items/persoderlind.vscode-phpcbf/changelog).

## Credits

I learned a lot reading the code of, and borrowing code from [PHP CS Fixer for Visual Studio Code](https://github.com/junstyle/vscode-php-cs-fixer).

# Copyright and License

PHP Code Beautifier and Fixer for Visual Studio Code is copyright 2018 Per Soderlind

PHP Code Beautifier and Fixer for Visual Studio Code is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later version.

PHP Code Beautifier and Fixer for Visual Studio Code is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with the Extension. If not, see http://www.gnu.org/licenses/.
