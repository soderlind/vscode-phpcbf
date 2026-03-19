"use strict";
/**
 * Unit tests for the PHPCBF class (extension.js).
 *
 * Because extension.js imports the `vscode` API (unavailable in plain Node),
 * we inject a lightweight mock via Module._resolveFilename before loading the
 * extension module.  This lets us exercise loadSettings, getArgs, and
 * getStandard without a running VS Code Extension Host.
 *
 * Run with: npm run test:unit
 */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("module");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ---------------------------------------------------------------------------
// Minimal vscode mock
// ---------------------------------------------------------------------------

// Schema defaults mirror package.json contributes.configuration.properties
const SCHEMA_DEFAULTS = {
    enable: true,
    executablePath: process.platform === "win32" ? "php-cbf.bat" : "phpcbf",
    onsave: false,
    configSearch: false,
    standard: null,
    documentFormattingProvider: true,
    debug: false,
};

let mockConfig = {};

const mockVscode = {
    workspace: {
        getConfiguration: (_section, _uri) => ({
            get: (key, defaultVal) => {
                if (key in mockConfig) return mockConfig[key];
                if (key in SCHEMA_DEFAULTS) return SCHEMA_DEFAULTS[key];
                return defaultVal;
            },
        }),
        getWorkspaceFolder: () => null,
        workspaceFolders: [],
        onWillSaveTextDocument: () => ({ dispose: () => {} }),
        onDidChangeConfiguration: () => ({ dispose: () => {} }),
    },
    window: {
        activeTextEditor: null,
        showErrorMessage: () => {},
    },
    commands: {
        registerTextEditorCommand: () => ({ dispose: () => {} }),
        executeCommand: () => Promise.resolve(),
    },
    languages: {
        registerDocumentFormattingEditProvider: () => ({ dispose: () => {} }),
    },
    Range: class Range {
        constructor(start, end) { this.start = start; this.end = end; }
    },
    Position: class Position {
        constructor(line, char) { this.line = line; this.character = char; }
    },
    TextEdit: class TextEdit {},
};

// Intercept require('vscode') before extension.js is loaded.
const VSCODE_MOCK_PATH = "/test-mock/vscode-phpcbf-unit";
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === "vscode") return VSCODE_MOCK_PATH;
    return origResolve.apply(this, arguments);
};
require.cache[VSCODE_MOCK_PATH] = {
    id: VSCODE_MOCK_PATH,
    filename: VSCODE_MOCK_PATH,
    loaded: true,
    exports: mockVscode,
    parent: null,
    children: [],
    paths: [],
};

const { PHPCBF } = require("../extension");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpRoot;

function mkDir(...parts) {
    const dir = path.join(tmpRoot, ...parts);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function mkFile(...parts) {
    const filePath = path.join(tmpRoot, ...parts);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "");
    return filePath;
}

function resetConfig(overrides) {
    mockConfig = overrides || {};
}

before(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "phpcbf-class-unit-"));
});

after(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    // Restore the original resolver so subsequent requires are unaffected.
    Module._resolveFilename = origResolve;
    delete require.cache[VSCODE_MOCK_PATH];
});

// ---------------------------------------------------------------------------
// PHPCBF.loadSettings
// ---------------------------------------------------------------------------

describe("PHPCBF.loadSettings", () => {
    test("uses default executablePath when not configured", () => {
        resetConfig({});
        const phpcbf = new PHPCBF();
        const expected = process.platform === "win32" ? "php-cbf.bat" : "phpcbf";
        assert.equal(phpcbf.executablePath, expected);
    });

    test("uses configured executablePath", () => {
        resetConfig({ executablePath: "/usr/local/bin/phpcbf" });
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.executablePath, "/usr/local/bin/phpcbf");
    });

    test("default onsave is false", () => {
        resetConfig({});
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.onsave, false);
    });

    test("onsave can be enabled via config", () => {
        resetConfig({ onsave: true });
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.onsave, true);
    });

    test("default standard is null", () => {
        resetConfig({});
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.standard, null);
    });

    test("standard can be set via config", () => {
        resetConfig({ standard: "PSR2" });
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.standard, "PSR2");
    });

    test("default configSearch is false", () => {
        resetConfig({});
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.configSearch, false);
    });

    test("default debug is false", () => {
        resetConfig({});
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.debug, false);
    });

    test("tilde in executablePath is expanded to home directory", () => {
        resetConfig({ executablePath: "~/bin/phpcbf" });
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.executablePath, os.homedir() + "/bin/phpcbf");
    });

    test("loadSettings can be called again to reload config", () => {
        resetConfig({ standard: "PSR1" });
        const phpcbf = new PHPCBF();
        assert.equal(phpcbf.standard, "PSR1");
        resetConfig({ standard: "WordPress" });
        phpcbf.loadSettings();
        assert.equal(phpcbf.standard, "WordPress");
    });
});

// ---------------------------------------------------------------------------
// PHPCBF.getArgs
// ---------------------------------------------------------------------------

describe("PHPCBF.getArgs", () => {
    const fakeDoc = {
        fileName: "/workspace/src/test.php",
        uri: { fsPath: "/workspace/src/test.php" },
    };

    test("includes -lq flag when debug is false", () => {
        resetConfig({ debug: false });
        const phpcbf = new PHPCBF();
        const args = phpcbf.getArgs(fakeDoc, "/tmp/test.php");
        assert.ok(args.includes("-lq"), `Expected -lq in [${args}]`);
        assert.ok(!args.includes("-l"), `Did not expect bare -l in [${args}]`);
    });

    test("includes -l flag (not -lq) when debug is true", () => {
        resetConfig({ debug: true });
        const phpcbf = new PHPCBF();
        const args = phpcbf.getArgs(fakeDoc, "/tmp/test.php");
        assert.ok(args.includes("-l"), `Expected -l in [${args}]`);
        assert.ok(!args.includes("-lq"), `Did not expect -lq in [${args}]`);
    });

    test("includes tmpFileName in args", () => {
        resetConfig({});
        const phpcbf = new PHPCBF();
        const tmpFile = "/tmp/my-test-file.php";
        const args = phpcbf.getArgs(fakeDoc, tmpFile);
        assert.ok(args.includes(tmpFile), `Expected tmpFile in args: [${args}]`);
    });

    test("includes --standard=<value> when standard is set", () => {
        resetConfig({ standard: "PSR2" });
        const phpcbf = new PHPCBF();
        const args = phpcbf.getArgs(fakeDoc, "/tmp/test.php");
        assert.ok(
            args.some((a) => a === "--standard=PSR2"),
            `Expected --standard=PSR2 in [${args}]`
        );
    });

    test("does not include --standard when standard is null", () => {
        resetConfig({ standard: null });
        const phpcbf = new PHPCBF();
        const args = phpcbf.getArgs(fakeDoc, "/tmp/test.php");
        assert.ok(
            !args.some((a) => a.startsWith("--standard=")),
            `Unexpected --standard in [${args}]`
        );
    });

    test("-lq is the first argument in non-debug mode", () => {
        resetConfig({ debug: false });
        const phpcbf = new PHPCBF();
        const args = phpcbf.getArgs(fakeDoc, "/tmp/test.php");
        assert.equal(args[0], "-lq");
    });

    test("-l is the first argument in debug mode", () => {
        resetConfig({ debug: true });
        const phpcbf = new PHPCBF();
        const args = phpcbf.getArgs(fakeDoc, "/tmp/test.php");
        assert.equal(args[0], "-l");
    });
});

// ---------------------------------------------------------------------------
// PHPCBF.getStandard
// ---------------------------------------------------------------------------

describe("PHPCBF.getStandard", () => {
    // Override getWorkspaceFolder for each test as needed.
    function makeDoc(fileName, workspaceRoot) {
        mockVscode.workspace.getWorkspaceFolder = () =>
            workspaceRoot ? { uri: { fsPath: workspaceRoot } } : null;
        return { fileName, uri: {} };
    }

    after(() => {
        mockVscode.workspace.getWorkspaceFolder = () => null;
    });

    test("returns this.standard when configSearch is false", () => {
        resetConfig({ configSearch: false, standard: "WordPress" });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(
            makeDoc("/workspace/src/file.php", "/workspace")
        );
        assert.equal(result, "WordPress");
    });

    test("returns null when configSearch is false and no standard set", () => {
        resetConfig({ configSearch: false });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(
            makeDoc("/workspace/src/file.php", "/workspace")
        );
        assert.equal(result, null);
    });

    test("returns this.standard when configSearch is true but workspace folder is null", () => {
        resetConfig({ configSearch: true, standard: "PSR1" });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(makeDoc("/some/file.php", null));
        assert.equal(result, "PSR1");
    });

    test("returns config file path when phpcs.xml exists in workspace root", () => {
        const workspaceRoot = mkDir("ws-phpcs-root");
        const confFile = mkFile("ws-phpcs-root", "phpcs.xml");
        resetConfig({ configSearch: true, standard: "PSR2" });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(
            makeDoc(path.join(workspaceRoot, "src", "file.php"), workspaceRoot)
        );
        assert.equal(result, confFile);
    });

    test("finds .phpcs.xml when it is preferred over phpcs.xml", () => {
        const workspaceRoot = mkDir("ws-dotphpcs");
        mkFile("ws-dotphpcs", "phpcs.xml"); // lower-priority file
        const dotFile = mkFile("ws-dotphpcs", "src", ".phpcs.xml"); // higher-priority (closer)
        resetConfig({ configSearch: true, standard: "PSR2" });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(
            makeDoc(path.join(workspaceRoot, "src", "file.php"), workspaceRoot)
        );
        assert.equal(result, dotFile);
    });

    test("falls back to this.standard when configSearch is true but no config file found", () => {
        const workspaceRoot = mkDir("ws-no-conf");
        resetConfig({ configSearch: true, standard: "Symfony" });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(
            makeDoc(path.join(workspaceRoot, "src", "file.php"), workspaceRoot)
        );
        assert.equal(result, "Symfony");
    });

    test("returns null when configSearch is true, no config file, and standard is null", () => {
        const workspaceRoot = mkDir("ws-null-standard");
        resetConfig({ configSearch: true, standard: null });
        const phpcbf = new PHPCBF();
        const result = phpcbf.getStandard(
            makeDoc(path.join(workspaceRoot, "file.php"), workspaceRoot)
        );
        assert.equal(result, null);
    });
});
