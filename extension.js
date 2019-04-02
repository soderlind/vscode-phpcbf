"use strict";
const vscode = require("vscode");
const {
    commands,
    workspace,
    window,
    languages,
    Range,
    Position
} = vscode;
const path = require("path");
const fs = require("fs");
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


        const resolvePath = (key) => {
            const addRootPath = (prefix) => {
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
                        let tmpPath = this[key].replace(prefix, rootPath);
                        fs.exists(tmpPath, exists => {
                            if (exists) {
                                this[key] = tmpPath;
                            }
                        });
                    }
                }
              }
            }
            if (this[key].startsWith("${workspaceRoot}")) {
                addRootPath("${workspaceRoot}");
            }
            if (this[key].startsWith("${workspaceFolder}")) {
                addRootPath("${workspaceFolder}");
            }
            if (this[key].startsWith(".")) {
                addRootPath(".");
            }
            if (this[key].startsWith("~")) {
                this[key] = this[key].replace(/^~\//, os.homedir() + "/");
            }
        }
    
        this.executablePath = config.get(
            "executablePath",
            process.platform == "win32" ? "php-cbf.bat" : "phpcbf"
        );
        resolvePath('executablePath');
    
        this.standard = config.get("standard", null);
        if (this.standard) resolvePath('standard');
    

        this.documentFormattingProvider = config.get(
            "documentFormattingProvider",
            true
        );

        this.debug = config.get("debug", false);
    }

    getArgs(document, tmpFileName) {
        let args = [];
        if (this.debug) {
            args.push("-l");
        } else {
            args.push("-lq");
        }
        args.push(tmpFileName);

        this.standard = this.getStandard(document);

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

    getStandard(document) {
        if (this.standard) return this.standard;
        // Check if a config file exists and handle it
        let standard = null;
        const folder = workspace.getWorkspaceFolder(document.uri);
        const workspaceRoot = folder ? folder.uri.fsPath : null;
        const filePath = document.fileName;
        if (this.configSearch && workspaceRoot !== null && filePath !== undefined) {
            const confFileNames = [
                '.phpcs.xml', '.phpcs.xml.dist', 'phpcs.xml', 'phpcs.xml.dist',
                'phpcs.ruleset.xml', 'ruleset.xml',
            ];

            const fileDir = path.relative(workspaceRoot, path.dirname(filePath));
            const confFile = this.findFiles(workspaceRoot, fileDir, confFileNames);

            standard = confFile || this.standard;
        } else {
            standard = this.standard;
        }

        return standard;
    }

    findFiles(parent, directory, name) {
        const names = [].concat(name);
        const chunks = path.resolve(parent, directory).split(path.sep);

        while (chunks.length) {
            let currentDir = chunks.join(path.sep);
            for (const fileName of names) {
                const filePath = path.join(currentDir, fileName);
                if (fs.existsSync(filePath)) {
                    return filePath;
                }
            }
            if (parent === currentDir) {
                break;
            }
            chunks.pop();
        }

        return null;
    }

    format(document) {
        if (this.debug) {
            console.time("phpcbf");
        }
        let text = document.getText();

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

        let exec = cp.spawn(this.executablePath, this.getArgs(document, fileName), {
            cwd: vscode.workspace.rootPath
        });
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

                fs.unlink(fileName, function (err) {});
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
                        const originalText = document.getText();
                        let lastLine = document.lineAt(document.lineCount - 1);
                        let range = new Range(
                            new Position(0, 0),
                            lastLine.range.end
                        );
                        phpcbf
                            .format(document)
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
            })
        );
    }
};
