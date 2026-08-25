# Quizcn standalone extraction handoff

**Written:** 2026-08-26 (Australia/Perth)  
**Reason for stopping:** The user requested that implementation stop and a continuation handoff be written.  
**Current boundary:** Tasks 1–3 are implemented and reviewed. Task 4 is implemented, committed, and freshly tested, but its independent task review was interrupted before a verdict. Tasks 5–10 have not been implemented.

## Resume here

1. Read the repository instructions at `/home/eastill/projects/readrun/AGENTS.md` if present, plus the user-provided ReadRun instructions in the conversation.
2. Use the existing ReadRun worktree at `/home/eastill/projects/readrun/.worktrees/quizcn-standalone`; do not create another worktree.
3. Read the authoritative ledger first:
   `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/progress.md`
4. Resume Task 4 at its independent review gate. Do not start Task 5 until Task 4 is reviewed and any Important/Critical findings complete the documented fix/re-review loop.
5. Review Task 4 using:
   - brief: `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/task-4-brief.md`
   - implementer report: `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/task-4-report.md`
   - full diff package: `/home/eastill/projects/quizcn/.superpowers/sdd/2026-08-25-quizcn-standalone/review-f4d2ef9..18cc14a.diff`
   - base/head: `f4d2ef9..18cc14a`

The previous read-only reviewer `/root/review_task_4` was deliberately interrupted before returning any verdict. There is no Task 4 review result to trust or recover.

## Repository state

| Repository/workspace | Branch | HEAD | Status |
| --- | --- | --- | --- |
| `/home/eastill/projects/quizcn` | `master` | `18cc14a` | Clean; no Git remote configured |
| `/home/eastill/projects/readrun/.worktrees/quizcn-standalone` | `codex/quizcn-standalone` | `a0edd3c` | Clean isolated worktree |
| `/home/eastill/projects/readrun` | `main` | `1373d43` | Intentionally dirty with the earlier requested plan/spec documentation changes |

The original ReadRun checkout intentionally still contains:

```text
 D docs/superpowers/plans/2026-08-25-bun-1-4-native-migration.md
 D docs/superpowers/specs/2026-08-25-bun-1-4-native-migration-design.md
?? docs/superpowers/plans/2026-08-25-quizcn-standalone.md
```

Do not discard or overwrite those original-checkout changes. The same documentation state is committed safely on the isolated branch as `a0edd3c`.

## Authoritative design and plan

- Design spec: `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/docs/superpowers/specs/2026-08-25-quizcn-standalone-design.md`
- Implementation plan: `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/docs/superpowers/plans/2026-08-25-quizcn-standalone.md`
- SDD ledger: `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/progress.md`

## Completed commits in quizcn

```text
18cc14a feat: add standalone Quiz component
f4d2ef9 feat: add standalone quiz sessions
1a4089a feat: add standalone quiz grading
8c19c15 fix: export public question variants
cb343f8 feat: define standalone quiz model
```

### Task 1 — Model and validation

- Created the independent Bun 1.4/React 19 repository.
- Added the public discriminated model and internal validation.
- `SubmittedAnswer` is `string | string[]`.
- True/false choices use choice IDs and plain `True`/`False` string labels.
- Task review found missing public variant exports and explicit true/false shape tests; fix commit `8c19c15` addressed both and passed scoped re-review.

### Task 2 — Grading

- Added `gradeAnswer` and `scoreQuiz` with choice-ID true/false behavior.
- Preserved exact-set multi-choice and normalized free-text behavior.
- Independent task review passed with no findings.

### Task 3 — Session reducer

- Added `createQuizSession` and `reduceQuizSession`.
- Preserved navigation gates, deliberate submission, locked grades, hints, review state, completion, and restart.
- The reviewer incorrectly interpreted “export only create/reduce” as requiring deletion of earlier public exports. The design and plan require a cumulative public API, so that finding was ruled a non-defect. See Rulings below.

### Task 4 — React component (implemented, review still required)

- Added the public uncontrolled `<Quiz quiz={...} />` component.
- Added private primitives and the `@shadcn/react/questionnaire` composition.
- Added validation failure UI, `React.useId()` isolation, root-scoped focus, results, restart, and exactly-once-per-attempt `onComplete`.
- Added a reusable real-DOM `runQuizContract(renderQuiz)` harness.
- Contract covers single/multi/truefalse/freetext, info steps, keyboard behavior, locks, feedback, hints, explanations, backward review, results, focus/restart, completion callbacks, two instances, invalid definitions, and literal string-vs-HTML handling.
- Implementation commit: `18cc14a`.
- Independent review has not happened; this task remains `in_progress` in the ledger.

## Fresh verification at handoff

Run from `/home/eastill/projects/quizcn` on `18cc14a`:

```text
bun run check
50 pass
0 fail
250 expect() calls
exit 0

git diff --check
exit 0

git status --short
<no output>
```

The 50-test count is doubled because the temporary Task 1 build configuration emits ignored test copies into `dist/test/`, and unscoped `bun test` discovers both source and compiled tests. The canonical source suite is 25 tests. Task 5 must replace this build layout with source-only declarations and ensure unscoped checks no longer discover generated tests.

The isolated ReadRun worktree is also clean and `git diff --check` exits 0. Its baseline before quizcn work was freshly installed and verified with:

```text
bun test ./src --parallel
419 pass
0 fail
1492 expect() calls
```

No ReadRun executable integration changes have been made yet; only the documentation commit exists on the isolated branch.

## Research and preparation artifacts

These are ignored scratch artifacts, not tracked source. Read them before the corresponding task.

- Task 4 UI contract mapping:
  `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/parallel-quiz-ui-contract-analysis.md`
- Tasks 4–6 package/registry mapping:
  `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/parallel-package-registry-analysis.md`
- Task 5 Bun package-build research:
  `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/parallel-bun-package-build-research.md`
- Task 6 current official shadcn registry research:
  `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/parallel-shadcn-registry-research.md`
- Task 7 ReadRun adapter/mount mapping:
  `/home/eastill/projects/readrun/.worktrees/quizcn-standalone/.superpowers/sdd/2026-08-25-quizcn-standalone/parallel-readrun-adapter-analysis.md`

Task briefs/reports for Tasks 1–4 are in the same ReadRun `.superpowers/sdd/2026-08-25-quizcn-standalone/` directory. Per-task quizcn diff packages are under `/home/eastill/projects/quizcn/.superpowers/sdd/2026-08-25-quizcn-standalone/`.

## Remaining sequence

### First: finish Task 4 review

Dispatch a fresh high-capability, read-only task reviewer against the Task 4 brief/report/diff package listed above. Check the actual diff for:

- React effect/callback timing and exactly-once `onComplete`;
- keyboard form semantics;
- duplicate quiz IDs and root-scoped focus;
- questionnaire metadata/value synchronization;
- invalid-definition behavior;
- public export leakage;
- shared-contract source independence for package/registry fixtures;
- ReactNode accessibility without unsafe string coercion.

If the review returns Important/Critical or spec gaps, resume the Task 4 implementer/fix loop with tests and a scoped re-review. Otherwise mark Task 4 complete in the ledger.

### Task 5 — Package build and package fixture

Key prepared decisions:

- Replace the current `tsc` build with `scripts/build.ts`.
- Use `Bun.build` for browser ESM with `external: ["react", "react-dom"]`; do not externalize all packages.
- Add a source-only declaration config so `dist/index.d.ts` is flat and tests are not emitted.
- Compile `src/styles.css` with Tailwind scanning canonical TSX utilities.
- Preserve CSS with package `sideEffects` metadata.
- Pack to a fixture-local tarball and install that artifact, never source/link imports.
- The current package metadata is still provisional: `name: "quizcn"`, `version: "0.0.0"`, `private: true`, and `main/types` point to `dist/src`. Task 5 should use the working package identity `@quizcn/react` for local fixtures unless the plan is explicitly amended; final public identity still belongs to Task 8.

### Task 6 — Registry item and fixture

Current official flow recorded by research:

```text
bunx shadcn@latest registry validate ./registry.json
bunx shadcn@latest build ./registry.json --output ./public/r
bunx shadcn@latest add ../../public/r/quiz.json --dry-run
bunx shadcn@latest add ../../public/r/quiz.json --yes
```

Use one `registry:block` named `quiz`, explicit `files[*].target` entries placing every canonical source file under `components/quiz/`, npm `dependencies` for runtime packages, and no separate registry-only implementation.

### Task 7 — Local ReadRun tarball integration

- Build/pack quizcn, install the exact local tarball temporarily in the isolated ReadRun worktree, and add `ReadRunRichText.tsx` plus `adapter.tsx` tests first.
- Keep trusted HTML and `renderPageMath` entirely in ReadRun.
- Switch only `mount.tsx`; preserve host discovery, payload error card, root creation/identifier prefix, mounted flag, and disposal.
- Do not delete legacy ReadRun quiz implementation yet.
- Never commit an absolute tarball path. Revert temporary package/lock dependency changes after local proof if they encode the local artifact.

### Stop at Task 8

Task 8 is an external checkpoint. Before renaming/releasing, obtain the user's explicit choices and approval for:

- GitHub owner;
- repository name;
- npm package name/scope;
- remote repository creation/push;
- npm publication;
- `v0.1.0` tag creation/push.

No remote exists for `/home/eastill/projects/quizcn`, and nothing has been published or pushed. Tasks 9–10 depend on that immutable public package/tag and cannot be completed truthfully before Task 8.

## Rulings already made

These reproduce every ledger entry containing `Ruling:` so none are lost with the ignored workspace.

1. Keep local Task 7 adapter/mount work in the ReadRun feature worktree, but never commit an absolute tarball path; Task 9 resumes only after Task 8. Cost if wrong: a small rebase/reinstall step at Task 9.
2. Local tarball dependency changes may remain uncommitted during the Task 7 proof, but reviewed source changes must not encode machine paths. Cost if wrong: integration tests must reinstall the tarball before reruns.
3. Interpret Task 10’s “status contains only intentional documentation updates” as no unexplained changes; after all planned commits both repositories should be clean. Cost if wrong: documentation changes may need a separate final commit.
4. Retain the existing public model and grading exports while adding only `createQuizSession` and `reduceQuizSession`; a session-only root conflicts with the plan’s Global Constraints and design spec. Cost if wrong: the package exposes the intended cumulative API, while removing earlier exports would break Tasks 1–2 and downstream consumers.
5. Quizcn review packages live in quizcn’s ignored `.superpowers/sdd/2026-08-25-quizcn-standalone/`, while the authoritative ledger/briefs/reports live in the ReadRun worktree workspace, because Git diffs are repository-local. Cost if wrong: review artifacts are split across two ignored directories, but their paths are recorded here.

## Safety notes

- Do not delete either `.superpowers/sdd/2026-08-25-quizcn-standalone/` workspace until the final whole-branch review is complete; it is the recovery map.
- Do not remove ReadRun grading/session/UI ownership until package-consumer and local-tarball integration proofs pass.
- Do not edit ReadRun `dist/`; it is generated and ignored.
- Use Bun commands only.
- Do not publish, push, create a remote, or tag without the Task 8 approval checkpoint.

