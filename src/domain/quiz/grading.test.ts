import { expect, test } from "bun:test";

import type {
	GradeResult,
	QuizDefinition,
	QuizQuestionDefinition,
	QuizSourceSpan,
	RichTextSource,
} from "./model.ts";
import { gradeAnswer, normalizeFreeText, scoreQuiz } from "./grading.ts";

const source: QuizSourceSpan = { relPath: "quiz.md", startLine: 1, endLine: 2 };
const rich = (markdown: string): RichTextSource => ({ markdown, source });
const common = { id: "q-1", prompt: rich("Prompt"), source };

test("gradeAnswer grades single choices and rejects unknown values", () => {
	const question: QuizQuestionDefinition = {
		...common,
		type: "single",
		choices: [
			{ id: "a", content: rich("A"), correct: false },
			{ id: "b", content: rich("B"), correct: true },
		],
	};
	expect(gradeAnswer(question, "b").correct).toBe(true);
	expect(gradeAnswer(question, "a").correct).toBe(false);
	expect(gradeAnswer(question, "missing").error).toBe("unknown-choice");
	expect(gradeAnswer(question, ["b"]).error).toBe("invalid-answer-shape");
});

test("gradeAnswer grades multiple choices as an order-independent exact set", () => {
	const question: QuizQuestionDefinition = {
		...common,
		type: "multi",
		choices: [
			{ id: "a", content: rich("A"), correct: true },
			{ id: "b", content: rich("B"), correct: false },
			{ id: "c", content: rich("C"), correct: true },
		],
	};
	expect(gradeAnswer(question, ["c", "a", "a"]).correct).toBe(true);
	expect(gradeAnswer(question, ["a"]).correct).toBe(false);
	expect(gradeAnswer(question, ["a", "b", "c"]).correct).toBe(false);
	expect(gradeAnswer(question, ["unknown"]).error).toBe("unknown-choice");
});

test("gradeAnswer grades true/false and normalized free text", () => {
	const truth: QuizQuestionDefinition = {
		...common,
		type: "truefalse",
		choices: [
			{ id: "true", content: rich("True"), correct: false },
			{ id: "false", content: rich("False"), correct: true },
		],
		correctAnswer: false,
	};
	const text: QuizQuestionDefinition = {
		...common,
		id: "q-2",
		type: "freetext",
		answer: { expected: "New York", caseSensitive: false },
	};
	expect(gradeAnswer(truth, false).correct).toBe(true);
	expect(gradeAnswer(truth, "false").error).toBe("invalid-answer-shape");
	expect(gradeAnswer(text, "  NEW   york ").correct).toBe(true);
	expect(normalizeFreeText(" A   B ", { caseSensitive: true })).toBe("A B");
});

test("case-sensitive free text and quiz scoring ignore info items", () => {
	const question: QuizQuestionDefinition = {
		...common,
		type: "freetext",
		answer: { expected: "Newton", caseSensitive: true },
	};
	expect(gradeAnswer(question, "newton").correct).toBe(false);
	const definition: QuizDefinition = {
		schemaVersion: 1,
		id: "quiz-1",
		source,
		items: [
			{ type: "info", id: "info-1", content: rich("Read"), source },
			question,
		],
	};
	const grades: Record<string, GradeResult> = {
		"q-1": gradeAnswer(question, "Newton"),
	};
	expect(scoreQuiz(definition, grades)).toEqual({ correct: 1, total: 1 });
});
