---
name: Bug report
about: Something isn't working as expected
labels: bug, needs triage
---

## Describe the bug

A clear and concise description of what the bug is.

## Steps to reproduce

1. Go to '...'
2. Open a PHP file
3. Run the formatter / save
4. See error

## Expected behaviour

What you expected to happen.

## Actual behaviour

What actually happened (include any error messages from the VS Code output panel — enable `phpcbf.debug: true` to get more detail).

## Environment

- **OS**: (e.g. macOS 14, Ubuntu 22.04, Windows 11)
- **VS Code version**: (e.g. 1.87.0)
- **Extension version**: (e.g. 0.0.9)
- **phpcbf version**: (output of `phpcbf --version`)
- **phpcs version**: (output of `phpcs --version`)

## Configuration

Relevant settings from your `settings.json` (remove any secrets):

```json
{
    "phpcbf.executablePath": "...",
    "phpcbf.standard": "...",
    "phpcbf.onsave": false
}
```

## Additional context

Any other context about the problem (e.g. multi-root workspace, remote development, WSL, Docker).
