# Design

## Context

See `proposal.md` for the motivation and `specs/bbq-cook-logbook/spec.md` for
the observable behavior. Root `DESIGN.md` establishes inward dependency
direction, shared contracts independent of UI/API/cloud details, and the
existing TypeScript browser/API application as an architectural reference.
`capstone/AGENTS.md` requires a net-new app under its own subtree, an explicit
storage boundary, accessible UI states, liveness and dependency-aware
readiness, pinned AVM composition, GitHub OIDC, and narrow workflow
permissions. The active `workshop-capstone` requirement also governs CI/CD,
defect remediation, GH-AW, and evidence reconstruction.

The repository's root CI currently selects the feedback application's paths;
the capstone must therefore provide its own identifiable validation path
without changing that application's source or broadening unrelated workflows.

## Goals / Non-Goals

**Goals:**

- Keep the product contract centered on one self-contained Cook Log and one
  create/save then browse/review workflow.
- Preserve the approved fields, units, ordering, validation boundaries, and
  accessible behavior across browser, API, and persistence boundaries.
- Make the application independently testable and deployable within the
  existing capstone governance and trust boundaries.
- Keep technical choices proportional to the 90–120 minute capstone and avoid
  new dependencies unless implementation demonstrates a concrete need.

**Non-Goals:**

- Introduce a new repository-wide application, storage, or deployment pattern.
- Define a framework, API protocol, storage vendor, Azure topology, or UI
  component structure in the product contract.
- Change root `DESIGN.md`, the feedback application, or existing shared
  workflow behavior.

## Decisions

### Keep one cook attempt as the aggregate boundary

Represent a cook attempt as one Cook Log with ordered preparation steps and
ordered cook events contained within that record. Store the three ratings as
separate values, and preserve kilograms and minutes as explicit units at the
application boundary. Validation applies to the complete record before it is
saved.

This keeps the captured preparation and result together and makes the required
workflow understandable without introducing recipe identity, cross-record
relationships, or multi-step transactions. A reusable Recipe entity linked to
multiple cooks was considered and rejected as outside the agreed minimum.

### Separate interaction, API, and durable storage responsibilities

The browser interaction, application API, and persistence implementation
remain separate responsibilities. The API accepts a complete Cook Log and
returns the saved record; browsing retrieves complete saved records. A
storage boundary isolates the API from persistence details. Tests use a
deterministic in-memory implementation, while deployment uses a durable
implementation compatible with the team's approved Azure target.

This follows the dependency direction and storage-boundary pattern already
documented in root `DESIGN.md` and `capstone/AGENTS.md` without copying or
modifying the feedback application's implementation. A direct UI-to-storage
connection was rejected because it would bypass API validation and prevent
independent service tests. The specific framework, wire protocol, and storage
technology remain implementation choices because they do not alter the
observable contract.

### Validate at both user and service boundaries

The browser gives prompt, accessible field feedback, and the API independently
rejects invalid or incomplete submissions before persistence. Repeated fields
retain user-entered order. A failed create does not appear in later browse
results. Liveness reflects process responsiveness; readiness also verifies
that required durable storage can serve the application.

Client-only validation was rejected because API callers could bypass it.
Implementation-specific form and schema libraries are not mandated.

### Isolate capstone delivery assets and authority

Keep app source, tests, local instructions, and infrastructure in
`capstone/bbq-logbook/` wherever their owning tools permit. Use root-level
workflow locations only where GitHub requires them, with capstone-specific
names and least privilege. Use pinned AVM modules and the existing protected
GitHub OIDC boundary; do not introduce long-lived cloud credentials or change
shared policy. The required GH-AW has exactly one narrow safe output and no
approval, merge, deployment, policy-bypass, or workflow-editing authority.

This preserves independent review and avoids the shared application workflow
path. Copying or rebranding the feedback app, adding broad root workflow
triggers, or granting the GH-AW protected delivery permissions were rejected.

### Map verification to the behavior and delivery contract

Focused tests cover Cook Log validation, ordering, API create/browse behavior,
accessible UI states, and persistence across application restart. A capstone
CI path runs the app's documented checks and smoke-tests liveness, readiness,
and the functional log workflow over the built application's HTTP server. The
server uses Node's built-in HTTP modules to serve the browser assets and route
requests to the existing API/storage boundary; it adds no runtime dependency.
The build copies the browser assets into the deployable output. Local smoke
tests explicitly select in-memory storage, while production selects the
configured Azure Table adapter and reports storage failure through readiness.

The capstone deployment workflow reuses the existing protected `workshop`
environment and OIDC variables, verifies a merged BBQ pull request and its
required checks, then performs Azure validation and `what-if` before deploying
the built app. Its deploy job alone receives `id-token: write`. Job summaries
and retained artifacts report commit, test, infrastructure, and live results
only after each corresponding check succeeds. Missing environment values or
protection remain blockers; the workflow must not substitute credentials,
resource scope, or deployment success.

Delivery evidence must also show the reviewed commit, protected deployment,
the real issue-driven defect fix, and the single GH-AW output, linked so a
reviewer can reconstruct the result without session transcripts.

Agent reports alone were rejected as evidence; this matches root
`DESIGN.md`'s requirement for independently observable checks and deployment
receipts.

### No durable architecture update is required

The work applies existing repository boundaries and delivery decisions. It
does not establish a repository-wide rule or alter a system boundary, so it
does not require an update to root `DESIGN.md` or a new architecture decision
record.

## Risks / Trade-offs

- [Risk] The 90–120 minute window can be exceeded by infrastructure,
  workflow, and GH-AW work in addition to the product workflow. → Keep the
  product to one aggregate and one primary workflow; implement only required
  delivery evidence and defer stretch features.
- [Risk] A persistence or storage outage could make saved logs unavailable. →
  Make readiness dependency-aware, report safe errors, and verify durable
  retrieval after restart before deployment is considered complete.
- [Risk] UI/API validation rules could diverge. → Keep the same field
  constraints observable at both boundaries and test both valid and rejected
  submissions.
- [Risk] Licensed GitHub controls or the assigned Azure environment may be
  unavailable. → Record the exact limitation and use the documented fallback
  without claiming equivalent platform or deployment evidence.
- [Risk] A capstone CI trigger could be too broad or could miss app changes.
  → Scope path filters to the app and explicitly named required platform
  files, then verify both inclusion and exclusion behavior.

## Validation

- Run the focused contract, API, storage, and accessible UI tests, followed by
  the app-local `npm run check` and `npm run smoke` from
  `capstone/bbq-logbook/`. Smoke must start the production HTTP entry point and
  verify browser assets, health, readiness, invalid-input rejection, and the
  create/browse flow; verify the not-ready HTTP response with unavailable
  storage.
- Build and validate the capstone Bicep entry point, then run Azure
  `what-if` against the assigned resource group and parameter file before
  deployment.
- After protected deployment, verify the deployed commit, liveness,
  dependency-aware readiness, create-and-review behavior, and record
  persistence across application restart from independent workflow receipts.
- Compile the GH-AW source with its generated lock file and inspect its actual
  run and single issue-comment output.
- Validate these planning artifacts with
  `openspec validate bbq-cook-logbook --strict`.

## Migration Plan

This is a net-new application and has no existing user data to migrate. Deploy
only after its focused CI, infrastructure validation, and protected
environment checks pass. Rollback is limited to reverting or disabling
capstone-specific delivery assets and, when explicitly approved, removing
resources within the assigned capstone scope. Do not alter the feedback
application, shared governance workflows, participant history, or unrelated
Azure resources.

The exact environment-specific region, resource names, and compatible pinned
AVM versions can be set when the team's approved Azure scope is known; these
parameters do not change the product behavior or isolation approach.

## Recovery

Time-box recovery to ten minutes. Stop parallel work without deleting issues,
branches, or pull requests, and return to the last reviewed application
dependency with passing focused checks. Reduce incomplete work to the one
Cook Log create/save and browse/review workflow, then continue in isolated,
non-overlapping sessions or sequentially if ownership is unclear. If Azure or
a licensed GitHub control is unavailable, record the exact limitation and
retain local/CI evidence without describing it as a successful deployment or
platform control. Resume from a reviewed checkpoint and create follow-up
issues for missing delivery receipts rather than rewriting participant
history.
