"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");

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

/**
 * Expand a leading `~` to the current user's home directory.
 *
 * @param {string} p - The path to expand.
 * @returns {string} The path with `~/` replaced by `<homedir>/`, or the
 *   original string unchanged if it does not start with `~`.
 */
function expandHomedir(p) {
    if (typeof p === "string" && p.startsWith("~")) {
        return p.replace(/^~\//, os.homedir() + "/");
    }
    return p;
}

/**
 * Substitute `${workspaceFolder}` and `${workspaceRoot}` tokens in `str`
 * with the supplied `rootPath`.
 *
 * @param {string} str      - The string that may contain variable tokens.
 * @param {string} rootPath - Absolute path to use as the workspace root.
 * @returns {string} The string with tokens replaced.
 */
function resolveVars(str, rootPath) {
    return str
        .replace("${workspaceFolder}", rootPath)
        .replace("${workspaceRoot}", rootPath);
}

module.exports = { findFiles, expandHomedir, resolveVars };
