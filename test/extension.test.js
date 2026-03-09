/* global suite, test, setup, teardown */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PHPCBF } = require('../extension');

// Helpers to create a temporary directory tree for testing.
function mkdirp(dir) {
    dir.split(path.sep).reduce((parent, child) => {
        const cur = path.join(parent, child);
        if (!fs.existsSync(cur)) {
            fs.mkdirSync(cur);
        }
        return cur;
    }, path.sep);
}

function rimraf(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (fs.lstatSync(full).isDirectory()) {
            rimraf(full);
        } else {
            fs.unlinkSync(full);
        }
    }
    fs.rmdirSync(dir);
}

suite("PHPCBF.findFiles", function () {
    let tmpRoot;
    let phpcbf;

    setup(function () {
        tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-phpcbf-test-'));
        phpcbf = new PHPCBF();
    });

    teardown(function () {
        rimraf(tmpRoot);
    });

    test("finds config file in the same directory as the PHP file", function () {
        const configPath = path.join(tmpRoot, 'phpcs.xml');
        fs.writeFileSync(configPath, '<ruleset/>');

        const result = phpcbf.findFiles(tmpRoot, '', ['phpcs.xml']);
        assert.strictEqual(result, configPath);
    });

    test("finds config file in a parent directory (walks up)", function () {
        const subDir = path.join(tmpRoot, 'src', 'controllers');
        mkdirp(subDir);
        const configPath = path.join(tmpRoot, 'phpcs.xml');
        fs.writeFileSync(configPath, '<ruleset/>');

        const result = phpcbf.findFiles(tmpRoot, path.join('src', 'controllers'), ['phpcs.xml']);
        assert.strictEqual(result, configPath);
    });

    test("returns null when no config file exists anywhere", function () {
        const subDir = path.join(tmpRoot, 'src');
        mkdirp(subDir);

        const result = phpcbf.findFiles(tmpRoot, 'src', ['phpcs.xml', '.phpcs.xml']);
        assert.strictEqual(result, null);
    });

    test("returns the first matching file when multiple names are provided", function () {
        const xmlPath = path.join(tmpRoot, 'phpcs.xml');
        const rulesetPath = path.join(tmpRoot, 'ruleset.xml');
        fs.writeFileSync(xmlPath, '<ruleset/>');
        fs.writeFileSync(rulesetPath, '<ruleset/>');

        // phpcs.xml comes after ruleset.xml in the names array — ruleset.xml should win
        const result = phpcbf.findFiles(tmpRoot, '', ['ruleset.xml', 'phpcs.xml']);
        assert.strictEqual(result, rulesetPath);
    });

    test("prefers a closer (deeper) config file over a parent one", function () {
        const subDir = path.join(tmpRoot, 'src');
        mkdirp(subDir);
        const parentConfig = path.join(tmpRoot, 'phpcs.xml');
        const childConfig = path.join(subDir, 'phpcs.xml');
        fs.writeFileSync(parentConfig, '<ruleset name="parent"/>');
        fs.writeFileSync(childConfig, '<ruleset name="child"/>');

        const result = phpcbf.findFiles(tmpRoot, 'src', ['phpcs.xml']);
        assert.strictEqual(result, childConfig);
    });

    test("does not search above the workspace root", function () {
        // Place a config outside tmpRoot — it must NOT be found.
        const outside = path.join(os.tmpdir(), 'phpcs.xml');
        let createdOutside = false;
        if (!fs.existsSync(outside)) {
            fs.writeFileSync(outside, '<ruleset/>');
            createdOutside = true;
        }
        try {
            const result = phpcbf.findFiles(tmpRoot, '', ['phpcs.xml']);
            assert.strictEqual(result, null);
        } finally {
            if (createdOutside) {
                fs.unlinkSync(outside);
            }
        }
    });
});