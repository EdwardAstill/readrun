import { expect, test } from "bun:test";

import type {
	QuizDefinition,
	QuizQuestionDefinition,
	QuizSourceSpan,
	RichTextSource,
} from "./model.ts";
import { validateQuiz } from "./validation.ts";

const source: QuizSourceSpan = {
	relPath: "quiz.md",
	startLine: 1,
	endLine: 20,
};
const rich = (markdown: string): RichTextSource => ({ markdown, source });

function quiz(items: QuizDefinition["items"]): QuizDefinition {
	return { schemaVersion: 1, id: "quiz-1", items, source };
}

test("validateQuiz accepts a complete canonical definition", () => {
	const question: QuizQuestionDefinition = {
		type: "single",
		id: "q-1",
		prompt: rich("Choose one"),
		choices: [
			{ id: "q-1-choice-1", content: rich("A"), correct: false },
			{ id: "q-1-choice-2", content: rich("B"), correct: true },
		],
		source,
	};
	expect(validateQuiz(quiz([question]))).toEqual([]);
});

test("validateQuiz rejects duplicate IDs and invalid answer cardinality", () => {
	const definition = quiz([
		{
			type: "single",
			id: "same",
			prompt: rich(""),
			choices: [
				{ id: "duplicate", content: rich("A"), correct: true },
				{ id: "duplicate", content: rich("B"), correct: true },
			],
			source,
		},
		{ type: "info", id: "same", content: rich("Info"), source },
	]);

	const codes = validateQuiz(definition).map((item) => item.code);
	expect(codes).toEqual(
		expect.arrayContaining([
			"quiz.question.prompt",
			"quiz.question.correct",
			"quiz.choice.duplicate",
			"quiz.id.duplicate",
		]),
	);
});

test("validateQuiz enforces true/false labels and free-text answers", () => {
	const definition = quiz([
		{
			type: "truefalse",
			id: "truth",
			prompt: rich("True?"),
			choices: [
				{ id: "truth-choice-1", content: rich("Yes"), correct: true },
				{ id: "truth-choice-2", content: rich("No"), correct: false },
			],
			correctAnswer: true,
			source,
		},
		{
			type: "freetext",
			id: "text",
			prompt: rich("Answer"),
			answer: { expected: "", caseSensitive: false },
			source,
		},
	]);

	const codes = validateQuiz(definition).map((item) => item.code);
	expect(codes).toContain("quiz.truefalse.options");
	expect(codes).toContain("quiz.question.answer");
});
