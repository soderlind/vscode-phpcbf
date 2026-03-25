"use strict";
/**
 * Unit tests for the PHPCBF class in extension.js.
 * Run with: node --test test/phpcbf.test.js
 * Requires Node.js 18+ (uses built-in test runner).
 *
 * Uses a lightweight vscode stub so the extension module can be loaded without
 * a real VS Code Extension Host.
 */
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const os = require("os");
const Module = require("module");

// ---------------------------------------------------------------------------
// Minimal vscode stub — only the APIs used by PHPCBF are implemented.
// ---------------------------------------------------------------------------

function makeConfig(values) {
    return {
        get(key, defaultValue) {
            return key in values ? values[key] : defaultValue;
        },
    };
}

const vscodeStub = {
    workspace: {
        getConfiguration(_section, _uri) {
            return makeConfig({});
        },
        getWorkspaceFolder(_uri) {
            return null;
        },
        workspaceFolders: null,
        onWillSaveTextDocument() { return { dispose() {} }; },
        onDidChangeConfiguration() { return { dispose() {} }; },
    },
    window: {
        activeTextEditor: null,
        showErrorMessage() {},
    },
    languages: {
        registerDocumentFormattingEditProvider() { return { dispose() {} }; },
    },
    commands: {
        registerTextEditorCommand() { return { dispose() {} }; },
        executeCommand() {},
    },
    Range: class Range {},
    Position: class Position {},
};

// Intercept require("vscode") and return our stub instead.
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === "vscode") {
        return vscodeStub;
    }
    return originalLoad.call(this, request, parent, isMain);
};

const { PHPCBF } = require("../extension");

// Restore the original loader so other requires work normally.
Module._load = originalLoad;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePhpcbf(configValues) {
    // Always include "enable: true" since the extension's loadSettings() checks
    // !config.get("enable") — without a default the stub returns undefined,
    // which is falsy, causing early return before any settings are stored.
    const values = Object.assign({ enable: true }, configValues || {});
    vscodeStub.workspace.getConfiguration = () => makeConfig(values);
    return new PHPCBF();
}

// ---------------------------------------------------------------------------
// PHPCBF.loadSettings
// ---------------------------------------------------------------------------

describe("PHPCBF.loadSettings", () => {
    test("uses default executablePath when not configured", () => {
        const p = makePhpcbf({});
        const expected = process.platform === "win32" ? "php-cbf.bat" : "phpcbf";
        assert.equal(p.executablePath, expected);
    });

    test("uses configured executablePath", () => {
        const p = makePhpcbf({ executablePath: "/usr/local/bin/phpcbf" });
        assert.equal(p.executablePath, "/usr/local/bin/phpcbf");
    });

    test("expands ~ at start of executablePath", () => {
        const p = makePhpcbf({ executablePath: "~/bin/phpcbf" });
        assert.equal(p.executablePath, path.join(os.homedir(), "bin/phpcbf"));
    });

    test("defaults onsave to false", () => {
        const p = makePhpcbf({});
        assert.equal(p.onsave, false);
    });

    test("reads onsave setting", () => {
        const p = makePhpcbf({ onsave: true });
        assert.equal(p.onsave, true);
    });

    test("defaults debug to false", () => {
        const p = makePhpcbf({});
        assert.equal(p.debug, false);
    });

    test("reads debug setting", () => {
        const p = makePhpcbf({ debug: true });
        assert.equal(p.debug, true);
    });

    test("defaults standard to null", () => {
        const p = makePhpcbf({});
        assert.equal(p.standard, null);
    });

    test("reads standard setting", () => {
        const p = makePhpcbf({ standard: "PSR2" });
        assert.equal(p.standard, "PSR2");
    });

    test("defaults documentFormattingProvider to true", () => {
        const p = makePhpcbf({});
        assert.equal(p.documentFormattingProvider, true);
    });

    test("reads documentFormattingProvider setting", () => {
        const p = makePhpcbf({ documentFormattingProvider: false });
        assert.equal(p.documentFormattingProvider, false);
    });
});

// ---------------------------------------------------------------------------
// PHPCBF.getArgs
// ---------------------------------------------------------------------------

describe("PHPCBF.getArgs", () => {
    const fakeDoc = {
        uri: {},
        fileName: "/workspace/foo.php",
        getText() { return "<?php"; },
    };

    test("includes -lq flag when debug is false", () => {
        const p = makePhpcbf({ debug: false, standard: null });
        const args = p.getArgs(fakeDoc, "/tmp/tmp.php");
        assert.ok(args.includes("-lq"), "expected -lq flag");
        assert.ok(!args.includes("-l") || args.indexOf("-l") === args.indexOf("-lq"), "should not have bare -l without q");
    });

    test("includes -l flag (not -lq) when debug is true", () => {
        const p = makePhpcbf({ debug: true, standard: null });
        const args = p.getArgs(fakeDoc, "/tmp/tmp.php");
        assert.ok(args.includes("-l"), "expected -l flag");
        assert.ok(!args.includes("-lq"), "should not have -lq in debug mode");
    });

    test("includes tmpFileName in args", () => {
        const p = makePhpcbf({ debug: false, standard: null });
        const args = p.getArgs(fakeDoc, "/tmp/mytmp.php");
        assert.ok(args.includes("/tmp/mytmp.php"), "expected tmpFileName in args");
    });

    test("includes --standard when standard is set", () => {
        const p = makePhpcbf({ debug: false, standard: "PSR2" });
        const args = p.getArgs(fakeDoc, "/tmp/tmp.php");
        assert.ok(args.some(a => a.startsWith("--standard=")), "expected --standard= arg");
        assert.ok(args.some(a => a === "--standard=PSR2"), "expected --standard=PSR2");
    });

    test("omits --standard when standard is null", () => {
        const p = makePhpcbf({ debug: false, standard: null });
        const args = p.getArgs(fakeDoc, "/tmp/tmp.php");
        assert.ok(!args.some(a => a.startsWith("--standard=")), "should not include --standard");
    });

    test("flag comes before tmpFileName", () => {
        const p = makePhpcbf({ debug: false, standard: null });
        const args = p.getArgs(fakeDoc, "/tmp/tmp.php");
        const flagIdx = args.indexOf("-lq");
        const fileIdx = args.indexOf("/tmp/tmp.php");
        assert.ok(flagIdx < fileIdx, "flag should precede tmpFileName");
    });
});

// ---------------------------------------------------------------------------
// PHPCBF.getStandard
// ---------------------------------------------------------------------------

describe("PHPCBF.getStandard", () => {
    const fakeDoc = (fileName) => ({
        uri: { fsPath: fileName },
        fileName,
    });

    test("returns configured standard when configSearch is false", () => {
        const p = makePhpcbf({ configSearch: false, standard: "PSR2" });
        const result = p.getStandard(fakeDoc("/workspace/foo.php"));
        assert.equal(result, "PSR2");
    });

    test("returns null when standard is null and configSearch is false", () => {
        const p = makePhpcbf({ configSearch: false, standard: null });
        const result = p.getStandard(fakeDoc("/workspace/foo.php"));
        assert.equal(result, null);
    });

    test("returns configured standard when configSearch is true but no workspace folder", () => {
        vscodeStub.workspace.getWorkspaceFolder = () => null;
        const p = makePhpcbf({ configSearch: true, standard: "WordPress" });
        const result = p.getStandard(fakeDoc("/workspace/foo.php"));
        assert.equal(result, "WordPress");
        vscodeStub.workspace.getWorkspaceFolder = () => null;
    });

    test("returns configured standard when configSearch is true but filePath is undefined", () => {
        vscodeStub.workspace.getWorkspaceFolder = (uri) => ({ uri: { fsPath: "/workspace" } });
        const p = makePhpcbf({ configSearch: true, standard: "Symfony" });
        const docWithNoFile = { uri: {}, fileName: undefined };
        const result = p.getStandard(docWithNoFile);
        assert.equal(result, "Symfony");
        vscodeStub.workspace.getWorkspaceFolder = () => null;
    });
});
