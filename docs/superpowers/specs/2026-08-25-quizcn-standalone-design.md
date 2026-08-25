# Quizcn Standalone Design

**Status:** Draft

## Purpose

Extract the reusable quiz model, grading, session behavior, and React interface
into an independent project. The standalone project is the canonical owner of
quiz behavior and UI. ReadRun becomes one consumer through a small adapter that
translates `[quiz]` Markdown into the standalone component's public API.

`quizcn`, `@quizcn/react`, and `owner/quizcn` are working names. Final package,
repository, and registry names must be chosen before the first public release.

## Goals

- Make quizzes usable in React applications without ReadRun.
- Publish one canonical implementation in two forms:
  - an npm package for consumers that want imports and versioned upgrades;
  - a shadcn registry item for consumers that want editable source.
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

## Ownership boundary

```text
quizcn repository
  model and public types
  grading
  quiz session reducer
  React quiz components
  accessibility and keyboard behavior
  package build and package styles
  shadcn registry catalog
  standalone examples and tests

ReadRun repository
  [quiz] block syntax
  source positions and author diagnostics
  Markdown and math rendering
  serializable browser payload
  island discovery and React mounting
  conversion from ReadRun payload to quizcn props
```

The dependency points in one direction: ReadRun may depend on quizcn, but
quizcn must not import ReadRun or encode assumptions about ReadRun content
folders.

## Standalone repository layout

The first release uses one package rather than a monorepo:

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
    package-consumer/
    registry-consumer/
```

All imports between quizcn source files use relative paths. The npm package
builds `src/`, while `registry.json` exposes those same source files with
consumer targets. There is no separate registry implementation to drift from
the package.

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

The package also exports `gradeAnswer`, `scoreQuiz`, `createQuizSession`, and
`reduceQuizSession` for tests and advanced composition. Internal presentation
components are not public in the first release.

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

Canonical component source may use Tailwind utilities. Distribution handles
them differently:

- Registry consumers receive the source, so their Tailwind build scans it.
- Package consumers import `@quizcn/react/styles.css`, which contains the
  compiled styles required by the packaged components.

The source uses small private card, button, and input wrappers rather than
consumer aliases such as `@/components/ui/button`. This lets the same relative
source files work as both package input and registry output. It also prevents a
registry install from overwriting a consumer's existing shadcn components.

The first release depends on React 19 and `@shadcn/react/questionnaire`.
Replacing the questionnaire primitive or supporting older React versions is a
separate compatibility decision.

## Package distribution

The repository publishes one package with a working name of `@quizcn/react`.
It exports:

```text
@quizcn/react
@quizcn/react/styles.css
```

React and React DOM are peer dependencies. `@shadcn/react/questionnaire` is a
runtime dependency unless package testing shows that it can safely be a peer.
The package includes TypeScript declarations and ESM output.

ReadRun uses the package form because it should receive versioned fixes without
owning a copied quiz implementation.

## Registry distribution

The repository root contains a GitHub-compatible `registry.json` with one
initial item named `quiz`. It installs the complete editable component into a
consumer-owned directory such as `components/quiz/` and declares all npm
dependencies required by those files.

Example installation, using placeholder ownership:

```bash
bunx shadcn@latest add owner/quizcn/quiz#v0.1.0
```

The first release does not expose `questionnaire`, `quiz-step`, or grading as
separate registry items. They are implementation files belonging to the single
`quiz` item. Separate items should be introduced only when they have independent
consumers.

Tagged registry installations are documented as the reproducible path. An
unpinned main-branch installation may be documented for development only.

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

After payload validation, a small adapter converts transport content into
quizcn React props:

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

The first public release is `0.1.0`. Until `1.0.0`, minor releases may adjust
the public model, but changes must be documented and covered by package and
registry fixtures.

ReadRun pins a compatible package range in `package.json` and the exact resolved
version in `bun.lock`. Registry documentation recommends tag-pinned installs.

Quizcn's package version and repository tag use the same version. A release is
not complete unless both package and registry consumer fixtures pass against
that tag's source.

## Implementation sequence

1. Create the standalone repository with Bun, React 19, tests, and package
   build configuration.
2. Copy grading and session behavior with their existing tests, then replace
   ReadRun-specific model imports with the public quizcn model.
3. Copy the quiz React components and remove ReadRun UI, math, HTML, and domain
   imports.
4. Add the public `<Quiz quiz={...} />` API and standalone example.
5. Build package CSS and verify a package-consumer fixture.
6. Add `registry.json` pointing at the canonical source and verify a clean
   registry-consumer fixture with `shadcn add`.
7. Publish a prerelease or produce a package tarball for integration testing.
8. Add the ReadRun adapter and switch its island mount to `@quizcn/react`.
9. Move or replace tests according to the ownership table and delete superseded
   ReadRun grading, session, and UI code.
10. Run both repositories' full checks and verify ReadRun's documented quiz
    examples in development and static builds.

Each repository must remain passing at its own commit boundary. ReadRun does
not delete its implementation until the package consumer path has been proven.

## Success criteria

1. The quizcn source tree contains no ReadRun import, type, path, runtime, or
   theme dependency.
2. A clean React fixture can import `@quizcn/react`, import its stylesheet, and
   run a complete quiz.
3. A clean shadcn fixture can install the tagged `quiz` registry item, build,
   and run the same behavior without depending on `@quizcn/react`.
4. Package and registry forms pass the same grading, navigation, results,
   accessibility, and restart behavior tests.
5. ReadRun's `[quiz]` examples retain their current rendered behavior through a
   small transport-to-props adapter.
6. ReadRun no longer owns duplicate grading, session reducer, quiz step, quiz
   result, or questionnaire presentation implementations.
7. ReadRun typechecking, tests, strict docs validation, and static docs build
   pass with the standalone dependency.
