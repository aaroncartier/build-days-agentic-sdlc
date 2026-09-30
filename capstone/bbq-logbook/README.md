# BBQ Cook Logbook

This is an isolated capstone application for recording and reviewing one
self-contained BBQ cook attempt. The shared contract and its focused tests are
the initial foundation; API, browser, persistence, and deployment work are
separate tasks.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Install and validate on Windows

Open PowerShell in `capstone\bbq-logbook` and run:

```powershell
npm ci
npm run check
```

`npm run check` compiles the shared TypeScript contract and runs the
contract tests. To run only those tests after a build, use:

```powershell
npm test
```

The commands use only this application's package manifest and lock file; they
do not install or change dependencies for the root feedback application.

## Ten-minute recovery

If implementation work is interrupted, stop parallel work without deleting
branches, issues, or pull requests. Return to the last reviewed application
dependency with passing focused checks. Continue the single cook-log workflow
in isolated ownership areas, or work sequentially if ownership is unclear. If
Azure or a licensed GitHub control is unavailable, record the exact limitation
and retain local/CI evidence without describing it as successful deployment or
platform enforcement.
