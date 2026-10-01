# Tasks

## 1. Application foundation and contract

- [x] 1.1 Create `capstone/bbq-logbook/` with local `AGENTS.md`, `README.md`,
  an application-local package manifest, and Windows-compatible documented
  validation and ten-minute recovery instructions; own the app root/package
  files and verify a clean dependency install and app-local check entry point
  without changing the root feedback-app manifest.
- [x] 1.2 Define the Cook Log contract and field validation in
  `capstone/bbq-logbook/src/shared/**` with focused tests in
  `capstone/bbq-logbook/tests/contracts/**`, including kilogram weights,
  positive cook time in minutes, 1–5 rating bounds, required values, and
  ordered collections; verify tests for valid, invalid, and boundary values.

## 2. API and persistence

- [x] 2.1 After task 1.2, implement the storage boundary, deterministic
  in-memory test implementation, and durable production adapter for the
  approved Azure target in `capstone/bbq-logbook/src/server/storage/**`;
  own focused tests in `capstone/bbq-logbook/tests/storage/**` and verify
  round trips preserve a complete Cook Log and ordering.
- [x] 2.2 After task 2.1, implement create/browse API operations, safe
  validation errors, and liveness/readiness in
  `capstone/bbq-logbook/src/server/api/**`; own
  `capstone/bbq-logbook/tests/api/**` and verify create/list, rejection
  without persistence, safe errors, and readiness failure for unavailable
  storage.

## 3. Accessible browser workflow

- [x] 3.1 After task 1.2, implement the browser workflow in
  `capstone/bbq-logbook/src/client/**` with tests in
  `capstone/bbq-logbook/tests/ui/**`; do not modify shared contracts or server
  paths. It may proceed in parallel with task group 2 against the approved
  contract, using an API test double until integration. Verify keyboard
  operation, labeled controls, ordered entries, loading/empty/success/
  validation/failure states, retry after service failure, and review of a
  saved complete log.

## 4. Independent capstone CI

- [x] 4.1 After task groups 2 and 3, add only
  `.github/workflows/bbq-cook-logbook-ci.yml` with read-only permissions and
  app-scoped path filters; verify workflow syntax, path-filter inclusion and
  exclusion, app-local checks, functional smoke coverage, and unchanged
  behavior of existing workshop workflows.

## 5. Azure infrastructure and protected deployment

- [ ] 5.1 After task 2.1, compose required resources with pinned AVM modules
  and least-privilege managed identity access in
  `capstone/bbq-logbook/infra/**`; verify Bicep build, deployment validation,
  and `what-if` against the assigned resource group and parameter file.
- [ ] 5.2 After task 5.1, add only
  `.github/workflows/bbq-cook-logbook-deploy.yml` using the protected
  environment and existing GitHub OIDC trust with required
  permissions, granting `id-token: write` only to the deployment job; verify
  workflow policy, absence of long-lived credentials, and that deployment is
  scoped to the assigned environment/resources.
- [ ] 5.3 After tasks 4 and 5.2, deploy the reviewed application and capture
  commit, URL, infrastructure result, liveness, readiness, and a
  create-and-review smoke result; verify saved data remains available after
  restart and retain independent platform receipts.

## 6. Ticket-driven defect remediation

- [ ] 6.1 After task 5.3, reproduce one realistic defect in the integrated or
  deployed application and file a bounded bug issue linked to parent issue #9
  and the relevant scenario; verify the issue records expected/actual
  behavior, reproduction evidence, owned/prohibited paths, and focused
  validation.
- [ ] 6.2 After task 6.1, fix the defect in a fresh isolated session and add
  the smallest regression test; verify the test fails before the fix, passes
  after it, and the linked pull request has independent passing checks.

## 7. Narrow GH-AW operational feedback

- [ ] 7.1 After task 6.2, create
  `.github/workflows/bbq-cook-logbook-evidence.md` and its generated lock file
  as a capstone-specific GH-AW that reads the real issue, pull request,
  checks, security, deployment, and defect evidence and produces
  exactly one evidence comment on the parent issue; verify the source compiles
  with its generated lock file, issue-comment permission is its only write
  authority, and it has no approval, merge, deployment, policy-bypass, or
  workflow-editing authority.
- [ ] 7.2 After task 7.1, run the workflow against the completed capstone
  evidence and retain
  the real run receipt and single safe output; verify missing evidence is
  reported honestly and no second output is produced.

## 8. Evidence reconstruction and recovery

- [ ] 8.1 After task 7.2, link the parent issue, approved OpenSpec artifacts,
  bounded task issues, pull requests, focused checks, deployment and smoke
  receipts, defect fix, and GH-AW output; verify a fresh reviewer can
  reconstruct the outcome without session transcripts.
- [ ] 8.2 Record any unavailable licensed control or cloud dependency in the
  linked issue/evidence and verify the recovery instructions from task 1.1
  resume a checkpoint at the last reviewed dependency without claiming missing
  platform evidence as passed.
