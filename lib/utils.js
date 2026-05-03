"use strict";
const path = require("path");
const fs = require("fs");

/**
 * Walk up the directory tree from `parent/directory` looking for any file
 * whose name matches one of the entries in `name`.  Stops at `parent`.
 *
 * @param {string} parent      - Root of the workspace (walk stops here).
 * @param {string} directory   - Relative directory to start from (must be within parent).
 * @param {string|string[]} name - File name(s) to look for.
 * @returns {string|null} Absolute path to the first matching file, or null.
 */
function findFiles(parent, directory, name) {
    const names = [].concat(name);
    const resolvedParent = path.resolve(parent);
    const resolvedStart = path.resolve(parent, directory);

    // Guard: if the resolved start path is outside parent (e.g. cross-drive path
    // on Windows produced by path.relative between different drives), there is
    // nothing to find within the workspace boundary — return null immediately.
    if (resolvedStart !== resolvedParent &&
        !resolvedStart.startsWith(resolvedParent + path.sep)) {
        return null;
    }

    const chunks = resolvedStart.split(path.sep);

    while (chunks.length) {
        let currentDir = chunks.join(path.sep);
        for (const fileName of names) {
            const filePath = path.join(currentDir, fileName);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }
        if (resolvedParent === currentDir) {
            break;
        }
        chunks.pop();
    }

    return null;
}

module.exports = { findFiles };
