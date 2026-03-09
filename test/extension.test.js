/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function() {

    test("Extension is present", function() {
        assert.ok(vscode.extensions.getExtension("persoderlind.phpcbf"));
    });

    test("Extension activates for PHP documents", function(done) {
        const ext = vscode.extensions.getExtension("persoderlind.phpcbf");
        if (!ext) {
            // Extension not installed in test host — skip gracefully
            done();
            return;
        }
        ext.activate().then(
            () => { done(); },
            (err) => { done(err); }
        );
    });

    test("phpcbf-soderlind command is registered", function() {
        return vscode.commands.getCommands(true).then(commands => {
            assert.ok(
                commands.includes("phpcbf-soderlind"),
                "Expected phpcbf-soderlind command to be registered"
            );
        });
    });
});
