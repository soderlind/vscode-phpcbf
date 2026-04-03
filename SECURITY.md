# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.9   | ✅ Current release |
| < 0.0.9 | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability in this extension, please report it responsibly by opening a [GitHub issue](https://github.com/soderlind/vscode-phpcbf/issues/new) with the title prefixed `[Security]`. For particularly sensitive vulnerabilities you can instead contact the maintainer directly via GitHub.

We aim to acknowledge reports within **3 business days** and provide a fix or mitigation within **30 days** for confirmed vulnerabilities.

## Security Model

This extension spawns the external `phpcbf` binary as a child process to format PHP files. Its security properties:

- **Process spawning**: The executable path is taken from the VS Code setting `phpcbf.executablePath`. Only the maintainer/administrator who controls workspace settings can alter this path. An attacker who can write to your workspace's `.vscode/settings.json` can point `executablePath` at an arbitrary executable — treat that file accordingly.

- **Temporary files**: The extension writes each formatted document to a randomly-named temp file (in `os.tmpdir()`), runs phpcbf on it, reads the result back, and immediately deletes the temp file. No file content is sent over a network.

- **No network access**: The extension itself makes no outbound network connections. All processing is local.

- **Standard path**: The `phpcbf.standard` and `phpcbf.configSearch` settings control which coding standard phpcbf uses. A malicious `phpcs.xml` file in the workspace could potentially influence phpcbf's behaviour; the same caution applies as with any project-level tool configuration.

In summary, the extension's attack surface is limited to local files and process execution; it has no credentials, no secrets, and no network communication of its own.
