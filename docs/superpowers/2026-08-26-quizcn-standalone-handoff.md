# Quizcn standalone completion handoff

**Completed:** 2026-08-30 (Australia/Perth)
**Status:** Quizcn is released as a GitHub shadcn registry item and ReadRun's
integration is implemented, independently reviewed, and ready for branch
integration. Quizcn is not an npm package.

## Supported installation

Use the immutable GitHub registry item:

    bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.2

This copies eleven editable source files into the consumer and adds five
ordinary dependencies: React, React DOM, @shadcn/react, clsx, and
tailwind-merge. It installs no Quizcn npm package and has no registry
dependencies.

The plan's v0.1.0 examples are historical. v0.1.2 is the current supported
source and the version committed into ReadRun.

## Exact release identities

| Ref | Annotated tag object | Peeled commit |
| --- | --- | --- |
| v0.1.0 | d6d76855db5a9e01382140cdac8422cbfdc6f73c | a44708eec19b84c003f045a228a50b75c7e35d0b |
| v0.1.1 | f2714cca0fc0c38b3769ca477f3234821c4ae64d | 8f17a1cb6d2ded40c132a77ab16de79ea0972bb3 |
| v0.1.2 | 997cf354b73f30291c63013a9fbc2a4df66e3fa4 | 725d640f969eb5a3c44b3992a5288b0def663a1a |

Public Quizcn main, local Quizcn main, the Quizcn completion worktree, and
peeled v0.1.2 all identify:

    725d640f969eb5a3c44b3992a5288b0def663a1a

The v0.1.0 and v0.1.1 tag objects and peeled commits remain unchanged.

ReadRun's independently reviewed executable integration is:

    d56f3bce4dc5fb562e479f844a89c100319ecee3

This tracked handoff is a documentation-only child of that commit. It cannot
truthfully contain the SHA of the commit that contains itself; the external
handoff records the resulting documentation commit SHA.

## Ownership and architecture

- Quizcn owns its model, validation, grading, session state, quiz UI, feedback,
  results, restart, keyboard handling, focus, accessibility, and component CSS.
- ReadRun owns author parsing and diagnostics, rendered payload transport,
  trusted HTML and math rendering, the adapter, island discovery, payload error
  cards, React-root lifecycle, and disposal.
- ReadRun's eleven files under src/presentation/components/quiz are
  byte-identical to public v0.1.2. Generic behavior changes must be made in
  EdwardAstill/quizcn, released under a new immutable tag, and reinstalled.
- ReadRun has no Quizcn npm, tarball, sibling-checkout, absolute-path, Git, or
  network runtime dependency. Normal install, test, serve, and build use only
  committed local source.
- The vendored stylesheet participates in ReadRun's single Tailwind build,
  preserves shadcn radii, consumes host semantic tokens, and does not redefine
  the host theme, radius, or shadow system.

## Verification evidence

Quizcn fresh public v0.1.2 clone:

- Frozen install passed with 23 packages.
- Source checks passed: 64 tests and 285 expectations.
- Installed registry contract passed: 42 tests and 222 expectations.
- Registry validation/build, example build, typecheck, and diff/status checks
  passed.
- The item contains one registry file, one item, eleven mappings, five runtime
  dependencies, and zero registry dependencies.
- Public full-SHA and tag-pinned installations each matched all eleven source
  files byte-for-byte.

ReadRun Git-free archive at d56f3bc:

- Frozen install passed with 52 packages.
- Full checks passed: 416 tests and 1,532 expectations, typecheck, and strict
  docs validation with zero warnings.
- Docs build produced 30 pages and 47 files.
- All eleven vendored files matched public v0.1.2 byte-for-byte.
- Ownership searches found no duplicate grading/session/UI implementation and
  no npm, tarball, sibling, absolute-path, or stale-tag runtime dependency.

Runtime/static proof:

- The authored quiz-format page, client JavaScript, and client CSS each returned
  HTTP 200 without redirects.
- Served and static output each contained two quiz island hosts, two mount
  roots, and two schema-version-1 payloads.
- Exact payloads were mechanics-check / Mechanics check and second-check /
  Independent check, with unique and correctly coupled instance IDs.
- Payload round trips, runtime-source-reference checks, JS markers, one
  Tailwind build, quiz styles, block-choice selection, IDREF ownership,
  grading, rich text, math, isolation, focus, restart, and failure containment
  passed.
- The in-app browser controller returned "No browser is available", so no
  interactive-browser claim is made. HTTP, static-output, and real mounted-DOM
  checks passed independently.

## Independent review verdicts

- Quizcn whole branch, 18cc14a..725d640: approved ready for release with no
  Critical or Important findings.
- ReadRun whole branch, 746005d..d56f3bc: approved ready to merge with no
  Critical or Important findings.
- Final clean-room evidence: approved after four report-only correction rounds;
  no source changed during those corrections.

Deferred, non-blocking follow-ups:

- Free-text case folding currently uses the browser host locale. The Quizcn
  reviewer classified this uncommon internationalization edge case as Minor;
  the ReadRun reviewer called it an important upstream correctness follow-up.
  Both approved the current release/integration. A future Quizcn tag should make
  the comparison deterministic and then be reinstalled into ReadRun.
- The ReadRun reviewer suggested a future network-free checksum/inventory CI
  guard for vendored provenance. Current provenance is proven by direct 11/11
  byte comparison and review.
- A public repository license is advisable for wider adoption but was outside
  the requested functional scope and is not a release or merge blocker.

## Local integration result

- Quizcn public and local main are complete at 725d640.
- The user selected local integration. ReadRun branch codex/quizcn-standalone
  was merged into local main by merge commit
  91432783aa9fef899dc93d6e9b3114f28121c409.
- The sole merge conflict was an otherwise-identical historical plan with a
  trailing blank-line difference; it was resolved without changing plan text.
- The merged tree passed a frozen install, 416 tests / 1,532 expectations,
  strict docs validation with zero warnings, and a 30-page / 47-file docs build.
- The clean feature worktree was removed and its fully merged local branch was
  deleted. The older remote feature branch was not changed.
- Local main has not been pushed and was thirteen commits ahead of origin/main
  immediately after the merge and cleanup.
- This post-merge handoff update is documentation-only. Its commit SHA is
  recorded in the external handoff because this file cannot contain the SHA of
  the commit that contains itself.

## Rulings preserved from the completion ledger

1. Replace the mandated Task 1 config/prose change-detector test with behavioral
   tests for the registry source argument boundary and installed registry
   fixture. Inspect private metadata, README, and package-file absence through
   review/search. Cost if wrong: exact metadata or README spelling regressions
   rely on review and CLI validation rather than a brittle text test.
2. Replace Task 3 source-grep/deleted-file tests with a behavioral test that
   imports and exercises the committed local Quiz/model, plus adapter, mount,
   and transport tests. Keep provenance/dependency/deletion as ownership
   searches and review evidence. Cost if wrong: later unused legacy files rely
   on ownership review/search rather than runtime tests.
3. Preserve the public mountQuizIslands API and use a word-boundary QuizIsland
   ownership search with the correct vendored-directory exclusion. Cost if
   wrong: the proof searches the precise removed component name while retaining
   ReadRun's required mount boundary.
4. The tracked handoff records the reviewed implementation SHA; the external
   handoff records the documentation commit SHA. Cost if wrong: readers must
   distinguish a verified implementation commit from its documentation-only
   child instead of receiving an impossible self-referential SHA.
5. buildBanner's unknown revision is intentional outside Git. Its test creates
   a temporary Git repository and also exercises the non-Git fallback. Cost if
   wrong: the test is deterministic in source checkouts and release archives
   without weakening either behavior.
6. Always-inline ReadRun choice markup was incompatible with the public
   ReactNode contract and ReadRun's block-capable authored content. The generic
   container was corrected upstream, released as immutable v0.1.2, reinstalled
   byte-for-byte, and ReadRun returned to block rich-text rendering. Cost if
   wrong: this added one corrective tag and a small generic markup/accessibility
   change instead of narrowing choice content to phrasing-only markup.

## Authoritative project documents

- Design: docs/superpowers/specs/2026-08-25-quizcn-standalone-design.md
- Completion plan:
  docs/superpowers/plans/2026-08-30-quizcn-github-registry-completion.md
- Quizcn source: /home/eastill/projects/quizcn
- ReadRun integration worktree:
  /home/eastill/projects/readrun/.worktrees/quizcn-standalone
