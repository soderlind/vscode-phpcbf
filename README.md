# PHP Code Beautifier and Fixer for Visual Studio Code

This extension provides the PHP Code Beautifier and Fixer (`phpcbf`) command for Visual Studio Code.

`phpcbf` is the lesser known sibling of `phpcs` ([PHP_CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer)). `phpcbf` will try to fix and beautify your code according to a coding standard.

## Preview
>![phpcbf preview](https://raw.githubusercontent.com/soderlind/vscode-phpcbf/master/images/phpcbf-preview.gif)
>###### right mouse-click, in  context menu, select 'Format Document'. Here using the `WordPress-Core` standard. You can also enable formatting on save.

## Requirements

phpcbf must be installed. phpcbf is installed when you [install phpcs](https://github.com/squizlabs/PHP_CodeSniffer#installation).

A quick install is using [composer](https://getcomposer.org/). After [installing composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx), in your workspace root run the following command:

`composer require "squizlabs/php_codesniffer=*"`

## Extension Settings

This extension has the following settings:

* `phpcbf.enable`: [ Optional | Default: `true` ] enable/disable this extension.
* `phpcbf.executablePath`: [ Optional | Default: `phpcbf` ] Can be:
	* `${workspaceRoot}/vendor/bin/phpcbf`
	* `~/.composer/vendor/bin/phpcbf`
	* `phpcbf.bat`
	* `/usr/local/bin/phpcbf`
	* etc
* `phpcbf.documentFormattingProvider`: [ Optional | Default: `true` ]  Register PHP document formatting provider, right mouse-click context menu, select 'Format Document'
* `phpcbf.onsave`: [ Optional | Default: `false` ]. Run `phpcbf` on save.
* `phpcbf.standard`: [ Optional | Default: `null` ]. The formatting standard.
	* When `null`, phpcbf will use, if it's set, the `default_standard`, otherwise fallback to `Pear`.
	* By default, the following standards are available: `PEAR`, `Zend`, `PSR2`, `MySource`, `Squiz` and `PSR1`
	* If you add a standard to phpcs, it will be available for phpcbf, eg [Drupal](https://github.com/klausi/coder), [WordPress](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards), [Yii2](https://github.com/yiisoft/yii2-coding-standards), [Magento](https://github.com/magento/marketplace-eqp), [Symfony](https://github.com/djoos/Symfony-coding-standard) etc.
	* You can also point to a [phpcs.xml rules file](https://github.com/squizlabs/PHP_CodeSniffer/wiki/Annotated-ruleset.xml), eg: `"phpcbf.standard": "/file/path/phpcs.xml"`

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

## Known Issues

This is the first release of my first vscode extension, you're warned :)

## Release Notes

### 0.0.2

* Update documentation about the `phpcbf.executablePath` setting.
* Add credits, copyright and license.

### 0.0.1

Initial release

## Credits

I learned a lot reading the code of, and borrowing code from [PHP CS Fixer for Visual Studio Code](https://github.com/junstyle/vscode-php-cs-fixer).

# Copyright and License

PHP Code Beautifier and Fixer for Visual Studio Code is copyright 2018 Per Soderlind

PHP Code Beautifier and Fixer for Visual Studio Code is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later version.

PHP Code Beautifier and Fixer for Visual Studio Code is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with the Extension. If not, see http://www.gnu.org/licenses/.
