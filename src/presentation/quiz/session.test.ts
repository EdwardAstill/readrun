import { expect, test } from "bun:test";

import type { RenderedQuizDefinition, RenderedRichText } from "./model.ts";
import {
	createQuizSession,
	hasAnswer,
	reduceQuizSession,
} from "./session.ts";

const rich = (text: string): RenderedRichText => ({ html: text, text });

function definition(): RenderedQuizDefinition {
	return {
		schemaVersion: 1,
		instanceId: "page-check-1",
		id: "check",
		title: "Check",
		items: [
			{ type: "info", id: "info-1", content: rich("Read") },
			{
				type: "single",
				id: "q-1",
				prompt: rich("One"),
				hint: rich("Hint"),
				choices: [
					{ id: "a", content: rich("A"), correct: true },
					{ id: "b", content: rich("B"), correct: false },
				],
			},
			{
				type: "multi",
				id: "q-2",
				prompt: rich("Several"),
				choices: [
					{ id: "c", content: rich("C"), correct: true },
					{ id: "d", content: rich("D"), correct: true },
					{ id: "e", content: rich("E"), correct: false },
				],
			},
			{
				type: "freetext",
				id: "q-3",
				prompt: rich("Text"),
				answer: { expected: "Answer", caseSensitive: false },
			},
		],
	};
}

test("quiz session requires deliberate submission and locks graded answers", () => {
	const quiz = definition();
	let state = createQuizSession(quiz);
	expect(state.activeItemId).toBe("info-1");

	state = reduceQuizSession(quiz, state, { type: "go-to", itemId: "q-1" });
	expect(state.activeItemId).toBe("q-1");
	state = reduceQuizSession(quiz, state, {
		type: "answer",
		itemId: "q-1",
		answer: "a",
	});
	expect(state.grades).toEqual({});
	expect(state.activeItemId).toBe("q-1");

	const blocked = reduceQuizSession(quiz, state, {
		type: "go-to",
		itemId: "q-2",
	});
	expect(blocked).toBe(state);
	state = reduceQuizSession(quiz, state, { type: "submit", itemId: "q-1" });
	expect(state.grades["q-1"]?.correct).toBe(true);
	const locked = reduceQuizSession(quiz, state, {
		type: "answer",
		itemId: "q-1",
		answer: "b",
	});
	expect(locked).toBe(state);
	const submittedAgain = reduceQuizSession(quiz, state, {
		type: "submit",
		itemId: "q-1",
	});
	expect(submittedAgain).toBe(state);
});

test("quiz session preserves review state, completes only when graded, and restarts", () => {
	const quiz = definition();
	let state = createQuizSession(quiz);
	state = reduceQuizSession(quiz, state, { type: "go-to", itemId: "q-1" });
	state = reduceQuizSession(quiz, state, {
		type: "toggle-hint",
		itemId: "q-1",
	});
	expect(state.visibleHints).toEqual(["q-1"]);
	state = reduceQuizSession(quiz, state, {
		type: "answer",
		itemId: "q-1",
		answer: "b",
	});
	state = reduceQuizSession(quiz, state, { type: "submit", itemId: "q-1" });
	state = reduceQuizSession(quiz, state, { type: "go-to", itemId: "q-2" });
	state = reduceQuizSession(quiz, state, {
		type: "answer",
		itemId: "q-2",
		answer: ["d", "c"],
	});
	state = reduceQuizSession(quiz, state, { type: "submit", itemId: "q-2" });
	state = reduceQuizSession(quiz, state, { type: "go-to", itemId: "q-3" });
	expect(reduceQuizSession(quiz, state, { type: "complete" })).toBe(state);
	state = reduceQuizSession(quiz, state, {
		type: "answer",
		itemId: "q-3",
		answer: "  ANSWER ",
	});
	state = reduceQuizSession(quiz, state, { type: "submit", itemId: "q-3" });
	state = reduceQuizSession(quiz, state, { type: "go-to", itemId: "q-2" });
	expect(state.answers["q-1"]).toBe("b");
	expect(state.grades["q-1"]?.correct).toBe(false);
	state = reduceQuizSession(quiz, state, { type: "go-to", itemId: "q-3" });
	state = reduceQuizSession(quiz, state, { type: "complete" });
	expect(state.phase).toBe("complete");

	state = reduceQuizSession(quiz, state, { type: "restart" });
	expect(state).toEqual(createQuizSession(quiz));
	const mutatedQuiz = definition();
	expect(mutatedQuiz.items[1]).toEqual(quiz.items[1]);
});

test("hasAnswer handles all submitted answer shapes", () => {
	expect(hasAnswer(undefined)).toBe(false);
	expect(hasAnswer("   ")).toBe(false);
	expect(hasAnswer("text")).toBe(true);
	expect(hasAnswer(false)).toBe(true);
	expect(hasAnswer([])).toBe(false);
	expect(hasAnswer(["a"])).toBe(true);
});
