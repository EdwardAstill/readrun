import { expect, test } from "bun:test";
import * as React from "react";

import { toQuizDefinition } from "./adapter.tsx";
import type {
	RenderedQuizDefinition,
	RenderedRichText,
} from "./model.ts";
import { ReadRunRichText } from "./ReadRunRichText.tsx";

const rich = (name: string): RenderedRichText => ({
	html: `<p data-source="${name}">${name} <strong>HTML</strong></p>`,
	text: `${name} text`,
});

test("toQuizDefinition preserves the transport contract without leaking HTML strings or mutating it", () => {
	const payload: RenderedQuizDefinition = {
		schemaVersion: 1,
		instanceId: "page-check-1",
		id: "check",
		title: "Quick check",
		items: [
			{ type: "info", id: "info-1", content: rich("info") },
			{
				type: "single",
				id: "single-1",
				prompt: rich("single prompt"),
				hint: rich("single hint"),
				explanation: rich("single explanation"),
				choices: [
					{ id: "single-a", content: rich("single A"), correct: false },
					{ id: "single-b", content: rich("single B"), correct: true },
				],
			},
			{
				type: "multi",
				id: "multi-1",
				prompt: rich("multi prompt"),
				choices: [
					{ id: "multi-a", content: rich("multi A"), correct: true },
					{ id: "multi-b", content: rich("multi B"), correct: false },
					{ id: "multi-c", content: rich("multi C"), correct: true },
				],
			},
			{
				type: "truefalse",
				id: "truth-1",
				prompt: rich("truth prompt"),
				hint: rich("truth hint"),
				choices: [
					{
						id: "truth-yes",
						content: { html: "<strong>True</strong>", text: "True" },
						correct: true,
					},
					{
						id: "truth-no",
						content: { html: "<em>False</em>", text: "False" },
						correct: false,
					},
				],
			},
			{
				type: "freetext",
				id: "free-1",
				prompt: rich("free prompt"),
				explanation: rich("free explanation"),
				answer: { expected: "Alpha", caseSensitive: true },
			},
		],
	};
	const original = structuredClone(payload);
	const sourceInfo = payload.items[0];
	const sourceSingle = payload.items[1];
	const sourceMulti = payload.items[2];
	const sourceTruth = payload.items[3];
	const sourceFree = payload.items[4];
	if (sourceInfo?.type !== "info") throw new Error("Expected source info item");
	if (sourceSingle?.type !== "single") {
		throw new Error("Expected source single question");
	}
	if (sourceMulti?.type !== "multi") {
		throw new Error("Expected source multi question");
	}
	if (sourceTruth?.type !== "truefalse") {
		throw new Error("Expected source true/false question");
	}
	if (sourceFree?.type !== "freetext") {
		throw new Error("Expected source free-text question");
	}

	const quiz = toQuizDefinition(payload);

	expect(quiz.id).toBe("check");
	expect(quiz.title).toBe("Quick check");
	expect(quiz.items.map((item) => [item.type, item.id])).toEqual([
		["info", "info-1"],
		["single", "single-1"],
		["multi", "multi-1"],
		["truefalse", "truth-1"],
		["freetext", "free-1"],
	]);

	const info = quiz.items[0];
	if (info?.type !== "info") throw new Error("Expected info item");
	expectRichText(info.content, sourceInfo.content);

	const single = quiz.items[1];
	if (single?.type !== "single") throw new Error("Expected single question");
	expectRichText(single.prompt, sourceSingle.prompt);
	expectRichText(single.hint, sourceSingle.hint!);
	expectRichText(single.explanation, sourceSingle.explanation!);
	expect(single.choices.map((choice) => [choice.id, choice.correct])).toEqual([
		["single-a", false],
		["single-b", true],
	]);
	expectRichText(
		single.choices[0]!.content,
		sourceSingle.choices[0]!.content,
	);
	expectRichText(
		single.choices[1]!.content,
		sourceSingle.choices[1]!.content,
	);

	const multi = quiz.items[2];
	if (multi?.type !== "multi") throw new Error("Expected multi question");
	expectRichText(multi.prompt, sourceMulti.prompt);
	expect(multi.choices.map((choice) => [choice.id, choice.correct])).toEqual([
		["multi-a", true],
		["multi-b", false],
		["multi-c", true],
	]);
	for (const [index, choice] of multi.choices.entries()) {
		expectRichText(choice.content, sourceMulti.choices[index]!.content);
	}

	const truth = quiz.items[3];
	if (truth?.type !== "truefalse") throw new Error("Expected true/false question");
	expectRichText(truth.prompt, sourceTruth.prompt);
	expectRichText(truth.hint, sourceTruth.hint!);
	expect(truth.choices).toEqual([
		{ id: "truth-yes", content: "True", correct: true },
		{ id: "truth-no", content: "False", correct: false },
	]);
	expect("correctAnswer" in truth).toBe(false);

	const free = quiz.items[4];
	if (free?.type !== "freetext") throw new Error("Expected free-text question");
	expectRichText(free.prompt, sourceFree.prompt);
	expectRichText(free.explanation, sourceFree.explanation!);
	expect(free.answer).toEqual({ expected: "Alpha", caseSensitive: true });

	expect(payload).toEqual(original);
});

function expectRichText(
	content: React.ReactNode,
	expected: RenderedRichText,
): void {
	expect(typeof content).not.toBe("string");
	expect(React.isValidElement(content)).toBe(true);
	if (
		!React.isValidElement<{ value: RenderedRichText }>(content)
	) {
		throw new Error("Expected a ReadRun rich-text element");
	}
	expect(content.type).toBe(ReadRunRichText);
	expect(content.props.value).toBe(expected);
	expect("inline" in content.props).toBe(false);
}
