# Quizzes in notes

Put a `[quiz]...[/quiz]` block directly in an ordinary Markdown note. The quiz
stays at that point in the page and works in both the development server and a
static build.

A quiz can contain reading steps plus single-choice, multiple-choice,
true/false, and free-text questions. Readers answer deliberately, see feedback,
move backward without losing answers, receive a score, and can restart.

## Live example

[quiz id=mechanics-check title="Mechanics check"]

[info id=setup]
Use the relationship \(F = ma\). In component form:

\[
F_x = m a_x
\]
[/info]

[question id=force-unit type=single]
Which SI unit measures **force**?

- [ ] Joule
- [x] Newton
- [ ] Watt

[hint]
The unit is named after the scientist associated with the laws of motion.
[/hint]

[explain]
A newton is \(1\,\mathrm{kg\,m\,s^{-2}}\).
[/explain]
[/question]

[question id=equal-four type=multi]
Which expressions equal \(4\)?

- [x] \(2 + 2\)
- [x] \(2^2\)
- [ ] \(2 \times 4\)
[/question]

[question id=constant-velocity type=truefalse]
An object moving at constant velocity has zero acceleration.

- [x] True
- [ ] False
[/question]

[question id=complete-law type=freetext case-sensitive=false]
Complete the relationship: force equals mass times ____.

= acceleration
[/question]

[/quiz]

This second quiz demonstrates that several quizzes in one note keep separate
progress and answers.

[quiz id=second-check title="Independent check"]
[question type=truefalse]
This quiz has its own state.

- [x] True
- [ ] False
[/question]
[/quiz]

## Canonical syntax

Use nested, explicitly typed blocks:

```markdown
[quiz id=derivatives title="Derivative check"]

[info]
Use the power rule \(\frac{d}{dx}x^n = nx^{n-1}\).
[/info]

[question id=power-rule type=single]
What is the derivative of \(x^3\)?

- [ ] \(x^2\)
- [x] \(3x^2\)
- [ ] \(3x\)

[hint]
Substitute \(n=3\) into the power rule.
[/hint]

[explain]
\[
\frac{d}{dx}x^3 = 3x^2
\]
[/explain]
[/question]

[/quiz]
```

Only `[info]` and `[question]` are valid directly inside `[quiz]`. A question
may contain one `[hint]` and one `[explain]` block.

## Question types

Choice answers use Markdown task-list markers. A checked item (`[x]`) is
correct and an unchecked item (`[ ]`) is a distractor.

| Type | Answer rules |
| --- | --- |
| `single` | At least two choices and exactly one checked answer. |
| `multi` | At least two choices and one or more checked answers. Readers must select the exact correct set. |
| `truefalse` | Exactly the choices `True` and `False`, with one checked. Either order is allowed. |
| `freetext` | Exactly one `= expected answer` line. |

Free-text answers are trimmed, internal whitespace is collapsed, and matching
is case-insensitive by default. Add `case-sensitive=true` to a `freetext`
question when capitalization matters. Matching is exact after that
normalization.

## IDs and titles

`[quiz]` accepts optional `id` and `title` attributes. `[question]` and `[info]`
accept optional `id` attributes. IDs must start with a letter and then use only
letters, numbers, `_`, or `-`.

ReadRun generates deterministic IDs when they are omitted. Explicit IDs are
useful when source changes frequently, but every quiz ID must be unique on its
page and every item ID must be unique within its quiz.

## Markdown and math

Information, prompts, choices, hints, and explanations use the same Markdown
engine as the surrounding note. That includes links, wikilinks, code, raw HTML
under the normal trusted-author policy, and all supported math delimiters:

- `$...$` and `\(...\)` for inline math;
- `$$...$$` and `\[...\]` for display math.

Headings inside quiz content do not appear in the page table of contents.

## Validation and legacy quizzes

Run `rr validate <content>` to catch missing types, malformed answer markers,
duplicate IDs, misplaced blocks, empty prompts, and invalid correct-answer
counts. Diagnostics include the note and source line.

The earlier compact blank-line format still renders temporarily and reports a
`quiz.syntax.legacy` migration warning. Move each reading section into `[info]`
and each question into an explicitly typed `[question]` block.

Trailing-star answers were never a working quiz-in-notes format. Replace:

```markdown
- Correct answer *
```

with:

```markdown
- [x] Correct answer
```

## Static-site limitation

ReadRun grades in the browser without a server, so correct answers are included
in the generated HTML payload and can be inspected. Quizzes are intended for
self-study and knowledge checks, not secure examinations.

## Not yet supported

Standalone quiz files, a global Quizzes tab, grouped or multipart questions,
randomization, saved progress, analytics, remote submission, answer ranges,
regular expressions, and alternative-answer lists are not currently supported.
