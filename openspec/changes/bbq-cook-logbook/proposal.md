# Proposal

## Why

The optional Lab 6 capstone needs a concrete, time-boxed application outcome
that can be specified and reviewed before implementation. A BBQ cook logbook
lets a team capture what went into one cook attempt and assess its result
without expanding into recipe management or other product areas.

## What Changes

- Add a net-new BBQ Cook Logbook under `capstone/bbq-logbook/`, isolated from
  the workshop feedback application.
- Support one Cook Log per cook attempt, recording meat type, initial and
  trimmed weights in kilograms, seasonings, ordered preparation steps, ordered
  intermediate cook events and observations, total cook time, final
  observations, and separate 1–5 appearance, taste, and texture ratings.
- Support the primary workflow of creating and saving a cook log, then
  browsing and reviewing saved logs.
- Specify observable validation and accessible user feedback for the workflow.
- Meet the shared capstone delivery contract: API, durable persistence behind
  a storage boundary, liveness and dependency-aware readiness, focused tests,
  capstone-scoped CI/CD, protected GitHub OIDC deployment using pinned AVM
  composition, a ticket-driven defect fix, one narrowly safe GH-AW output, and
  transcript-free delivery evidence.
- Track the approved intent through the parent issue
  [#9](https://github.com/aaroncartier/build-days-agentic-sdlc/issues/9).

### Non-Goals

- Separate reusable recipes from cook attempts; each log is a self-contained
  snapshot of one attempt.
- Photos, social features, nutrition, inventory, analytics, or configurable
  recipe authoring.
- Changes to `src/`, the existing feedback application, or unrelated
  repository-wide delivery workflows.
- Shipping a completed BBQ application as part of the workshop starter.

## Capabilities

### New Capabilities

- `bbq-cook-logbook`: Record, save, browse, and review BBQ cook attempts with
  their preparation inputs and scored outcomes.

### Modified Capabilities

None. The active `workshop-capstone` requirement already defines the shared
capstone isolation and delivery obligations; this change adds the specific BBQ
product behavior without changing that workshop-wide contract.

## Impact

- **Application:** New application source and local guidance under
  `capstone/bbq-logbook/`; API behavior and user-visible log entry/review
  states.
- **Tests:** New focused contract, unit, API, accessible UI, persistence, and
  deployed smoke coverage for this capstone; existing feedback application
  tests remain unchanged.
- **Infrastructure and identity:** Capstone-local infrastructure where
  supported, using pinned AVM modules and the existing protected GitHub OIDC
  boundary; no long-lived credentials.
- **Workflows and security:** Capstone-specific CI/CD and narrowly scoped
  permissions; no changes to existing workshop workflow policy.
- **Operations and evidence:** Health/readiness and deployed functional
  evidence, a ticket-driven bug fix, exactly one safe GH-AW output, and a
  transcript-free evidence chain as required by `workshop-capstone`.
- **Documentation:** BBQ-specific operating and validation guidance linked to
  Lab 6 and the approved OpenSpec artifacts.
- **Dependencies:** No dependency changes are assumed; any necessary
  application-local dependency choice must be recorded in the design and
  validated against the 90–120 minute time box.
