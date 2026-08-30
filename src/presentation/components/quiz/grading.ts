import type {
  GradeResult,
  QuizDefinition,
  QuizQuestion,
  QuizResult,
  SubmittedAnswer,
} from "./model";

export function gradeAnswer(
  question: QuizQuestion,
  submitted: SubmittedAnswer,
): GradeResult {
  switch (question.type) {
    case "single":
    case "truefalse":
      return gradeSingleChoice(question, submitted);
    case "multi":
      return gradeMultipleChoice(question, submitted);
    case "freetext":
      return gradeFreeText(question, submitted);
  }
}

export function scoreQuiz(
  definition: QuizDefinition,
  answers: Readonly<Record<string, SubmittedAnswer>>,
): QuizResult {
  const grades = Object.fromEntries(
    definition.items
      .filter((item): item is QuizQuestion => item.type !== "info")
      .flatMap((question) => {
        const submitted = answers[question.id];
        return submitted === undefined
          ? []
          : [[question.id, gradeAnswer(question, submitted)]];
      }),
  ) as Record<string, GradeResult>;

  const questions = definition.items.filter(
    (item): item is QuizQuestion => item.type !== "info",
  );

  return {
    correct: questions.filter((question) => grades[question.id]?.correct).length,
    total: questions.length,
    answers,
    grades,
  };
}

function gradeSingleChoice(
  question: Extract<QuizQuestion, { type: "single" | "truefalse" }>,
  submitted: SubmittedAnswer,
): GradeResult {
  const expected = question.choices.find((choice) => choice.correct)?.id ?? "";

  if (typeof submitted !== "string") {
    return invalid(submitted, expected, "invalid-answer-shape");
  }

  if (!question.choices.some((choice) => choice.id === submitted)) {
    return invalid(submitted, expected, "unknown-choice");
  }

  return {
    correct: submitted === expected,
    submitted,
    expected,
  };
}

function gradeMultipleChoice(
  question: Extract<QuizQuestion, { type: "multi" }>,
  submitted: SubmittedAnswer,
): GradeResult {
  const expected = question.choices
    .filter((choice) => choice.correct)
    .map((choice) => choice.id)
    .sort();

  if (!Array.isArray(submitted) || !submitted.every((value) => typeof value === "string")) {
    return invalid(submitted, expected, "invalid-answer-shape");
  }

  const known = new Set(question.choices.map((choice) => choice.id));
  if (submitted.some((value) => !known.has(value))) {
    return invalid(submitted, expected, "unknown-choice");
  }

  const normalized = [...new Set(submitted)].sort();

  return {
    correct:
      normalized.length === expected.length &&
      normalized.every((value, index) => value === expected[index]),
    submitted: normalized,
    expected,
  };
}

function gradeFreeText(
  question: Extract<QuizQuestion, { type: "freetext" }>,
  submitted: SubmittedAnswer,
): GradeResult {
  if (typeof submitted !== "string") {
    return invalid(submitted, question.answer.expected, "invalid-answer-shape");
  }

  const options = { caseSensitive: question.answer.caseSensitive };
  const normalizedSubmitted = normalizeFreeText(submitted, options);
  const normalizedExpected = normalizeFreeText(question.answer.expected, options);

  return {
    correct: normalizedSubmitted === normalizedExpected,
    submitted: normalizedSubmitted,
    expected: normalizedExpected,
  };
}

function normalizeFreeText(
  value: string,
  options: { caseSensitive?: boolean } = {},
): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return options.caseSensitive ? normalized : normalized.toLocaleLowerCase();
}

function invalid(
  submitted: SubmittedAnswer,
  expected: SubmittedAnswer,
  error: NonNullable<GradeResult["error"]>,
): GradeResult {
  return {
    correct: false,
    submitted,
    expected,
    error,
  };
}
