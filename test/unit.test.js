"use strict";
/**
 * Unit tests for pure utility functions in lib/utils.js.
 * Run with: npm run test:unit
 * Requires Node.js 18+ (uses built-in test runner).
 */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const os = require("os");

const { findFiles } = require("../lib/utils");

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

before(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "phpcbf-unit-"));
});

after(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// findFiles
// ---------------------------------------------------------------------------

describe("findFiles", () => {
    test("returns path when file exists in exact directory", () => {
        const subDir = mkDir("exact", "sub");
        const expected = mkFile("exact", "sub", "phpcs.xml");
        const result = findFiles(path.join(tmpRoot, "exact"), "sub", "phpcs.xml");
        assert.equal(result, expected);
    });

    test("returns null when file does not exist anywhere in tree", () => {
        mkDir("missing", "a", "b");
        const result = findFiles(path.join(tmpRoot, "missing"), path.join("a", "b"), "phpcs.xml");
        assert.equal(result, null);
    });

    test("walks up the directory tree to find file", () => {
        // Place the config at the root (parent), start searching from deep subdir
        const expected = mkFile("walkup", "phpcs.xml");
        mkDir("walkup", "a", "b", "c");
        const result = findFiles(path.join(tmpRoot, "walkup"), path.join("a", "b", "c"), "phpcs.xml");
        assert.equal(result, expected);
    });

    test("returns file in the deepest matching directory when multiple exist", () => {
        // File exists at root AND a sub-directory — deepest should win because
        // we search from deepest upward and return the first match.
        mkFile("multi", "phpcs.xml");
        const deeper = mkFile("multi", "src", "phpcs.xml");
        const result = findFiles(path.join(tmpRoot, "multi"), "src", "phpcs.xml");
        assert.equal(result, deeper);
    });

    test("accepts an array of file names and returns first match found", () => {
        mkDir("array", "sub");
        const expected = mkFile("array", "sub", ".phpcs.xml");
        const result = findFiles(
            path.join(tmpRoot, "array"),
            "sub",
            [".phpcs.xml", "phpcs.xml", "phpcs.xml.dist"]
        );
        assert.equal(result, expected);
    });

    test("stops at parent boundary — does not escape above parent", () => {
        // The parent is "boundary/inner". A file exists one level above (in tmpRoot)
        // but findFiles should NOT reach it.
        mkFile("boundary-file.xml");
        mkDir("boundary", "inner");
        const result = findFiles(
            path.join(tmpRoot, "boundary", "inner"),
            ".",
            "boundary-file.xml"
        );
        assert.equal(result, null);
    });

    test("handles a single-segment directory (file at root)", () => {
        const expected = mkFile("single", "phpcs.xml");
        const result = findFiles(path.join(tmpRoot, "single"), ".", "phpcs.xml");
        assert.equal(result, expected);
    });

    // Regression test: findFiles should never return a file above the `parent`
    // boundary, even when `directory` is a relative path (e.g. "..") that
    // resolves outside `parent`.  On unpatched code this test fails; it passes
    // once PR #94 ("fix: prevent findFiles from escaping parent") is merged.
    test(
        "does not escape parent when directory is a relative path above workspace root",
        { todo: "Known bug — fixed by PR #94; marks expected failure until merged" },
        () => {
            // Place a config file at tmpRoot level (above the workspace root).
            const aboveParent = mkFile("relative-escape-sentinel.xml");

            // workspace root is one level below tmpRoot
            mkDir("ws-escape");

            // directory = ".." resolves to tmpRoot, which is *above* parent
            const result = findFiles(
                path.join(tmpRoot, "ws-escape"), // parent (workspace root)
                "..",                             // resolves to tmpRoot — above parent
                "relative-escape-sentinel.xml"
            );

            // Must NOT escape above parent — should return null
            assert.equal(
                result,
                null,
                `findFiles escaped parent boundary and returned ${result}`
            );
        }
    );
});
