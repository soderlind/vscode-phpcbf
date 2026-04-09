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
 * Resolve variable substitutions and relative paths in a path string.
 *
 * Handles (in order):
 *   - `~` expansion to the home directory
 *   - `${workspaceFolder}` and `${workspaceRoot}` substitution
 *   - Relative paths resolved against `rootPath` (when supplied)
 *
 * @param {string} inputPath - Path string to resolve.
 * @param {string|null} [rootPath] - Workspace root directory; required for
 *   variable substitution and relative path resolution.
 * @returns {string} The resolved path.
 */
function resolveWorkspacePath(inputPath, rootPath) {
    if (!inputPath) return inputPath;
    let resolved = inputPath;

    // Expand ~ to home directory.
    if (resolved.startsWith("~/") || resolved === "~") {
        resolved = resolved.replace(/^~(?=\/|$)/, os.homedir());
    }

    if (rootPath) {
        // Substitute ${workspaceFolder} and ${workspaceRoot}.
        resolved = resolved
            .replace(/\$\{workspaceFolder\}/g, rootPath)
            .replace(/\$\{workspaceRoot\}/g, rootPath);

        // Resolve relative paths against the workspace root.
        if (!path.isAbsolute(resolved)) {
            resolved = path.resolve(rootPath, resolved);
        }
    }

    return resolved;
}

module.exports = { findFiles, resolveWorkspacePath };
