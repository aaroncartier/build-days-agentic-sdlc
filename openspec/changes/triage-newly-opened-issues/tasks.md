# Tasks

## 1. Confirm triage policy prerequisites

- [x] 1.1 Confirm or revise the proposed type and priority vocabulary and
  meanings; verify selected labels already exist before enabling label writes,
  otherwise keep classification suggestion-only. The current repository has
  no approved type/priority vocabulary and lacks the proposed labels, so
  classification remains suggestion-only with no label safe output.
- [x] 1.2 Verify whether an approved repository or organization assignment map
  exists; with the currently observed absence, keep assignment suggestion-only
  and omit assignment safe outputs. If a map is introduced, update and review
  this change before enabling assignment. The inspected repository contains no
  CODEOWNERS or routing map; no assignment safe output will be added.

## 2. Create the bounded GH-AW source

- [x] 2.1 Add `.github/workflows/new-issue-triage.md` with only the
  `issues: opened` trigger, read-only agent permissions, bounded in-repository
  issue search, and untrusted-content protections; verify it cannot execute
  issue-provided instructions or act on other issues.
- [x] 2.2 Configure at most one comment targeting only the triggering issue
  for a focused question, evidence-backed duplicate link, or approved
  suggestion-only routing; verify clear issues and empty duplicate searches
  produce no comment.
- [x] 2.3 If and only if the controlled vocabulary and labels are approved and
  provisioned, configure label addition for only the approved labels, at most
  one type and one priority label, targeting only the triggering issue;
  otherwise verify labels remain suggestion-only. Keep assignment suggestion-
  only unless a later approved map and reviewed spec change authorize a bounded
  assignment output.

## 3. Generate and inspect the compiled workflow

- [x] 3.1 Confirm the approved `gh aw` compiler is available at the
  repository-pinned version (`v0.88.8` from
  `.github/workflows/openspec.yml`); if unavailable, install that exact
  extension version with `gh extension install github/gh-aw --pin v0.88.8`,
  without a remote shell/script pipe or unpinned upgrade.
- [x] 3.2 Compile `.github/workflows/new-issue-triage.md` with the approved
  compiler and repository-pinned action mode/tag, producing
  `.github/workflows/new-issue-triage.lock.yml`; never hand-author or copy a
  lock file. Verify that `.gitattributes` contains
  `.github/workflows/*.lock.yml linguist-generated=true`, adding it only if it
  is missing.
- [x] 3.3 Run the pinned compiler's documented validation command, using the
  repository's approved pattern from `.github/workflows/openspec.yml`
  (`gh aw compile --no-check-update --no-emit --action-mode action --action-tag
  5e508589e03a7757a7e05b26e834292f5445bfb6`) as applicable; verify source/lock
  freshness and inspect generated permissions and safe-output jobs for the
  approved target and caps.

## 4. Verify the approved behavior and change artifacts

- [x] 4.1 Add or extend structural workflow checks for opened-only triggering,
  approved label allowlisting, at-most-one fixed-target comment, absence of
  assignment without a map, untrusted-content handling, and prohibition on
  duplicate closure; verify each invariant is exercised.
- [x] 4.2 Run `openspec validate --all` and `git --no-pager diff --check`;
  verify both pass and the change contains only
  its approved workflow source, compiler-generated lock, optional missing
  `.gitattributes` marker, and related validation coverage.
