# Spec Delta

## Purpose

Provides evidence-grounded, bounded first-pass triage for newly opened
repository issues while preserving maintainer control over uncertain
classification, duplicate resolution, and ownership.

## ADDED Requirements

### Requirement: Triage only newly opened issues

The triage workflow SHALL run only for newly opened issues and SHALL treat
issue titles, bodies, and linked content as untrusted data, not as instructions
that can change workflow policy or authorize other actions.

#### Scenario: A new issue is opened

- **WHEN** an issue is opened in the repository
- **THEN** the workflow evaluates only that triggering issue and does not edit
  repository files, execute issue-provided commands, or act on pull requests

#### Scenario: An issue is edited or reopened

- **WHEN** an existing issue is edited or reopened
- **THEN** this workflow does not run for that event

### Requirement: Classify type and priority using approved labels

The workflow SHALL classify the triggering issue's type and priority from its
description and available repository context. It SHALL add labels only from a
maintainer-approved controlled vocabulary that already exists in the
repository. It SHALL NOT create labels, use unapproved labels, or claim that a
label was applied when it was not.

The proposed vocabulary for maintainer review is one type label from
`type:bug`, `type:feature`, `type:documentation`, `type:question`,
`type:security`, or `type:configuration`, and one priority label from
`priority:critical`, `priority:high`, `priority:normal`, or `priority:low`.
This vocabulary is a proposal, not an approved repository policy; it MUST be
confirmed or replaced and the selected labels provisioned before label writes
are enabled.

#### Scenario: Approved classification labels exist

- **WHEN** issue evidence supports a type and priority and both approved
  labels exist
- **THEN** the workflow adds only the matching type and priority labels to
  the triggering issue

#### Scenario: Vocabulary or label is not approved or unavailable

- **WHEN** the controlled vocabulary has not been approved or a selected
  label is absent
- **THEN** the workflow does not create or apply a substitute label and
  reports the classification as a suggestion without claiming a label write

#### Scenario: Classification evidence is insufficient

- **WHEN** the issue does not support a confident type or priority
- **THEN** the workflow leaves the uncertain classification unapplied and
  identifies the uncertainty for maintainer review

### Requirement: Identify likely duplicates with search evidence only

The workflow SHALL search existing issues for materially similar reports
using no more than three targeted searches and ten candidates per run. It SHALL
describe a possible duplicate only when it can cite concrete evidence from
the existing issue. It SHALL NOT close, edit, relabel, or mark any issue as a
duplicate.

#### Scenario: A likely duplicate is found

- **WHEN** an existing issue describes the same underlying problem or request
  with supporting details
- **THEN** the workflow may include a direct link and concise evidence in its
  single allowed comment on the triggering issue, while leaving both issues
  unchanged

#### Scenario: No convincing duplicate evidence is found

- **WHEN** search results are absent or only superficially similar
- **THEN** the workflow does not assert a duplicate and does not comment solely
  to report an empty search

### Requirement: Ask bounded clarifying questions

The workflow SHALL ask a focused question only when missing information
materially prevents useful triage. It SHALL post at most one comment on the
triggering issue per run and SHALL not ask for information already supplied.

#### Scenario: Missing information blocks triage

- **WHEN** a specific missing fact prevents a reliable classification or
  actionable understanding
- **THEN** the workflow may post one concise comment containing a focused
  question for that fact

#### Scenario: Issue is clear enough to triage

- **WHEN** the issue contains sufficient information for a useful first-pass
  classification
- **THEN** the workflow does not post a clarifying question

#### Scenario: Sensitive security details appear in a public issue

- **WHEN** the issue appears to disclose sensitive vulnerability details
- **THEN** the workflow does not repeat those details and directs the reporter
  to the repository's private vulnerability reporting guidance

### Requirement: Route ownership conservatively

The workflow SHALL provide assignment suggestions only unless an approved,
discoverable repository or organization mapping explicitly maps issue
categories to valid team or user handles. When such a mapping exists, any
assignment write SHALL be restricted to its mapped handles; the workflow SHALL
never guess or invent a person or team.

#### Scenario: No approved assignment map exists

- **WHEN** no approved, discoverable ownership mapping is available
- **THEN** the workflow makes no assignment write and may state that routing
  remains a maintainer decision

#### Scenario: An approved assignment map exists

- **WHEN** a category matches an entry in an approved mapping
- **THEN** any enabled assignment action targets only the exact mapped handle
  and does not replace existing assignees without explicit approved policy

#### Scenario: No mapping matches the issue

- **WHEN** an issue cannot be matched to an approved mapping
- **THEN** the workflow leaves it unassigned and does not infer ownership

### Requirement: Keep issue writes narrow and attributable

The workflow SHALL keep its agent job read-only and SHALL route any visible
comment, label addition, or explicitly approved assignment through the
corresponding bounded safe output. It SHALL target only the triggering issue,
cap each output, and produce no visible write when no condition warrants one.

#### Scenario: Triage finds no actionable change

- **WHEN** the issue is clear, has no evidence-backed duplicate, and has no
  approved label or assignment action to apply
- **THEN** the workflow performs no visible write

#### Scenario: A safe output fails or is unavailable

- **WHEN** a proposed comment, label, or mapped assignment cannot be performed
- **THEN** the workflow reports the limitation accurately and does not claim
  success or attempt a direct GitHub write

#### Scenario: Workflow permissions are reviewed

- **WHEN** the workflow is compiled for execution
- **THEN** the agent job has no GitHub write permissions and the generated
  safe-output jobs grant only the scopes required for explicitly enabled
  operations
