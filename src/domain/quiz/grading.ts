import type {
	GradeResult,
	QuizDefinition,
	QuizQuestionDefinition,
	SubmittedAnswer,
} from "./model.ts";
import { isQuizQuestion } from "./model.ts";

export type GradableQuizQuestion =
	| {
			type: "single" | "multi";
			choices: ReadonlyArray<{ id: string; correct: boolean }>;
	  }
	| {
			type: "truefalse";
			choices: ReadonlyArray<{ id: string; correct: boolean }>;
			correctAnswer: boolean;
	  }
	| {
			type: "freetext";
			answer: { expected: string; caseSensitive: boolean };
	  };

export function normalizeFreeText(
	value: string,
	options: { caseSensitive?: boolean } = {},
): string {
	const normalized = value.trim().replace(/\s+/g, " ");
	return options.caseSensitive ? normalized : normalized.toLocaleLowerCase();
}

export function gradeAnswer(
	question: QuizQuestionDefinition | GradableQuizQuestion,
	submitted: SubmittedAnswer,
): GradeResult {
	switch (question.type) {
		case "single": {
			const expected =
				question.choices.find((choice) => choice.correct)?.id ?? "";
			if (typeof submitted !== "string") {
				return invalid(submitted, expected, "invalid-answer-shape");
			}
			if (!question.choices.some((choice) => choice.id === submitted)) {
				return invalid(submitted, expected, "unknown-choice");
			}
			return { correct: submitted === expected, submitted, expected };
		}
		case "multi": {
			const expected = question.choices
				.filter((choice) => choice.correct)
				.map((choice) => choice.id)
				.sort();
			if (
				!Array.isArray(submitted) ||
				!submitted.every((value) => typeof value === "string")
			) {
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
		case "truefalse":
			if (typeof submitted !== "boolean") {
				return invalid(
					submitted,
					question.correctAnswer,
					"invalid-answer-shape",
				);
			}
			return {
				correct: submitted === question.correctAnswer,
				submitted,
				expected: question.correctAnswer,
			};
		case "freetext": {
			if (typeof submitted !== "string") {
				return invalid(
					submitted,
					question.answer.expected,
					"invalid-answer-shape",
				);
			}
			const options = { caseSensitive: question.answer.caseSensitive };
			const normalizedSubmitted = normalizeFreeText(submitted, options);
			const normalizedExpected = normalizeFreeText(
				question.answer.expected,
				options,
			);
			return {
				correct: normalizedSubmitted === normalizedExpected,
				submitted: normalizedSubmitted,
				expected: normalizedExpected,
			};
		}
	}
}

export function scoreQuiz(
	definition: QuizDefinition,
	grades: Readonly<Record<string, GradeResult>>,
): { correct: number; total: number } {
	const questions = definition.items.filter(isQuizQuestion);
	return {
		correct: questions.filter((question) => grades[question.id]?.correct).length,
		total: questions.length,
	};
}

function invalid(
	submitted: SubmittedAnswer,
	expected: SubmittedAnswer,
	error: NonNullable<GradeResult["error"]>,
): GradeResult {
	return { correct: false, submitted, expected, error };
}
