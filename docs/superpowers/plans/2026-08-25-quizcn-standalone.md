# Quizcn Standalone Implementation Plan

**Goal:** Extract ReadRun's reusable quiz model, grading, session behavior, and
React UI into an independent React 19 project, distribute the same canonical
source as an npm package and a shadcn registry item, and leave ReadRun as a
transport-and-rendering adapter.

**Architecture:** The standalone repository owns the public React model,
structural validation, grading, session reducer, components, styles, fixtures,
and releases. ReadRun keeps its Markdown parser, source diagnostics, rendered
JSON payload, island discovery, and rich HTML/math boundary. ReadRun depends on
the standalone package; the standalone project never imports ReadRun.

**Tech stack:** Bun 1.4, TypeScript, React 19, Bun test, happy-dom,
`@shadcn/react/questionnaire`, Tailwind-compatible semantic tokens, Bun package
builds, and the shadcn registry CLI.

**Spec:** `docs/superpowers/specs/2026-08-25-quizcn-standalone-design.md`

## Repositories and working names

This plan spans two independent repositories:

- **quizcn:** the new standalone repository. Paths under a `quizcn/` heading
  are relative to that repository.
- **readrun:** this repository. Paths under a `readrun/` heading are relative
  to `/home/eastill/projects/readrun`.

Use `quizcn`, `@quizcn/react`, and `owner/quizcn` as working names during local
development. Confirm the final repository owner, npm scope, package name, and
registry URL before Task 8. Renaming must not alter the public model or create a
second implementation.

Remote repository creation, npm publication, and tag publication are external
state changes. Task 8 is an explicit approval checkpoint. Tasks 1-7 use a local
package tarball and local registry output and do not require a public release.

## Resolved implementation details

- `SubmittedAnswer` is `string | string[]`. All single-choice and true/false
  answers are choice IDs; true/false answers are never booleans.
- True/false validation needs inspectable labels. For this question type only,
  `choice.content` must be a plain string equal to `True` or `False`, ignoring
  case. ReadRun maps its existing `RenderedRichText.text` to those two labels.
  Other content remains an arbitrary `ReactNode`.
- Quizcn creates its own DOM/ARIA identifier prefix with `React.useId()`. It
  does not accept or inspect ReadRun's `instanceId`.
- `validateQuizDefinition` is internal in `src/validation.ts`; it is not added
  to the first public export surface. `<Quiz>` uses it and fails closed.
- `@shadcn/react` is the runtime dependency; source imports its
  `/questionnaire` subpath.
- A private `src/primitives.tsx` contains only the button, card, and input
  wrappers needed by the quiz. It is not exported publicly and does not import
  consumer aliases such as `@/components/ui/*`.
- The local tarball proves package integration before ReadRun deletes any
  implementation. ReadRun commits the package switch only after the final
  package name and install source are stable.

## Global constraints

- Use Bun commands and Bun tests in both repositories.
- Keep quizcn as one package, not a monorepo.
- Use relative imports between quizcn source files.
- Export only the public model/types, `<Quiz>`, `gradeAnswer`, `scoreQuiz`,
  `createQuizSession`, and `reduceQuizSession` from the initial package root.
- Do not accept HTML strings or call `dangerouslySetInnerHTML` in quizcn.
- Preserve ReadRun's current grading, navigation, feedback, hint, explanation,
  result, restart, keyboard, focus, and accessibility behavior.
- Preserve shadcn semantic color tokens and the established radius scale.
- Do not add persistence, analytics, remote submission, randomization,
  question banks, controlled mode, or new question types.
- Package and registry consumers must execute the same behavior contract.
- Keep each repository passing at every commit boundary.
- Do not remove ReadRun's implementation until the package-consumer fixture and
  a ReadRun local-tarball integration both pass.

---

### Task 1: Scaffold quizcn and define the public model

**Repository:** quizcn

**Files:**

- Create: `AGENTS.md`
- Create: `.gitignore`
- Create: `README.md`
- Create: `package.json`
- Create: `bun.lock`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Create: `src/model.ts`
- Create: `src/validation.ts`
- Create: `test/validation.test.ts`

**Produces:** A Bun 1.4/React 19 package skeleton, the public discriminated
union, result types, and internal structural validation with no ReadRun types.

- [ ] **Step 1: Create the independent repository baseline**

Initialize a separate Git repository with `packageManager: "bun@1.4.0"` and
scripts for `typecheck`, `test`, `build`, and `check`. Add React 19 and React DOM
as peer dependencies and development dependencies. Add `@types/bun`,
`@types/react`, `@types/react-dom`, TypeScript, and happy-dom as development
dependencies. Do not add ReadRun or copy its `AGENTS.md` verbatim.

Run:

```bash
bun install
bun run typecheck
```

Expected: the empty package baseline typechecks and creates a Bun 1.4 lockfile.

- [ ] **Step 2: Write failing public-model validation tests**

Cover:

- non-empty quiz and item IDs;
- item ID uniqueness and choice ID uniqueness per question;
- at least one question, while allowing information items;
- exactly one correct single choice;
- one or more correct multiple choices;
- exactly two plain-string `True`/`False` choices and one correct choice;
- a non-empty free-text expected answer;
- errors returned without file paths or source positions.

Run:

```bash
bun test test/validation.test.ts
```

Expected: FAIL because `model.ts` and `validation.ts` do not exist.

- [ ] **Step 3: Implement the minimal public model and internal validator**

Define `QuizDefinition`, `QuizInfo`, `QuizChoice`, the four question variants,
`QuizItem`, `QuizQuestion`, `SubmittedAnswer`, `GradeResult`, and `QuizResult`.
Use `ReactNode` for renderable fields. Keep the true/false representation as
choices with IDs and `correct` flags; do not add `correctAnswer`.

Implement `validateQuizDefinition(quiz): readonly QuizValidationIssue[]` in
`src/validation.ts`. Give issues stable codes and human-readable messages, but
no source paths or line numbers. Export public types from `src/index.ts`; keep
validation internal.

- [ ] **Step 4: Run the focused tests and baseline check**

```bash
bun test test/validation.test.ts
bun run typecheck
bun run check
```

Expected: all pass.

- [ ] **Step 5: Commit the standalone baseline**

```bash
git add AGENTS.md .gitignore README.md package.json bun.lock tsconfig.json src test
git commit -m "feat: define standalone quiz model"
```

---

### Task 2: Port grading to choice-ID answers

**Repository:** quizcn

**Files:**

- Create: `src/grading.ts`
- Create: `test/grading.test.ts`
- Modify: `src/index.ts`
- Modify: `src/model.ts`

**Produces:** Framework-independent grading and scoring over the public model.

- [ ] **Step 1: Port the grading tests before the implementation**

Adapt ReadRun's `src/domain/quiz/grading.test.ts` to the public model. Preserve
single-choice, order-independent exact multi-choice, free-text normalization,
unknown-choice, invalid-shape, and score tests. Change true/false submissions
from booleans to the selected choice ID.

Add assertions that:

```ts
expect(gradeAnswer(trueFalseQuestion, "false").correct).toBe(true);
expect(gradeAnswer(trueFalseQuestion, false as never).error)
  .toBe("invalid-answer-shape");
```

Run:

```bash
bun test test/grading.test.ts
```

Expected: FAIL because the grading functions are missing.

- [ ] **Step 2: Implement grading and scoring**

Port `normalizeFreeText`, `gradeAnswer`, and `scoreQuiz` without ReadRun domain
imports. Treat true/false exactly like a single-choice question for answer
shape and choice lookup. Preserve normalization: trim outer whitespace,
collapse internal whitespace, and default to case-insensitive exact matching.

Export `gradeAnswer` and `scoreQuiz` from `src/index.ts`. Keep helpers private
unless a test must import them directly.

- [ ] **Step 3: Run grading and package checks**

```bash
bun test test/grading.test.ts test/validation.test.ts
bun run check
```

Expected: all pass.

- [ ] **Step 4: Commit grading**

```bash
git add src test
git commit -m "feat: add standalone quiz grading"
```

---

### Task 3: Port the quiz session reducer

**Repository:** quizcn

**Files:**

- Create: `src/session.ts`
- Create: `test/session.test.ts`
- Modify: `src/index.ts`

**Produces:** An exported uncontrolled-session state machine independent of UI
and ReadRun payloads.

- [ ] **Step 1: Port reducer tests against the public model**

Adapt ReadRun's `src/presentation/quiz/session.test.ts`. Cover information-step
navigation, blocked forward navigation, deliberate submission, locked graded
answers, back navigation with retained state, hints, completion only after all
questions are graded, and restart. Add a true/false case using a choice ID.

Run:

```bash
bun test test/session.test.ts
```

Expected: FAIL because `session.ts` does not exist.

- [ ] **Step 2: Implement and export the reducer**

Port `QuizSessionState`, `QuizSessionAction`, `createQuizSession`, and
`reduceQuizSession`. Use only quizcn model and grading imports. Keep
`hasAnswer` and question lookup private. An invalid definition is not repaired
by the reducer; `<Quiz>` validates before creating a session.

Export only `createQuizSession` and `reduceQuizSession` from `src/index.ts`.

- [ ] **Step 3: Run reducer, grading, and full checks**

```bash
bun test test/session.test.ts test/grading.test.ts
bun run check
```

Expected: all pass.

- [ ] **Step 4: Commit session behavior**

```bash
git add src test
git commit -m "feat: add standalone quiz sessions"
```

---

### Task 4: Extract the React component and behavior contract

**Repository:** quizcn

**Files:**

- Create: `src/cn.ts`
- Create: `src/primitives.tsx`
- Create: `src/Questionnaire.tsx`
- Create: `src/Quiz.tsx`
- Create: `src/QuizStep.tsx`
- Create: `src/QuizResults.tsx`
- Create: `test/happy-dom.ts`
- Create: `test/fixtures.tsx`
- Create: `test/quiz-contract.tsx`
- Create: `test/Quiz.test.tsx`
- Modify: `src/index.ts`
- Modify: `package.json`
- Modify: `bun.lock`

**Produces:** The public uncontrolled `<Quiz>` component with the retained
ReadRun behavior, no HTML trust boundary, and a reusable consumer contract.

- [ ] **Step 1: Add component dependencies and a DOM test harness**

Add `@shadcn/react` as a runtime dependency. Add only the class-merging or
variant helpers actually required by the private primitives. Use a small inline
SVG for the choice checkmark instead of adding an icon package solely for one
glyph.

Port ReadRun's happy-dom setup into `test/happy-dom.ts` without ReadRun paths.

- [ ] **Step 2: Write the shared behavior contract first**

Extract the observable cases from ReadRun's `QuizIsland.test.tsx` into a
`runQuizContract(renderQuiz)` harness that can later run against source,
package, and registry installations. Cover:

- single, multiple, true/false, and free-text answers;
- information steps;
- disabled submission until an answer exists;
- ArrowRight blocking and Enter submission;
- locked answers, feedback, hints, and explanations;
- backward review with preserved grades;
- result score and per-question outcomes;
- focus moving to results and back to the first step after restart;
- exactly one `onComplete` call with answers and grades;
- two quiz instances without colliding IDs or focus targets.

Add separate invalid-definition cases asserting an accessible
`Quiz unavailable` result in development and production behavior.

Run:

```bash
bun test test/Quiz.test.tsx
```

Expected: FAIL because `<Quiz>` is missing.

- [ ] **Step 3: Extract private primitives and questionnaire composition**

Port only the quiz-used parts of ReadRun's `Button.tsx`, `Card.tsx`, and
`Questionnaire.tsx`. Remove ReadRun aliases, `IconPlaceholder`, theme paths,
math imports, and shell assumptions. Keep shadcn tokens, normal rounded
corners, native controls, keyboard behavior, and relative imports.

Do not export these files from `src/index.ts`.

- [ ] **Step 4: Implement `<Quiz>`, steps, and results**

Adapt `QuizIsland.tsx`, `QuizStep.tsx`, and `QuizResults.tsx` to
`QuizDefinition`. Render `ReactNode` values normally; do not use HTML strings or
`dangerouslySetInnerHTML`. Use `React.useId()` plus a root ref for ARIA IDs and
focus queries. Compute `QuizResult` at completion and invoke `onComplete` once
per completed attempt. Restart permits a new completion callback.

At the `<Quiz>` boundary, run internal validation and render the accessible
failure state instead of initializing a partial session.

- [ ] **Step 5: Export only the supported API**

Export `<Quiz>` and the public types/functions from `src/index.ts`. Confirm that
`QuizStep`, `QuizResults`, `Questionnaire`, private primitives, internal
validation, and class helpers are not package-root exports.

- [ ] **Step 6: Run behavior and complete checks**

```bash
bun test test/Quiz.test.tsx test/session.test.ts test/grading.test.ts test/validation.test.ts
bun run check
```

Expected: all pass, with no ReadRun import or HTML injection in `src/`.

- [ ] **Step 7: Commit the React component**

```bash
git add package.json bun.lock src test
git commit -m "feat: add standalone Quiz component"
```

---

### Task 5: Build the npm package, styles, example, and package fixture

**Repository:** quizcn

**Files:**

- Create: `src/styles.css`
- Create: `scripts/build.ts`
- Create: `examples/index.html`
- Create: `examples/basic.tsx`
- Create: `fixtures/package-consumer/package.json`
- Create: `fixtures/package-consumer/tsconfig.json`
- Create: `fixtures/package-consumer/index.html`
- Create: `fixtures/package-consumer/app.tsx`
- Create: `fixtures/package-consumer/quiz.test.tsx`
- Modify: `package.json`
- Modify: `README.md`

**Produces:** ESM, declarations, explicit compiled CSS, an editable example,
and a clean consumer that installs the packed artifact rather than source.

- [ ] **Step 1: Write package artifact assertions**

Add a build test or build-script checks requiring:

- `dist/index.js` with React externalized;
- `dist/index.d.ts` with the documented public API;
- `dist/styles.css` containing quiz selectors and semantic tokens;
- no ReadRun name, path, import, CSS selector, or type in `dist/`;
- package exports for `.` and `./styles.css`;
- only the intended files in `npm pack` output.

Run:

```bash
bun run build
```

Expected: FAIL until package build configuration and styles exist.

- [ ] **Step 2: Implement package and CSS builds**

Use `scripts/build.ts` to clean only the known `dist/` directory, invoke
`Bun.build` for ESM, emit declarations with TypeScript, and compile the quiz's
Tailwind utilities into `dist/styles.css`. Externalize React and React DOM.
Configure package exports, `files`, `types`, peer dependencies, and side-effect
metadata so consumers explicitly import `@quizcn/react/styles.css`.

- [ ] **Step 3: Add the standalone example**

Create a minimal React 19 example that imports `<Quiz>` and the stylesheet,
uses all question types, and logs the `QuizResult` from `onComplete`. It must
contain no ReadRun adapter or Markdown assumptions.

- [ ] **Step 4: Verify a packed package in a clean fixture**

Pack the package to a known fixture-local path, install it in
`fixtures/package-consumer`, import only its declared exports, build the fixture,
and run the shared quiz behavior contract against the installed package.

Run each command separately:

```bash
bun run build
bun pm pack
bun run fixture:package
bun run check
```

Expected: the fixture resolves JavaScript, declarations, and CSS from the
tarball and passes the shared contract without importing `../../src`.

- [ ] **Step 5: Document the package API**

Add install, stylesheet, model, `onComplete`, React 19, answer-visibility, and
self-study examples to `README.md`. Do not promise controlled state,
persistence, analytics, or server-side answer secrecy.

- [ ] **Step 6: Commit package distribution**

```bash
git add package.json README.md src scripts examples fixtures/package-consumer
git commit -m "build: package quizcn for React consumers"
```

---

### Task 6: Publish the same source through a shadcn registry item

**Repository:** quizcn

**Files:**

- Create: `registry.json`
- Create: `fixtures/registry-consumer/package.json`
- Create: `fixtures/registry-consumer/tsconfig.json`
- Create: `fixtures/registry-consumer/components.json`
- Create: `fixtures/registry-consumer/index.html`
- Create: `fixtures/registry-consumer/app.tsx`
- Create: `fixtures/registry-consumer/quiz.test.tsx`
- Modify: `package.json`
- Modify: `README.md`

**Produces:** One registry item named `quiz` that installs the canonical source
and passes the same contract without depending on `@quizcn/react`.

- [ ] **Step 1: Add the single registry item**

Define `registry.json` with one `quiz` item. Map the canonical `src/` model,
grading, session, component, questionnaire, private primitive, class helper,
and style files into `components/quiz/`. Declare React 19 and all runtime npm
dependencies. Do not create separate grading, step, questionnaire, or results
items.

The registry references the same files used by the package; do not copy a
second implementation into a registry-only source folder.

- [ ] **Step 2: Write the clean registry-consumer verification**

Initialize a minimal shadcn-compatible fixture, install the local `quiz` item,
and assert that its application imports from its installed
`components/quiz/` directory, not `@quizcn/react` or quizcn source paths. Run
the same `runQuizContract` harness used by source and package tests.

Run:

```bash
bun run registry:build
bun run fixture:registry
```

Expected: FAIL until the item installs every source and dependency.

- [ ] **Step 3: Fix registry targets and dependency declarations**

Adjust only registry metadata or canonical relative imports. Do not fork the
component for registry consumers. Confirm normal shadcn radii and semantic
tokens survive installation.

- [ ] **Step 4: Run all three consumer contracts**

```bash
bun test test/Quiz.test.tsx
bun run fixture:package
bun run fixture:registry
bun run check
```

Expected: source, packed package, and installed registry source all pass the
same grading, navigation, feedback, results, accessibility, and restart cases.

- [ ] **Step 5: Document pinned registry installation**

Document the working-name command and label it as provisional until Task 8:

```bash
bunx shadcn@latest add owner/quizcn/quiz#v0.1.0
```

Keep main-branch installation development-only.

- [ ] **Step 6: Commit registry distribution**

```bash
git add registry.json package.json README.md fixtures/registry-consumer
git commit -m "feat: add quizcn registry item"
```

---

### Task 7: Prove ReadRun integration with a local package tarball

**Repositories:** quizcn and readrun

**quizcn files:**

- Modify as required by integration: `src/model.ts`
- Modify as required by integration: `src/Quiz.tsx`
- Modify as required by integration: `src/styles.css`
- Modify as required by integration: package and contract tests

**readrun files:**

- Create: `src/presentation/quiz/ReadRunRichText.tsx`
- Create: `src/presentation/quiz/adapter.tsx`
- Create: `src/presentation/quiz/adapter.test.tsx`
- Modify: `src/presentation/quiz/mount.tsx`
- Modify: `src/presentation/quiz/mount.test.tsx`
- Temporarily modify for local verification: `package.json`
- Temporarily modify for local verification: `bun.lock`

**Produces:** A proven transport-to-props boundary and island mount using the
packed standalone component while legacy ReadRun UI remains recoverable.

- [ ] **Step 1: Pack quizcn and install the artifact locally in ReadRun**

Build and pack quizcn. Install that exact tarball in ReadRun for integration
testing. Treat the local file dependency as temporary: do not publish it and do
not commit a machine-specific absolute path.

- [ ] **Step 2: Write the adapter tests before switching the mount**

Test `toQuizDefinition(payload)` with every item type. Assert:

- IDs, title, correctness flags, answer metadata, and order are preserved;
- every general rich-text field becomes `<ReadRunRichText value={...} />`;
- true/false labels use their plain `text` values so quizcn can validate them;
- no HTML string is passed as a quizcn content prop;
- the source transport object is not mutated.

Run:

```bash
bun test src/presentation/quiz/adapter.test.tsx
```

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Implement the ReadRun rich-text boundary and adapter**

Move the current trusted HTML insertion and `renderPageMath` effect out of
`QuizStep.tsx` into `ReadRunRichText.tsx`. Implement the pure payload mapping in
`adapter.tsx`. Do not import ReadRun types or rendering into quizcn.

- [ ] **Step 4: Switch only the island mount**

Import `Quiz` and `@quizcn/react/styles.css` through ReadRun's client bundle.
After `parseQuizPayload`, render:

```tsx
<Quiz quiz={toQuizDefinition(payload)} />
```

Keep ReadRun's existing payload error card, root creation, instance discovery,
and disposal behavior. Do not delete `QuizIsland.tsx` or its dependencies yet.

- [ ] **Step 5: Update integration tests**

Keep the existing multi-island, invalid-payload, disposal, and dynamically
revealed math cases in `mount.test.tsx`. Add an assertion that two ReadRun quiz
instances do not share input IDs or focus targets. Run the documented quiz page
through both development rendering and a static build.

Run:

```bash
bun test src/presentation/quiz/adapter.test.tsx src/presentation/quiz/mount.test.tsx
bun run typecheck
bun run validate:docs
bun run build:docs
```

Expected: all pass against the packed quizcn artifact.

- [ ] **Step 6: Feed standalone defects back to quizcn**

If integration exposes a generic model, component, style, or accessibility
defect, fix it in quizcn with a regression test, rebuild the tarball, and rerun
ReadRun. Do not add ReadRun conditionals to quizcn.

- [ ] **Step 7: Commit the proven standalone changes**

Commit any generic fixes in quizcn. In ReadRun, retain the adapter work for the
final package switch but do not commit an absolute local tarball dependency.

---

### Task 8: Confirm names and create the 0.1.0 release

**Repository:** quizcn

**External checkpoint:** Obtain explicit approval for the final GitHub owner,
repository name, npm package name/scope, npm publication, and Git tag push.

**Files:**

- Modify: `package.json`
- Modify: `README.md`
- Modify: `registry.json`
- Modify: fixture install configuration
- Modify: any working-name references found by search

**Produces:** One immutable `0.1.0` package/tag pair and a tag-pinned registry
source using the final names.

- [ ] **Step 1: Resolve and apply final names**

Update package metadata, repository links, registry URL, commands, fixture
imports, and README examples in one focused change. Search for all working-name
placeholders and confirm every remaining occurrence is intentional.

- [ ] **Step 2: Verify release contents before external changes**

```bash
bun run check
bun run build
bun run fixture:package
bun run fixture:registry
bun pm pack
```

Inspect the tarball file list and unpack it into a temporary clean consumer.
Expected: both distribution forms pass against the exact release source.

- [ ] **Step 3: Commit the release candidate**

```bash
git add package.json bun.lock README.md registry.json fixtures
git commit -m "chore: prepare quizcn 0.1.0"
```

- [ ] **Step 4: Publish only after approval**

Publish package version `0.1.0`, create the matching `v0.1.0` Git tag, and push
the tag. Do not reuse or move the tag after publication.

- [ ] **Step 5: Verify the published consumers**

Install the npm package into a fresh package fixture and install the registry
item from the tagged public URL into a fresh registry fixture. Run the shared
contract in both. A release is incomplete until both pass from public sources.

---

### Task 9: Finish the ReadRun switch and remove duplicate ownership

**Repository:** readrun

**Files:**

- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `src/domain/quiz/model.ts`
- Delete: `src/domain/quiz/grading.ts`
- Delete: `src/domain/quiz/grading.test.ts`
- Delete: `src/presentation/quiz/session.ts`
- Delete: `src/presentation/quiz/session.test.ts`
- Delete: `src/presentation/quiz/QuizIsland.tsx`
- Delete: `src/presentation/quiz/QuizIsland.test.tsx`
- Delete: `src/presentation/quiz/QuizStep.tsx`
- Delete: `src/presentation/quiz/QuizResults.tsx`
- Delete: `src/presentation/components/ui/Questionnaire.tsx`
- Delete: `src/presentation/components/ui/Questionnaire.test.tsx`
- Modify: `src/presentation/components/ui/index.ts`
- Modify: `src/presentation/quiz/model.ts`
- Modify: `src/presentation/quiz/render.ts`
- Modify: `src/presentation/quiz/render.test.ts`
- Modify: `src/presentation/quiz/runtime.ts`
- Modify: `src/presentation/quiz/runtime.test.ts`
- Modify: `src/presentation/quiz/QuizBlock.tsx`
- Modify: `src/presentation/quiz/QuizBlock.test.tsx`
- Modify: `src/presentation/quiz/adapter.tsx`
- Modify: `src/presentation/quiz/adapter.test.tsx`
- Modify: `src/presentation/quiz/ReadRunRichText.tsx`
- Modify: `src/presentation/quiz/mount.tsx`
- Modify: `src/presentation/quiz/mount.test.tsx`

**Produces:** ReadRun owns only Markdown/source validation, payload transport,
trusted rich rendering, and island mounting.

- [ ] **Step 1: Replace the local tarball with the released package**

Add the final package at a compatible `0.1.x` range and let Bun record the exact
resolution in `bun.lock`. Import paths must use the final package name.

- [ ] **Step 2: Confirm the new mount passes before deleting old code**

```bash
bun test src/presentation/quiz/adapter.test.tsx src/presentation/quiz/mount.test.tsx
bun run typecheck
```

Expected: PASS from the installed release, not a local link or tarball.

- [ ] **Step 3: Delete only superseded behavior**

Remove ReadRun grading, session, quiz component, results, step, and quiz-only
Questionnaire implementations and tests. Remove `SubmittedAnswer` and
`GradeResult` from ReadRun's domain model. Retain parser, legacy parser, source
validation, rendering, runtime payload validation, `QuizBlock`, mount,
adapter, and `ReadRunRichText`.

If `rg` confirms no remaining direct `@shadcn/react` imports, remove ReadRun's
direct dependency; quizcn remains responsible for its own runtime dependency.

- [ ] **Step 4: Simplify the transport without changing source diagnostics**

Rename rendered types to `ReadRunQuizPayload*` if that improves the boundary,
but do not mix this with parser-domain renames. Remove the redundant
`correctAnswer` from the browser payload if the adapter no longer consumes it;
the ReadRun parser domain may retain it as a follow-up. Keep schema version 1
only if the existing runtime parser can accept the compatible removal;
otherwise increment the schema and update serialization/runtime tests together.

- [ ] **Step 5: Run focused ownership searches**

```bash
rg -n "gradeAnswer|scoreQuiz|createQuizSession|reduceQuizSession|QuizIsland|QuizStep|QuizResults|Questionnaire" src
rg -n "readrun|RenderedRichText|dangerouslySetInnerHTML|renderPageMath" ../quizcn/src
```

Expected: ReadRun hits remain only in adapter/transport/mount responsibilities;
quizcn has no ReadRun or HTML/math-boundary hits.

- [ ] **Step 6: Run the ReadRun suite**

```bash
bun run typecheck
bun test ./src --parallel
bun run validate:docs
bun run build:docs
bun run check
git diff --check
```

Expected: all pass and documented quiz behavior is unchanged.

- [ ] **Step 7: Commit the ReadRun integration**

```bash
git add package.json bun.lock src
git commit -m "refactor: consume standalone quizcn package"
```

---

### Task 10: Complete cross-repository verification and handoff

**Repositories:** quizcn and readrun

**Files:**

- Modify as needed: `quizcn/README.md`
- Modify only if behavior changed: `readrun/docs/authoring/quiz-format.md`
- Modify only if architecture docs require it: ReadRun project documentation

**Produces:** Evidence that both distributions and ReadRun integration satisfy
the design without duplicate implementation.

- [ ] **Step 1: Verify quizcn from a clean install**

```bash
bun install --frozen-lockfile
bun run typecheck
bun test
bun run build
bun run fixture:package
bun run fixture:registry
bun run check
git diff --check
git status --short
```

Expected: all pass; status contains only intentional documentation updates.

- [ ] **Step 2: Verify ReadRun from a clean install**

```bash
bun install --frozen-lockfile
bun run typecheck
bun test ./src --parallel
bun run validate:docs
bun run build:docs
bun run check
git diff --check
git status --short
```

Expected: all pass under the published standalone dependency; generated
`dist/` remains ignored.

- [ ] **Step 3: Verify both public consumption paths**

In fresh temporary directories, install `@quizcn/react@0.1.0` with its
stylesheet and install the tag-pinned `quiz` registry item. Complete the same
quiz in both and confirm grading, navigation, results, accessibility, restart,
and styling parity.

- [ ] **Step 4: Review the ownership boundary**

Confirm:

1. quizcn contains no ReadRun imports, types, paths, runtime hooks, HTML trust,
   math rendering, or theme assumptions;
2. ReadRun contains no duplicate grading, session reducer, quiz step, results,
   or questionnaire presentation;
3. ReadRun parser and author diagnostics still include source positions;
4. package and registry forms derive from the same canonical source;
5. public docs state that answers ship to the browser and quizzes are for
   self-study.

- [ ] **Step 5: Commit any documentation-only handoff updates**

Commit documentation in its owning repository with no generated output. Do not
change ReadRun authoring docs if the `[quiz]` contract did not change.

## Completion criteria

The plan is complete only when:

- the independent quizcn repository passes source, package, and registry tests;
- npm package version and Git tag are both `0.1.0` and public fixtures pass from
  those immutable sources;
- ReadRun consumes the released package through its adapter and preserves all
  documented quiz behavior;
- ReadRun no longer owns duplicate grading, session, or quiz presentation code;
- both repositories pass their full checks with clean working trees.
