# Design

## Context

See `proposal.md` for motivation and `specs/new-issue-triage/spec.md` for
observable behavior. The repository already has the read-only/manual
[`issue-clarifier`](../../../../.github/workflows/issue-clarifier.md)
reference and a `failed-test-explainer` reference with a generated lock.
Existing issue forms use workflow-specific labels, but there is no approved
type/priority label vocabulary or discoverable assignee/team routing map.
`.gitattributes` already marks `.github/workflows/*.lock.yml` as generated.

The user-requested scope is a standalone event-driven workflow, not a change to
the Lab 5 reference workflows or the capstone's participant-authored workflow
exercise in
[`harden-workshop-lab-operations`](../harden-workshop-lab-operations/proposal.md).

## Goals / Non-Goals

**Goals:**

- Run a single bounded analysis for the newly opened issue only.
- Keep issue content as untrusted evidence, never executable instructions.
- Make a possible duplicate, missing detail, classification, and routing
  recommendation traceable to repository evidence.
- Ensure every visible mutation is a fixed-target safe output with a strict
  per-run cap.
- Keep the workflow source and compiled lock reproducible.

**Non-Goals:**

- Create, rename, or provision labels, issue types, teams, users, or project
  fields.
- Close or mark an issue as duplicate, alter existing issues, change issue
  text, or run arbitrary commands from issue content.
- Assign anyone without an approved, discoverable category-to-handle map.
- Replace the existing manual `issue-clarifier` or either workshop reference.

## Decisions

### Trigger only on `issues: opened`

Use the issue-opened event alone, without schedules, manual dispatch, edit,
reopen, comment, or pull-request triggers. Since this is a reporter-facing
entrypoint, allow all issue reporters to trigger it; safety comes from
read-only analysis, fixed triggering-issue targets, output caps, and the
restricted safe-output surface rather than an author allowlist.

**Alternative considered:** Reuse or broaden the manual issue clarifier.
Rejected because it is an existing workshop reference and does not provide
automatic triage at issue creation.

### Read only the triggering issue and bounded issue context

Use the GitHub read proxy with issue and repository read access to inspect the
triggering issue, relevant templates, approved labels/mappings, and a bounded
search of existing issues. Do not grant the agent job write permissions,
external network access, secrets, or authority to execute commands sourced
from issue text. Do not interpolate issue data into shell commands.

Use at most three targeted searches and review no more than ten candidates
total. Compare the underlying problem, affected behavior, and reproduction
details. Similar wording alone is not evidence. A likely match is a linked
suggestion, not a duplicate resolution.

**Alternative considered:** Search all repository content or external
repositories. Rejected because this workflow needs only issue context and a
bounded in-repository search.

### Propose, then approve and provision a controlled label vocabulary

For maintainer review, use exactly one type label from `type:bug`,
`type:feature`, `type:documentation`, `type:question`, `type:security`, or
`type:configuration`, and one priority label from `priority:critical`,
`priority:high`, `priority:normal`, or `priority:low`. Suggested priority
meaning is critical = urgent, broad-impact outage or immediate risk; high =
time-sensitive or materially blocking; normal = ordinary actionable work;
low = non-urgent or minor. Maintainers must confirm, revise, or reject these
names and meanings before any label write is enabled.

Until that decision is recorded and the selected labels are present, report
classification as a suggestion only. Once approved, configure label safe
output with an explicit `allowed` list and a maximum of two additions, target
the triggering issue, and never create labels as a side effect. Use evidence
in the issue body, form fields, or direct repository context; abstain on
ambiguous or unsupported classifications.

**Alternative considered:** Reuse labels such as `feature`, `security`, or
`needs-openspec` as if they constituted a type/priority scheme. Rejected
because the existing form labels serve different purposes and contain no
priority vocabulary.

### Keep comments to one focused, fixed-target output

Permit at most one comment, always on the triggering issue. Use it only when
there is useful content: a focused clarifying question, evidence-backed
duplicate link, or suggestion-only routing note. When multiple points apply,
combine them into one concise comment and prioritize the question needed to
unblock triage. Do not post a comment solely to report a clean search. For
apparent sensitive vulnerability disclosures, avoid repeating the details and
point to the private reporting guidance already linked by the issue form.

**Alternative considered:** Separate comments for duplicate, clarification,
and assignment. Rejected because they fragment an automated response and
increase reporter attention cost.

### Keep assignment suggestion-only in the initial workflow

No routing map, CODEOWNERS file, or approved member/team mapping is present.
Therefore the initial workflow must not declare `assign-to-user` and must not
perform any assignment. It may give a cautious team/member suggestion only
when a grounded handle is discoverable in an approved repository or
organization mapping; otherwise state that a maintainer should route it.

If a map is later approved, enable a separate bounded assignment safe output
only after maintainers update the spec/design, and constrain its `allowed`
handles to the mapping. Do not clear or replace existing assignees.

**Alternative considered:** Infer a person from commits, CODEOWNERS-like
patterns, or an issue's mentioned names. Rejected because no approved routing
policy exists and those signals are not authorization to assign.

### Treat compiler availability as an implementation gate

Use the repository-pinned GH-AW compiler version (`v0.88.8`) and action SHA
documented in `.github/workflows/openspec.yml`. The user authorized compiler
installation when needed to generate and validate this lock. Install through
the GitHub CLI extension manager with the pinned version; do not execute a
remote installation script through a shell pipe, upgrade to `main`/`latest`,
or synthesize a lock. Generate the lock using the compiler, inspect resulting
permissions and safe-output jobs, and run the repository's documented
validation mode. Verify the existing `.gitattributes` generated-file marker;
change it only if absent.

**Alternative considered:** Hand-author a lock file from another workflow.
Rejected because generated GH-AW artifacts are compiler-versioned and
reproducibility/security cannot be established that way.

## Risks / Trade-offs

- **Untrusted issue text may contain prompt injection** → Treat issue content
  solely as data, do not execute it, preserve strict mode and platform threat
  defenses, and keep all agent permissions read-only.
- **False duplicate matches can frustrate reporters** → Require issue-level
  evidence and link candidates without closing or changing them.
- **Classification may be inconsistent before label policy is approved** →
  Keep labels suggestion-only until vocabulary and labels are reviewed and
  provisioned.
- **No assignee map prevents automatic assignment** → Intentionally preserve
  suggestion-only routing; a future approved map is a prerequisite for an
  assignment output.
- **GH-AW compiler is not currently installed** → The user authorized
  installing the repository-pinned version only as needed for compilation;
  use the GitHub CLI extension manager without remote shell piping.
- **Safe outputs need narrowly scoped write permissions** → Inspect the
  generated jobs to confirm only the triggering issue can receive one comment
  and approved label additions; omit assignment unless separately approved.

## Migration Plan

There is no application or data migration. After this proposal is approved,
maintainers must first approve the label names and meanings and provision the
selected labels. The initial implementation can remain suggestion-only if
that decision is pending. Implement assignment as suggestion-only unless an
approved, discoverable routing map is added and separately reflected in the
change artifacts.

Install the approved pinned compiler only if it is unavailable, compile and
validate the new source, and inspect the source and generated lock before
enabling the workflow. Rollback consists of disabling/removing only the new
workflow source and its generated lock; no issue state is automatically
reverted and existing workflows remain unchanged.

## Open Questions

- Which controlled type/priority label names and priority meanings should
  maintainers approve? The values in this design are recommendations only.
- Is there an approved organization-owned assignee map that can be made
  discoverable to this workflow? Until verified, assignment remains
  suggestion-only.
