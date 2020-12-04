"use strict";
const vscode = require("vscode");
const { commands, workspace, window, languages, Range, Position } = vscode;
const fs = require("fs");
const lazy = require("lazy");
const os = require("os");
const cp = require("child_process");
const TmpDir = os.tmpdir();

class PHPCBF {
    constructor() {
        this.loadSettings();
    }

    loadSettings() {
        let config = workspace.getConfiguration(
            "phpcbf",
            window.activeTextEditor.document.uri
        );
        if (!config.get("enable") === true) {
            return;
        }
        this.onsave = config.get("onsave", false);

        this.executablePath = config.get(
            "executablePath",
            process.platform == "win32" ? "php-cbf.bat" : "phpcbf"
        );

        this.configSearch = config.get("configSearch", false);

        /**
         * relative paths?
         */

        // ${workspaceRoot} is deprecated
        if (this.executablePath.startsWith("${workspaceRoot}")) {
            this.addRootPath("${workspaceRoot}");
        }
        if (this.executablePath.startsWith("${workspaceFolder}")) {
            this.addRootPath("${workspaceFolder}");
        }
        if (this.executablePath.startsWith(".")) {
            this.addRootPath(".");
        }
        if (this.executablePath.startsWith("~")) {
            this.executablePath = this.executablePath.replace(
                /^~\//,
                os.homedir() + "/"
            );
        }

        this.standard = config.get("standard", null);

        this.documentFormattingProvider = config.get(
            "documentFormattingProvider",
            true
        );

        this.debug = config.get("debug", false);
    }

    getArgs(fileName) {
        let args = [];
        if (this.debug) {
            args.push("-l");
        } else {
            args.push("-lq");
        }
        args.push(fileName);

        if (this.standard) {
            args.push("--standard=" + this.standard);
        }
        if (this.debug) {
            console.group("PHPCBF");
            console.log(
                "PHPCBF args: " + this.executablePath + " " + args.join(" ")
            );
        }
        return args;
    }

    format(text, range) {
        if (this.debug) {
            console.time("phpcbf");
        }
        if (range) {
            text = this.insertAtLine(text, range);
        }
        // console.log(text);
        let phpcbfError = false;
        let fileName =
            TmpDir +
            "/temp-" +
            Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, "")
                .substr(0, 10) +
            ".php";
        fs.writeFileSync(fileName, text);

        let exec = cp.spawn(this.executablePath, this.getArgs(fileName));
        if (!this.debug) {
            exec.stdin.end();
        }

        let promise = new Promise((resolve, reject) => {
            exec.on("error", err => {
                reject();
                console.log(err);
                if (err.code == "ENOENT") {
                    window.showErrorMessage(
                        "PHPCBF: " + err.message + ". executablePath not found."
                    );
                }
            });
            exec.on("exit", code => {
                /*  phpcbf exit codes:
                Exit code 0 is used to indicate that no fixable errors were found, so nothing was fixed
                Exit code 1 is used to indicate that all fixable errors were fixed correctly
                Exit code 2 is used to indicate that PHPCBF failed to fix some of the fixable errors it found
                Exit code 3 is used for general script execution errors
                */
                switch (code) {
                    case 0:
                        break;
                    case 1:
                    case 2:
                        let fixed = fs.readFileSync(fileName, "utf-8");
                        if (fixed.length > 0) {
                            resolve(fixed);
                        } else {
                            reject();
                        }
                        break;
                    case 3:
                        phpcbfError = true;
                        break;
                    default:
                        let msgs = {
                            3: "PHPCBF: general script execution errors.",
                            16: "PHPCBF: Configuration error of the application.",
                            32: "PHPCBF: Configuration error of a Fixer.",
                            64: "PHPCBF: Exception raised within the application."
                        };
                        window.showErrorMessage(msgs[code]);
                        reject();
                        break;
                }

                fs.unlink(fileName, function (err) { });
            });
        });

        if (phpcbfError) {
            exec.stdout.on("data", buffer => {
                console.log(buffer.toString());
                window.showErrorMessage(buffer.toString());
            });
        }
        if (this.debug) {
            exec.stdout.on("data", buffer => {
                console.log(buffer.toString());
            });
        }
        exec.stderr.on("data", buffer => {
            console.log(buffer.toString());
        });
        exec.on("close", code => {
            // console.log(code);
            if (this.debug) {
                console.timeEnd("phpcbf");
                console.groupEnd();
            }
        });

        return promise;
    }

    addRootPath(prefix) {
        const resources = [];
        if (workspace.workspaceFolders) {
            for (let wsFolder of workspace.workspaceFolders) {
                resources.push(wsFolder.uri);
            }
        } else {
            const editor = window.activeTextEditor;
            if (editor) {
                resources.push(editor.document.uri);
            }
        }
        for (let resource of resources) {
            if (resource.scheme == "file") {
                const folder = workspace.getWorkspaceFolder(resource);
                if (folder) {
                    const rootPath = folder.uri.fsPath;
                    let tmpExecutablePath = this.executablePath.replace(
                        prefix,
                        rootPath
                    );
                    fs.exists(tmpExecutablePath, exists => {
                        if (exists) {
                            this.executablePath = tmpExecutablePath;
                        }
                    });
                }
            }
        }
    }

    insertAtLine(text, range) {
       var nLines = 0;
       var length = text.length;
       var tag = '\n// everthingbetweenthesetagsiscollected\n';
		 var offset = 1;
		 var start = false;
		 var end = false;
		 var lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
		 var i = 0;
		 if (parseInt(range.start.line) === 0) {
			//  console.log('added tag at 0');
			text = this.insert(0, tag, text);
			length += tag.length;
			nLines++;
			start = true;
			i += tag.length;
		}
		 if (parseInt(range.end.line) === lastLine || parseInt(range.end.line) === lastLine - 1) {
			//  console.log('added tag at end');
			 end = true;
			 length += tag.length;
			 text = this.insert(length, tag, text);
		}
		 for (i; i < length; i++) {
            if (parseInt(range.start.line) === nLines && nLines !== 0 && ! start ) {
                console.log(nLines);
                text = this.insert(i - offset, tag, text);
                length += tag.length;
                i += tag.length;
                nLines++;
            }
            if (nLines === parseInt(range.end.line) + 2 && ! end ) {
                console.log(nLines);
                text = this.insert(i, tag, text);
                length += tag.length;
                i += tag.length;
                nLines++;
				}
            if (text[i] === '\n') {
                nLines++;
            }
		 }
      return text;
	 }

	insert(index, string, text) {
		if (index > 0) {
        return text.substring(0, index) + string + text.substring(index, text.length);
  		}
   	return string + text;
	}
}

exports.activate = context => {
    let phpcbf = new PHPCBF();

    context.subscriptions.push(
        workspace.onWillSaveTextDocument(event => {
            const editor = window.activeTextEditor;
            if (
                event.document.languageId == "php" &&
                phpcbf.onsave &&
                workspace
                    .getConfiguration("editor", editor.document.uri)
                    .get("formatOnSave") === false
            ) {
                event.waitUntil(
                    commands.executeCommand("editor.action.formatDocument")
                );
            }
        })
    );

    context.subscriptions.push(
        commands.registerTextEditorCommand("phpcbf-soderlind", textEditor => {
            if (textEditor.document.languageId == "php") {
                commands.executeCommand("editor.action.formatDocument");
                commands.executeCommand("editor.action.formatSelection");
            }
        })
    );

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(() => {
            phpcbf.loadSettings();
        })
    );

    if (phpcbf.documentFormattingProvider) {
        context.subscriptions.push(
            languages.registerDocumentFormattingEditProvider("php", {
                provideDocumentFormattingEdits: (document, options, token) => {
                    return new Promise((resolve, reject) => {
                        let originalText = document.getText();
                        let lastLine = document.lineAt(document.lineCount - 1);
                        let range = new Range(
                            new Position(0, 0),
                            lastLine.range.end
                        );
                        phpcbf
                            .format(originalText)
                            .then(text => {
                                if (text != originalText) {
                                    resolve([new vscode.TextEdit(range, text)]);
                                } else {
                                    reject();
                                }
                            })
                            .catch(err => {
                                console.log(err);
                                reject();
                            });
                    });
                }
            }),
            languages.registerDocumentRangeFormattingEditProvider("php", {
                provideDocumentRangeFormattingEdits: (document, range, options, token) => {
                    const editor = vscode.window.activeTextEditor;
                    let allText = editor.document.getText();
                    return new Promise((resolve, reject) => {
                        phpcbf
                            .format(allText, range)
                            .then(text => {
                                const regex = /\/\/ everthingbetweenthesetagsiscollected([\S\s]*?)\/\/ everthingbetweenthesetagsiscollected/gm;
                                const str = text;
                                let m;
                                while ((m = regex.exec(str)) !== null) {
                                    if (m.index === regex.lastIndex) {
                                        regex.lastIndex++;
                                    }
                                    m.forEach((match, groupIndex) => {
                                        text = match;
                                    });
                                }
                                // remove leading linebreaks
                                text = text.replace(/^[\r|\n|\r\n]+/, '');
                                // remove trailing whitespace/linebreaks
										 var lastSelectedLine = editor.document.lineAt(range.end.line);
										 var lastLine = editor.document.lineCount - 1;

										 if (lastSelectedLine._line !== lastLine && lastSelectedLine._line !== lastLine - 1) {
											 console.log('removing useless whitespace');
											 text = text.trimEnd();
											//  text += '\n';
										 } else {
											 text = text.trimEnd();
											 text += '\n';
										 }

                                if (text != allText) {
											  let lastCharPos = Math.max(lastSelectedLine.text.length, 0);
											  var newRange = new vscode.Range(
												  new Position(range.start.line, 0),
												  new Position(range.end.line, lastCharPos),
												);
                                    resolve([new vscode.TextEdit(newRange, text)]);
                                } else {
                                    reject();
                                }
                            })
                            .catch(err => {
                                console.log('error');
                                console.log(err);
                                reject();
                            });
                    });
                }
            })
        );
    }
};
