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

const { findFiles, diffRegion } = require("../lib/utils");

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
});

// ---------------------------------------------------------------------------
// diffRegion
// ---------------------------------------------------------------------------

describe("diffRegion", () => {
    test("returns null for identical strings", () => {
        assert.equal(diffRegion("hello\nworld\n", "hello\nworld\n"), null);
    });

    test("returns null for two empty strings", () => {
        assert.equal(diffRegion("", ""), null);
    });

    test("covers a single-character change in the middle", () => {
        const orig = "hello world";
        const fmt  = "hello World";
        const r = diffRegion(orig, fmt);
        assert.ok(r, "expected a region");
        assert.equal(r.start, 6);           // 'W' vs 'w'
        assert.equal(r.origEnd, 7);
        assert.equal(r.fmtEnd,  7);
        assert.equal(orig.slice(r.start, r.origEnd), "w");
        assert.equal(fmt.slice(r.start, r.fmtEnd),   "W");
    });

    test("covers a change at the very beginning", () => {
        const orig = "abc";
        const fmt  = "Abc";
        const r = diffRegion(orig, fmt);
        assert.ok(r);
        assert.equal(r.start,   0);
        assert.equal(r.origEnd, 1);
        assert.equal(r.fmtEnd,  1);
    });

    test("covers a change at the very end", () => {
        const orig = "abcX";
        const fmt  = "abcY";
        const r = diffRegion(orig, fmt);
        assert.ok(r);
        assert.equal(r.start,   3);
        assert.equal(r.origEnd, 4);
        assert.equal(r.fmtEnd,  4);
    });

    test("handles inserted characters (formatted is longer)", () => {
        const orig = "line1\nline3\n";
        const fmt  = "line1\nline2\nline3\n";
        const r = diffRegion(orig, fmt);
        assert.ok(r, "expected a region");
        // Applying the region must reproduce fmt exactly
        assert.equal(
            orig.slice(0, r.start) + fmt.slice(r.start, r.fmtEnd) + orig.slice(r.origEnd),
            fmt
        );
        // The region must not include any unchanged prefix (start > 0 because "line1\nline" matches)
        assert.ok(r.start > 0, "shared prefix should be excluded from region");
    });

    test("handles deleted characters (formatted is shorter)", () => {
        const orig = "line1\nline2\nline3\n";
        const fmt  = "line1\nline3\n";
        const r = diffRegion(orig, fmt);
        assert.ok(r, "expected a region");
        assert.equal(
            orig.slice(0, r.start) + fmt.slice(r.start, r.fmtEnd) + orig.slice(r.origEnd),
            fmt
        );
        assert.ok(r.start > 0, "shared prefix should be excluded from region");
    });

    test("the replacement is minimal — unchanged suffix is excluded", () => {
        const orig = "<?php\n$x = 1;\n$y = 2;\n";
        const fmt  = "<?php\n$x=1;\n$y = 2;\n";
        const r = diffRegion(orig, fmt);
        assert.ok(r);
        // The shared suffix "$y = 2;\n" must NOT be inside the region
        assert.ok(r.origEnd <= orig.indexOf("$y"), "suffix should be outside region");
    });
});

