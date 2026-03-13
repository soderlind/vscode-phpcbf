"use strict";
const path = require("path");
const fs = require("fs");

/**
 * Walk up the directory tree from `parent/directory` looking for any file
 * whose name matches one of the entries in `name`.  Stops at `parent`.
 *
 * @param {string} parent      - Root of the workspace (walk stops here).
 * @param {string} directory   - Relative directory to start from.
 * @param {string|string[]} name - File name(s) to look for.
 * @returns {string|null} Absolute path to the first matching file, or null.
 */
function findFiles(parent, directory, name) {
    const names = [].concat(name);
    // Normalise parent so that trailing slashes or redundant segments (e.g.
    // "/workspace/") don't cause the boundary comparison to miss.
    const resolvedParent = path.resolve(parent);
    const chunks = path.resolve(resolvedParent, directory).split(path.sep);

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
