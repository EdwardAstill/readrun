import { expect, test } from "bun:test";

import type {
	QuizDefinition,
	QuizSourceSpan,
	RichTextSource,
} from "../../domain/quiz/model.ts";
import { renderQuizDefinition } from "./render.ts";

const source: QuizSourceSpan = { relPath: "quiz.md", startLine: 1, endLine: 10 };
const rich = (markdown: string): RichTextSource => ({ markdown, source });

test("renderQuizDefinition renders every visible field and preserves typed answers", () => {
	const definition: QuizDefinition = {
		schemaVersion: 1,
		id: "check",
		title: "Quick check",
		source,
		items: [
			{ type: "info", id: "info-1", content: rich("**Read** this"), source },
			{
				type: "single",
				id: "q-1",
				prompt: rich("What is $x$?"),
				hint: rich("A *hint*"),
				explanation: rich("An explanation"),
				choices: [
					{ id: "a", content: rich("**A**"), correct: true },
					{ id: "b", content: rich("B"), correct: false },
				],
				source,
			},
		],
	};
	const rendered = renderQuizDefinition(definition, {
		instanceId: "page-check-1",
		richText: {
			block: (value) => `<block>${value}</block>`,
			inline: (value) => `<inline>${value}</inline>`,
		},
	});

	expect(rendered.instanceId).toBe("page-check-1");
	expect(rendered.items[0]?.type).toBe("info");
	if (rendered.items[0]?.type === "info") {
		expect(rendered.items[0].content.html).toBe("<block>**Read** this</block>");
		expect(rendered.items[0].content.text).toBe("Read this");
	}
	const question = rendered.items[1];
	if (question?.type !== "single") throw new Error("Expected single question");
	expect(question.prompt.html).toContain("<block>");
	expect(question.hint?.html).toContain("<block>");
	expect(question.explanation?.html).toContain("<block>");
	expect(question.choices[0]).toEqual({
		id: "a",
		content: { html: "<inline>**A**</inline>", text: "A" },
		correct: true,
	});
});

test("renderQuizDefinition derives readable fallback text from trusted HTML", () => {
	const definition: QuizDefinition = {
		schemaVersion: 1,
		id: "html",
		source,
		items: [
			{
				type: "freetext",
				id: "q-1",
				prompt: rich("Choose <em>A</em>."),
				answer: { expected: "A", caseSensitive: false },
				source,
			},
		],
	};
	const rendered = renderQuizDefinition(definition, {
		instanceId: "html-1",
		richText: { block: (value) => value, inline: (value) => value },
	});
	const item = rendered.items[0];
	if (item?.type !== "freetext") throw new Error("Expected free text");
	expect(item.prompt.text).toBe("Choose A.");
});

test("renderQuizDefinition keeps meaningful signs inside LaTeX fallback text", () => {
	const definition: QuizDefinition = {
		schemaVersion: 1,
		id: "math",
		source,
		items: [
			{
				type: "info",
				id: "units",
				content: rich("A newton is \\(1\\,\\mathrm{kg\\,m\\,s^{-2}}\\)."),
				source,
			},
		],
	};
	const rendered = renderQuizDefinition(definition, {
		instanceId: "math-1",
		richText: { block: (value) => value, inline: (value) => value },
	});
	const item = rendered.items[0];
	if (item?.type !== "info") throw new Error("Expected info item");
	expect(item.content.text).toBe("A newton is 1\\,\\mathrm{kg\\,m\\,s^{-2}}.");
});

test("renderQuizDefinition represents true/false correctness only in choice flags", () => {
	const rendered = renderQuizDefinition(
		{
			schemaVersion: 1,
			id: "truth",
			source,
			items: [
				{
					type: "truefalse",
					id: "truth-1",
					prompt: rich("True or false?"),
					choices: [
						{ id: "true", content: rich("True"), correct: true },
						{ id: "false", content: rich("False"), correct: false },
					],
					correctAnswer: true,
					source,
				},
			],
		},
		{
			instanceId: "truth-1",
			richText: { block: (value) => value, inline: (value) => value },
		},
	);
	const item = rendered.items[0];
	if (item?.type !== "truefalse") throw new Error("Expected true/false");
	expect(item.choices.map((choice) => choice.correct)).toEqual([true, false]);
	expect("correctAnswer" in item).toBe(false);
});
