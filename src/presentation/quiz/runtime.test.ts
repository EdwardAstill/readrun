import { expect, test } from "bun:test";

import type { RenderedQuizDefinition } from "./model.ts";
import { parseQuizPayload, serializeQuizPayload } from "./runtime.ts";

function definition(): RenderedQuizDefinition {
	return {
		schemaVersion: 1,
		instanceId: "page-quiz-1",
		id: "quiz-1",
		title: "Quiz",
		items: [
			{
				type: "single",
				id: "q-1",
				prompt: { html: "<p>Prompt</p>", text: "Prompt" },
				choices: [
					{
						id: "a",
						content: { html: "A", text: "A" },
						correct: true,
					},
					{
						id: "b",
						content: { html: "B", text: "B" },
						correct: false,
					},
				],
			},
		],
	};
}

test("quiz payload serialization cannot break out of a script element", () => {
	const value = definition();
	value.items[0]!.type === "single" &&
		(value.items[0]!.prompt.html = "</script>\u2028\u2029");
	const serialized = serializeQuizPayload(value);

	expect(serialized).not.toContain("</script>");
	expect(serialized).not.toContain("\u2028");
	expect(serialized).not.toContain("\u2029");
	expect(serialized).toContain("\\u003c/script>");
	expect(parseQuizPayload(serialized)).toEqual(value);
});

test("parseQuizPayload rejects unknown schemas, malformed items, and duplicate IDs", () => {
	expect(() => parseQuizPayload('{"schemaVersion":2}')).toThrow(
		"Unsupported quiz payload schema",
	);
	const malformed = definition() as unknown as { items: unknown[] };
	malformed.items = [{ type: "unknown", id: "bad" }];
	expect(() => parseQuizPayload(JSON.stringify(malformed))).toThrow(
		"unsupported type",
	);
	const duplicate = definition();
	duplicate.items.push({
		type: "info",
		id: "q-1",
		content: { html: "Info", text: "Info" },
	});
	expect(() => parseQuizPayload(JSON.stringify(duplicate))).toThrow(
		"duplicate item ID",
	);
});
