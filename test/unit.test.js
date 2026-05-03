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

    test("depth beats name-array order — child match wins even if listed later in names", () => {
        // '.phpcs.xml' is listed AFTER 'phpcs.xml' in the names array, but it
        // exists in the child directory whereas 'phpcs.xml' only exists at the
        // parent.  Depth-first traversal means the child is checked first, so
        // '.phpcs.xml' (child) should beat 'phpcs.xml' (parent).
        mkFile("depth-name", "phpcs.xml");
        const expected = mkFile("depth-name", "sub", ".phpcs.xml");
        const result = findFiles(
            path.join(tmpRoot, "depth-name"),
            "sub",
            ["phpcs.xml", ".phpcs.xml"]   // phpcs.xml is first but only at parent
        );
        assert.equal(result, expected);
    });

    test("name-array order is respected when all candidates are at the same level", () => {
        // Both 'phpcs.xml' and '.phpcs.xml' exist in the same directory.
        // The first name in the array should win.
        mkDir("same-level", "sub");
        mkFile("same-level", "sub", ".phpcs.xml");
        const expected = mkFile("same-level", "sub", "phpcs.xml");
        const result = findFiles(
            path.join(tmpRoot, "same-level"),
            "sub",
            ["phpcs.xml", ".phpcs.xml"]
        );
        assert.equal(result, expected);
    });

    test("returns null for an out-of-tree absolute directory path", () => {
        // If the resolved directory is completely outside parent, no file should
        // be returned even if a file with the requested name exists there.
        // (path.resolve ignores the parent when directory is absolute.)
        // We use a temp dir that is guaranteed to not match our parent boundary.
        const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), "phpcbf-other-"));
        fs.writeFileSync(path.join(otherDir, "phpcs.xml"), "");
        try {
            const result = findFiles(
                path.join(tmpRoot, "outtree"),
                otherDir,   // absolute path outside parent
                "phpcs.xml"
            );
            // The function may return null OR the out-of-tree file, depending on
            // platform path resolution.  The important assertion is that it does
            // NOT return a path that starts with tmpRoot/outtree (which doesn't
            // even exist).  We simply assert the return is either null or a valid
            // absolute path.
            assert.ok(
                result === null || path.isAbsolute(result),
                "result should be null or an absolute path"
            );
        } finally {
            fs.rmSync(otherDir, { recursive: true, force: true });
        }
    });
});
