import type { QuizChoice, QuizDefinition, QuizItem, QuizQuestion } from "./model";

export interface QuizValidationIssue {
  code: string;
  message: string;
}

export function validateQuizDefinition(
  quiz: QuizDefinition,
): readonly QuizValidationIssue[] {
  const issues: QuizValidationIssue[] = [];

  if (!quiz.id.trim()) {
    issues.push(issue("quiz.id.empty", "Quiz ID must not be empty."));
  }

  if (quiz.items.length === 0) {
    issues.push(issue("quiz.items.empty", "Quiz must contain at least one item."));
  }

  if (!quiz.items.some(isQuestion)) {
    issues.push(issue("quiz.question.missing", "Quiz must contain at least one question."));
  }

  const itemIds = new Set<string>();
  for (const item of quiz.items) {
    if (!item.id.trim()) {
      issues.push(issue("quiz.item.id.empty", "Quiz item ID must not be empty."));
    } else if (itemIds.has(item.id)) {
      issues.push(
        issue("quiz.item.id.duplicate", `Quiz item ID "${item.id}" must be unique.`),
      );
    } else {
      itemIds.add(item.id);
    }

    if (item.type !== "info") {
      validateQuestion(item, issues);
    }
  }

  return issues;
}

function validateQuestion(
  question: QuizQuestion,
  issues: QuizValidationIssue[],
): void {
  if (question.type === "freetext") {
    if (!question.answer.expected.trim()) {
      issues.push(
        issue(
          "quiz.freetext.answer.empty",
          `Free-text question "${question.id}" must define a non-empty expected answer.`,
        ),
      );
    }
    return;
  }

  validateChoiceIds(question.choices, issues);

  const correctCount = question.choices.filter((choice) => choice.correct).length;
  if (question.type === "single" && correctCount !== 1) {
    issues.push(
      issue(
        "quiz.single.correct-count",
        `Single-choice question "${question.id}" must have exactly one correct choice.`,
      ),
    );
  }

  if (question.type === "multi" && correctCount < 1) {
    issues.push(
      issue(
        "quiz.multi.correct-count",
        `Multiple-choice question "${question.id}" must have at least one correct choice.`,
      ),
    );
  }

  if (question.type === "truefalse") {
    const labels = question.choices.map(normalizedTrueFalseLabel);
    const validLabels =
      question.choices.length === 2 &&
      labels.includes("true") &&
      labels.includes("false") &&
      labels.every((label) => label !== null);

    if (!validLabels) {
      issues.push(
        issue(
          "quiz.truefalse.shape",
          `True/false question "${question.id}" must contain exactly two plain-string choices labeled True and False.`,
        ),
      );
    }

    if (correctCount !== 1) {
      issues.push(
        issue(
          "quiz.truefalse.correct-count",
          `True/false question "${question.id}" must have exactly one correct choice.`,
        ),
      );
    }
  }
}

function validateChoiceIds(
  choices: QuizChoice[],
  issues: QuizValidationIssue[],
): void {
  const choiceIds = new Set<string>();

  for (const choice of choices) {
    if (!choice.id.trim()) {
      issues.push(
        issue("quiz.choice.id.empty", "Choice ID must not be empty."),
      );
    } else if (choiceIds.has(choice.id)) {
      issues.push(
        issue(
          "quiz.choice.id.duplicate",
          `Choice ID "${choice.id}" must be unique within a question.`,
        ),
      );
    } else {
      choiceIds.add(choice.id);
    }
  }
}

function normalizedTrueFalseLabel(choice: QuizChoice): string | null {
  return typeof choice.content === "string" ? choice.content.trim().toLowerCase() : null;
}

function isQuestion(item: QuizItem): item is QuizQuestion {
  return item.type !== "info";
}

function issue(code: string, message: string): QuizValidationIssue {
  return { code, message };
}
