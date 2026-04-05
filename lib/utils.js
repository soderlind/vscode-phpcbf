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
 * Find the minimal character offsets of the changed region between two strings.
 *
 * @param {string} originalText
 * @param {string} formattedText
 * @returns {{ start: number, origEnd: number, fmtEnd: number } | null}
 *   The changed region, or null if the strings are identical.
 *   - start:   first offset where the strings differ
 *   - origEnd: exclusive end offset in originalText
 *   - fmtEnd:  exclusive end offset in formattedText
 */
function diffRegion(originalText, formattedText) {
    if (originalText === formattedText) {
        return null;
    }

    // Find first differing character
    let start = 0;
    const minLen = Math.min(originalText.length, formattedText.length);
    while (start < minLen && originalText[start] === formattedText[start]) {
        start++;
    }

    // Find last differing character (scan backwards from both ends)
    let origEnd = originalText.length;
    let fmtEnd   = formattedText.length;
    while (origEnd > start && fmtEnd > start &&
           originalText[origEnd - 1] === formattedText[fmtEnd - 1]) {
        origEnd--;
        fmtEnd--;
    }

    return { start, origEnd, fmtEnd };
}

module.exports = { findFiles, diffRegion };
