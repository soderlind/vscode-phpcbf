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

    test("returns first matching name when multiple config files exist in same directory", () => {
        // When both .phpcs.xml and phpcs.xml exist, .phpcs.xml (first in the
        // names array) should be returned — matching PHPCS priority rules.
        mkFile("priority", "sub", ".phpcs.xml");
        mkFile("priority", "sub", "phpcs.xml");
        const result = findFiles(
            path.join(tmpRoot, "priority"),
            "sub",
            [".phpcs.xml", "phpcs.xml", "phpcs.xml.dist"]
        );
        assert.equal(result, path.join(tmpRoot, "priority", "sub", ".phpcs.xml"));
    });

    test("prefers file in deeper directory over ancestor when names overlap", () => {
        // Both the workspace root and a sub-directory contain phpcs.xml.
        // The deepest match should be returned because we search from deepest upward.
        mkFile("deeperwin", "phpcs.xml");                       // at root
        const deeper = mkFile("deeperwin", "a", "phpcs.xml");  // in sub-dir
        const result = findFiles(path.join(tmpRoot, "deeperwin"), "a", "phpcs.xml");
        assert.equal(result, deeper);
    });

    test("returns null for empty names array", () => {
        mkDir("emptynames", "sub");
        const result = findFiles(path.join(tmpRoot, "emptynames"), "sub", []);
        assert.equal(result, null);
    });
});
