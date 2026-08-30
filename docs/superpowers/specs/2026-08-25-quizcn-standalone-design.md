# Quizcn Standalone Design

**Status:** Approved, revised for registry-only distribution on 2026-08-30

## Purpose

Extract the reusable quiz model, grading, session behavior, and React interface
into an independent project. The standalone project is the canonical owner of
quiz behavior and UI. ReadRun becomes one consumer through a small adapter that
translates `[quiz]` Markdown into the standalone component's public API.

The public repository is `EdwardAstill/quizcn`. Quizcn is distributed as a
GitHub-hosted shadcn registry, not as an npm package.

## Goals

- Make quizzes usable in React applications without ReadRun.
- Publish one canonical implementation as a GitHub-hosted shadcn registry item
  so consumers receive editable source.
- Preserve ReadRun's current information, single-choice, multiple-choice,
  true/false, and free-text behavior.
- Keep grading, navigation, feedback, results, restart behavior, keyboard
  handling, and accessibility in the standalone project.
- Reduce ReadRun's quiz presentation code to Markdown conversion, payload
  transport, and mounting.
- Keep the standalone project independent of ReadRun types, rendering, themes,
  and runtime lifecycle.

## Non-goals

- Move ReadRun's `[quiz]` block parser or source diagnostics into quizcn.
- Define a generic Markdown quiz syntax for applications outside ReadRun.
- Add saved progress, analytics, remote submission, randomization, question
  banks, secure examination, or new question types.
- Support server-side answer secrecy. Correct answers remain available to the
  browser and the feature remains intended for self-study.
- Add controlled-mode state or a large customization API in the first release.
- Maintain React 18 compatibility while `@shadcn/react/questionnaire` requires
  React 19.
- Split framework-neutral code into a second package before a non-React
  consumer exists.
- Publish quizcn to npm or support a package dependency from npm or GitHub.
- Install quizcn dynamically during ReadRun builds or require network access to
  build a checked-out ReadRun commit.

## Ownership boundary

```text
quizcn repository
  model and public types
  grading
  quiz session reducer
  React quiz components
  accessibility and keyboard behavior
  component styles
  GitHub shadcn registry catalog
  standalone examples and tests

ReadRun repository
  [quiz] block syntax
  source positions and author diagnostics
  Markdown and math rendering
  serializable browser payload
  island discovery and React mounting
  conversion from ReadRun payload to quizcn props
```

The dependency points in one direction: ReadRun may install source from
quizcn, but quizcn must not import ReadRun or encode assumptions about ReadRun
content folders. The installed files are a committed consumer snapshot;
upstream behavior ownership remains in quizcn.

## Standalone repository layout

The first release uses one repository rather than a monorepo:

```text
quizcn/
  AGENTS.md
  README.md
  package.json
  bun.lock
  tsconfig.json
  registry.json
  src/
    index.ts
    model.ts
    grading.ts
    session.ts
    Quiz.tsx
    QuizStep.tsx
    QuizResults.tsx
    Questionnaire.tsx
    cn.ts
    styles.css
  examples/
    basic.tsx
  test/
    grading.test.ts
    session.test.ts
    Quiz.test.tsx
  fixtures/
    registry-consumer/
```

All imports between quizcn source files use relative paths. `registry.json`
exposes those canonical source files with consumer targets. There is no
separate registry implementation to drift from the tested source.

`package.json` exists only for Bun scripts and development dependencies. It is
named `quizcn`, remains `private: true`, and has no publishable exports, package
files list, package build, or package-consumer fixture.

## Public model

The React-facing model contains renderable content and no Markdown or HTML
transport assumptions:

```tsx
import type { ReactNode } from "react";

export interface QuizDefinition {
  id: string;
  title: string;
  items: QuizItem[];
}

export interface QuizInfo {
  type: "info";
  id: string;
  content: ReactNode;
}

export interface QuizChoice {
  id: string;
  content: ReactNode;
  correct: boolean;
}

interface QuizQuestionBase {
  id: string;
  prompt: ReactNode;
  hint?: ReactNode;
  explanation?: ReactNode;
}

export interface SingleChoiceQuestion extends QuizQuestionBase {
  type: "single";
  choices: QuizChoice[];
}

export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: "multi";
  choices: QuizChoice[];
}

export interface TrueFalseQuestion extends QuizQuestionBase {
  type: "truefalse";
  choices: QuizChoice[];
}

export interface FreeTextQuestion extends QuizQuestionBase {
  type: "freetext";
  answer: {
    expected: string;
    caseSensitive?: boolean;
  };
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FreeTextQuestion;

export type QuizItem = QuizInfo | QuizQuestion;
```

True/false questions use the same choice representation as other choice
questions. There is no separate `correctAnswer` property, so the model cannot
contain two conflicting correct answers. Validation requires exactly the two
case-insensitive labels `True` and `False` and exactly one correct choice.

Answers to every choice question use choice IDs. A true/false answer is no
longer represented as a separate boolean shape. This keeps selection, grading,
and submitted-answer serialization consistent across choice questions.

## Component API

The initial component is intentionally uncontrolled:

```tsx
export interface QuizProps {
  quiz: QuizDefinition;
  className?: string;
  onComplete?: (result: QuizResult) => void;
}

export function Quiz(props: QuizProps): React.JSX.Element;
```

`QuizResult` contains the final score, submitted answers, and per-question
grades:

```ts
export interface QuizResult {
  correct: number;
  total: number;
  answers: Readonly<Record<string, SubmittedAnswer>>;
  grades: Readonly<Record<string, GradeResult>>;
}
```

The installed registry source exposes `Quiz` and its model types. Grading and
session helpers remain separate source modules so consumers may use them for
tests or advanced composition. Internal presentation components are
implementation details of the single registry item.

The public API does not accept pre-rendered HTML and does not use
`dangerouslySetInnerHTML`. Applications pass strings or React elements. This
keeps HTML trust and rich-text rendering in the consuming application.

## Behavior retained from ReadRun

- Information steps participate in forward and backward navigation.
- Readers cannot advance past an unanswered or unchecked question.
- Submitted questions lock their answer.
- Feedback identifies correct and incorrect submissions.
- Explanations appear after grading.
- Hints may be shown or hidden before grading.
- Returning to an earlier step preserves its answer and grade.
- Completion shows a per-question result list and total score.
- Restart clears answers, grades, visible hints, and completion state.
- Keyboard shortcuts and focus movement remain accessible.
- Free-text comparison trims outer whitespace, collapses internal whitespace,
  and defaults to case-insensitive exact matching.

## Styling boundary

The component uses shadcn-compatible semantic tokens such as `background`,
`foreground`, `primary`, `muted`, `destructive`, `border`, `input`, and `ring`.
It preserves the normal shadcn radius scale and does not force square corners.

Canonical component source may use Tailwind utilities. Registry consumers
receive the source and `styles.css`, so their Tailwind build scans and compiles
the installed files.

The source uses small private card, button, and input wrappers rather than
consumer aliases such as `@/components/ui/button`. This keeps the registry item
self-contained and prevents an install from overwriting a consumer's existing
shadcn components.

The first release depends on React 19 and `@shadcn/react/questionnaire`.
Replacing the questionnaire primitive or supporting older React versions is a
separate compatibility decision.

## Registry distribution

The repository root contains a GitHub-compatible `registry.json` with one
initial item named `quiz`. It installs the complete editable component into a
consumer-owned directory such as `components/quiz/` and declares all npm
dependencies required by those files.

The public, reproducible installation command is:

```bash
bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.0
```

The first release does not expose `questionnaire`, `quiz-step`, or grading as
separate registry items. They are implementation files belonging to the single
`quiz` item. Separate items should be introduced only when they have independent
consumers.

Tagged registry installations are the documented reproducible path. An
unpinned main-branch installation may be used for local development only. A
full commit SHA may be used when stronger immutability is required.

The repository does not need a registry server or checked-in generated item
JSON. Its root `registry.json` and referenced source files are the registry.
Local generated output may still be used as an isolated test fixture and must
remain untracked.

Quizcn itself is not an npm dependency. The shadcn CLI may still add the
third-party runtime dependencies declared by the registry item, including
React, `@shadcn/react`, `clsx`, and `tailwind-merge`.

## ReadRun adapter

ReadRun retains a serializable transport model because its server-rendered page
passes quiz content to a browser island through JSON:

```ts
interface ReadRunQuizPayload {
  schemaVersion: 1;
  instanceId: string;
  id: string;
  title: string;
  items: ReadRunQuizPayloadItem[];
}

interface ReadRunRichText {
  html: string;
  text: string;
}
```

After payload validation, a small adapter converts transport content into the
installed quizcn model:

```tsx
function toQuizDefinition(payload: ReadRunQuizPayload): QuizDefinition {
  return {
    id: payload.id,
    title: payload.title,
    items: payload.items.map((item) => {
      // Preserve IDs, answer metadata, and question types.
      // Convert each ReadRunRichText value to <ReadRunRichText value={...} />.
    }),
  };
}

root.render(<Quiz quiz={toQuizDefinition(payload)} />);
```

ReadRun has a `components.json` whose `@components` alias resolves to
`src/presentation/components`. The tag-pinned registry command installs quizcn
under `src/presentation/components/quiz/`. ReadRun imports `Quiz`, model types,
and `styles.css` from that local directory. It does not list quizcn as a
dependency in `package.json`. A developer-facing source note adjacent to the
installed directory records the GitHub item address, exact tag, and update
command; the note is not part of the upstream registry payload.

`ReadRunRichText` owns the trusted rendered HTML and triggers ReadRun's math
rendering after mount. It is the only quiz presentation component that remains
ReadRun-specific.

The adapter also maps true/false payload choices to the unified choice-ID
answer shape. ReadRun may initially retain its existing domain representation
and remove the redundant `correctAnswer` field in a follow-up once transport
and presentation no longer require it.

## Code movement

The initial extraction moves these responsibilities out of ReadRun:

| Current ReadRun area | Destination |
| --- | --- |
| `domain/quiz/grading.ts` | quizcn `grading.ts` |
| `presentation/quiz/session.ts` | quizcn `session.ts` |
| `QuizIsland.tsx` | quizcn `Quiz.tsx` |
| `QuizStep.tsx` UI and feedback | quizcn `QuizStep.tsx` |
| `QuizResults.tsx` | quizcn `QuizResults.tsx` |
| quiz use of `Questionnaire.tsx` | quizcn private wrapper |

These responsibilities remain in ReadRun:

| ReadRun area | Reason |
| --- | --- |
| `domain/quiz/parser.ts` | Parses ReadRun's block AST and syntax |
| `domain/quiz/validation.ts` | Reports author diagnostics with source spans |
| `presentation/quiz/render.ts` | Converts ReadRun Markdown to transport HTML |
| `presentation/quiz/runtime.ts` | Validates the JSON island trust boundary |
| `presentation/quiz/QuizBlock.tsx` | Emits loading, payload, invalid, and no-script HTML |
| `presentation/quiz/mount.tsx` | Discovers ReadRun islands and creates React roots |
| `ReadRunRichText.tsx` | Owns trusted HTML and ReadRun math activation |

Tests move with the behavior they verify. ReadRun keeps parser, validation,
transport, mounting, and end-to-end adapter tests; quizcn owns grading, session,
component, accessibility, and registry-consumer tests.

The committed `src/presentation/components/quiz/` snapshot is not an
independent ReadRun implementation. Changes to generic quiz behavior are made
and tested in quizcn first, released under a new immutable tag, then installed
into ReadRun with the shadcn CLI and reviewed as a source update.

## Validation strategy

Quizcn validates structural rules that apply to direct React consumers:

- quiz and item IDs are non-empty and unique;
- at least one question exists;
- single-choice questions have exactly one correct choice;
- multiple-choice questions have at least one correct choice;
- true/false questions have exactly `True` and `False` choices and one correct
  choice;
- choice IDs are unique within a question;
- free-text expected answers are non-empty.

Validation issues do not contain file paths or line numbers. ReadRun continues
to produce richer author diagnostics before rendering and should not depend on
quizcn validation for source reporting.

The React component fails closed for invalid definitions by rendering an
accessible "Quiz unavailable" message in development and production rather
than attempting a partially valid session.

## Release and compatibility

The first public release is the immutable Git tag `v0.1.0`. Until `1.0.0`,
minor tags may adjust the installed model, but changes must be documented and
covered by source and registry-consumer tests.

ReadRun pins the source snapshot by recording the exact tagged install command
in its documentation and committing the installed files. A quizcn release is
not complete until a fresh fixture installs from the public GitHub tag and
passes the behavior contract. The release commit must be reachable from the
public repository's default branch before the tag is pushed.

## Implementation sequence

1. Create the standalone repository with Bun, React 19, and tests.
2. Copy grading and session behavior with their existing tests, then replace
   ReadRun-specific model imports with the public quizcn model.
3. Copy the quiz React components and remove ReadRun UI, math, HTML, and domain
   imports.
4. Add the public `<Quiz quiz={...} />` API and standalone example.
5. Add component CSS and verify the standalone example.
6. Add `registry.json` pointing at the canonical source and verify a clean
   registry-consumer fixture with `shadcn add`.
7. Prove the ReadRun adapter against the exact local registry source while the
   legacy implementation remains recoverable.
8. Remove npm-package scaffolding, finalize the GitHub registry metadata, push
   the verified release commit and immutable `v0.1.0` tag, and verify a fresh
   public-tag install.
9. Install the tagged registry source into ReadRun, switch the island mount to
   local installed imports, move or replace tests according to the ownership
   table, and delete superseded
   ReadRun grading, session, and UI code.
10. Run both repositories' full checks and verify ReadRun's documented quiz
    examples in development and static builds.

Each repository must remain passing at its own commit boundary. ReadRun does
not delete its implementation until the registry consumer path has been proven.

## Success criteria

1. The quizcn source tree contains no ReadRun import, type, path, runtime, or
   theme dependency.
2. Quizcn contains no npm publication configuration, package build, package
   tarball contract, or package-consumer fixture and remains `private: true`.
3. A clean shadcn fixture can install
   `EdwardAstill/quizcn/quiz#v0.1.0`, build, and run a complete quiz from the
   public GitHub source.
4. Canonical source and installed registry source pass the same grading,
   navigation, results, accessibility, and restart behavior tests.
5. ReadRun imports quizcn only from its committed shadcn-installed source and
   has no `@quizcn/react` dependency or npm lock entry.
6. ReadRun's `[quiz]` examples retain their current rendered behavior through a
   small transport-to-props adapter.
7. ReadRun no longer owns a separate grading, session reducer, quiz step, quiz
   result, or questionnaire presentation implementations.
8. ReadRun typechecking, tests, strict docs validation, and static docs build
   pass with the standalone dependency.
