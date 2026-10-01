# BBQ Cook Logbook

This is an isolated capstone application for recording and reviewing one
self-contained BBQ cook attempt. It includes a browser client, HTTP API, and
storage boundary with an explicit in-memory local backend and Azure Table
production backend.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Install and validate on Windows

Open PowerShell in `capstone\bbq-logbook` and run:

```powershell
npm ci
npm run check
```

`npm run check` compiles the TypeScript server modules, copies the browser
assets into `dist/client`, and runs the focused tests. To start the app locally
with deterministic in-memory storage, run:

```powershell
$env:STORAGE_BACKEND = 'memory'
npm start
```

The server listens on `http://localhost:8080` by default. To run the built
application's HTTP smoke checks (including static assets, health/readiness,
invalid input, and Cook Log create/browse), use:

```powershell
npm run smoke
```

To run only the unit and API tests after a build, use:

```powershell
npm test
```

Production startup requires `STORAGE_BACKEND=azure` and the App Service
managed-identity and `BBQ_TABLE_*` environment provided by the approved
infrastructure. The app does not silently fall back to in-memory storage.

These commands use only this application's package manifest and lock file;
they do not install or change dependencies for the root feedback application.

## Ten-minute recovery

If implementation work is interrupted, stop parallel work without deleting
branches, issues, or pull requests. Return to the last reviewed application
dependency with passing focused checks. Continue the single cook-log workflow
in isolated ownership areas, or work sequentially if ownership is unclear. If
Azure or a licensed GitHub control is unavailable, record the exact limitation
and retain local/CI evidence without describing it as successful deployment or
platform enforcement.
