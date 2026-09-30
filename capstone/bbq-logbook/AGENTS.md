# BBQ Cook Logbook agent guide

This application is isolated under `capstone/bbq-logbook/`. Read the approved
change at `../../openspec/changes/bbq-cook-logbook/` before implementation.

## Boundaries

- Keep application code, tests, package files, and local configuration in this
  subtree.
- Do not change the root feedback application, root manifests, shared
  workflows, or infrastructure outside this application.
- Keep shared contracts independent of UI, API, storage, and cloud libraries.
- Implement one complete cook attempt with ordered preparation steps and cook
  events; do not add recipe-management features.

## Validation and recovery

- Use Windows PowerShell from this directory: `npm ci`, then `npm run check`.
- Keep focused checks under two minutes and add tests for each changed
  contract requirement.
- For ten-minute recovery, stop parallel work without deleting branches,
  issues, or pull requests; return to the last reviewed dependency with passing
  focused checks. Resume from that checkpoint, and record unavailable cloud or
  licensed controls without claiming their evidence passed.
