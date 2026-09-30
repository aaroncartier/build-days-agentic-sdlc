# Proposal

## Why

New issues currently rely on a human to identify their type and urgency, spot
possible duplicates, request missing details, and route follow-up. A narrowly
triggered GH-AW can reduce that initial triage effort while keeping uncertain
decisions and ownership with maintainers.

This is a separate, repository-wide capability from the participant-authored
security-and-delivery workflow and capstone bug-triage exercise in
[`harden-workshop-lab-operations`](../harden-workshop-lab-operations/proposal.md);
it does not expand those approved workshop scopes implicitly. The initiating
request did not identify a GitHub issue number; this change is the reviewable
planning artifact for that request and follows the
[GH-AW creation guide](https://raw.githubusercontent.com/github/gh-aw/main/create.md).

## What Changes

- Add a GH-AW triggered only when a new issue is opened, with explicit
  read-only agent permissions and narrowly bounded safe outputs.
- Classify issue type and priority using a reviewable, controlled vocabulary;
  do not create or apply new classification labels until maintainers approve
  the vocabulary and the labels exist.
- Search for likely existing duplicates using read-only evidence and link the
  matching issue in a concise comment; never close, edit, or relabel another
  issue as a duplicate.
- Ask at most one focused clarifying question in a comment when required
  information is missing; do not comment when the issue is sufficiently clear.
- Suggest assignment only. Enable assignment writes only if approved
  repository or organization configuration supplies a bounded assignee map;
  otherwise never guess, invent handles, or assign anyone.
- Compile and validate the Markdown source and generated lock with the
  approved `gh aw` CLI/compiler. Lock generation is blocked until that tool is
  available and authorized; a lock file must never be hand-authored.

## Capabilities

### New Capabilities

- `new-issue-triage`: Evidence-grounded classification, duplicate detection,
  clarification, and suggestion-only routing for newly opened issues.

### Modified Capabilities

None. The existing `workshop-agentic-workflows` and `workshop-capstone`
requirements remain limited to their participant workshop exercises.

## Impact

- **Application and APIs:** No application code or public API changes.
- **Workflow and security:** Adds one GH-AW Markdown source and its
  compiler-generated lock after compiler availability is established; retains
  read-only agent permissions and uses only explicit safe outputs for any
  issue write.
- **Issue conventions:** Existing forms apply labels such as `feature`,
  `needs-openspec`, `security`, `implementation`, and `configuration`, but the
  repository has no approved type/priority vocabulary. The proposal recommends
  a controlled taxonomy for review; it does not authorize creating labels.
- **Assignment:** No `CODEOWNERS`, routing map, or team/member assignment
  configuration was found. Assignment remains suggestion-only unless such a
  map is approved and discoverable.
- **Validation:** Requires the repository-pinned GH-AW compiler validation
  pattern (or its documented equivalent), source/lock freshness inspection,
  OpenSpec validation, and `git --no-pager diff --check`. No GH-AW
  installation or fabricated lock is in scope for planning.
