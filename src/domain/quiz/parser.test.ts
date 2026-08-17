import { expect, test } from "bun:test";

import type { Block } from "../blocks/model.ts";
import { parseBlockTree } from "../blocks/parser.ts";
import { parseQuiz } from "./parser.ts";

const context = { relPath: "notes/math.md", quizIndex: 0 };

function quizBlock(source: string): Block {
	const parsed = parseBlockTree(source);
	expect(parsed.issues).toEqual([]);
	const block = parsed.tree.find(
		(node): node is Block => node.type === "block" && node.name === "quiz",
	);
	if (!block) throw new Error("Quiz block not found");
	return block;
}

test("parseQuiz parses every canonical item with stable IDs and source lines", () => {
	const result = parseQuiz(
		quizBlock(`[quiz id=calculus title="Quick check"]

[info id=rule]
Use \\(x^n\\) here.
[/info]

[question id=single-one type=single]
Pick **one**.

- [ ] First
- [x] Second

[hint]
Try the second option.
[/hint]

[explain]
Because **two** is correct.
[/explain]
[/question]

[question type=multi]
Pick several.

- [x] A
- [ ] B
- [x] C
[/question]

[question type=truefalse]
The statement is true.

- [x] True
- [ ] False
[/question]

[question type=freetext case-sensitive=false]
Name the force unit.

= newton
[/question]

[/quiz]`),
		context,
	);

	expect(result.syntax).toBe("canonical");
	expect(result.diagnostics).toEqual([]);
	expect(result.definition?.id).toBe("calculus");
	expect(result.definition?.title).toBe("Quick check");
	expect(result.definition?.items.map((item) => [item.id, item.type])).toEqual([
		["rule", "info"],
		["single-one", "single"],
		["q-2", "multi"],
		["q-3", "truefalse"],
		["q-4", "freetext"],
	]);
	const single = result.definition?.items[1];
	expect(single?.type).toBe("single");
	if (single?.type !== "single") throw new Error("Expected single question");
	expect(single.choices.map((choice) => [choice.id, choice.correct])).toEqual([
		["single-one-choice-1", false],
		["single-one-choice-2", true],
	]);
	expect(single.prompt.markdown).toBe("Pick **one**.");
	expect(single.hint?.markdown).toBe("Try the second option.");
	expect(single.explanation?.markdown).toBe("Because **two** is correct.");
	expect(single.source.startLine).toBe(7);
	expect(single.choices[0]?.content.source.startLine).toBe(10);
	const trueFalse = result.definition?.items[3];
	expect(trueFalse?.type).toBe("truefalse");
	if (trueFalse?.type === "truefalse") {
		expect(trueFalse.correctAnswer).toBe(true);
	}
	const freeText = result.definition?.items[4];
	expect(freeText?.type).toBe("freetext");
	if (freeText?.type === "freetext") {
		expect(freeText.answer).toEqual({ expected: "newton", caseSensitive: false });
	}
});

test("parseQuiz reports malformed owned syntax at the offending line", () => {
	const result = parseQuiz(
		quizBlock(`[quiz extra=yes]
Unexpected text

[group]
Unsupported
[/group]

[question type=single case-sensitive=true]
Prompt
- Answer *
- [ ] Distractor
continuation
[hint]
One
[/hint]
[hint]
Two
[/hint]
[/question]
[/quiz]`),
		context,
	);

	expect(result.diagnostics.map((item) => item.code)).toEqual(
		expect.arrayContaining([
			"quiz.attribute.unknown",
			"quiz.content.unexpected",
			"quiz.group.unsupported",
			"quiz.question.attribute",
			"quiz.choice.marker",
			"quiz.answer.continuation",
			"quiz.hint.duplicate",
		]),
	);
	const marker = result.diagnostics.find((item) => item.code === "quiz.choice.marker");
	expect(marker?.position).toEqual({ relPath: "notes/math.md", line: 10 });
	expect(marker?.message).toContain('- [x] Answer');
	const unknownAttribute = result.diagnostics.find(
		(item) => item.code === "quiz.attribute.unknown",
	);
	expect(unknownAttribute?.position).toEqual({
		relPath: "notes/math.md",
		line: 1,
	});
});

test("parseQuiz rejects missing types and misplaced quiz children without throwing", () => {
	const result = parseQuiz(
		quizBlock(`[quiz]
[hint]
No owner
[/hint]
[question]
Question without a type
[/question]
[/quiz]`),
		context,
	);

	expect(result.definition?.items).toEqual([]);
	expect(result.diagnostics.map((item) => item.code)).toEqual([
		"quiz.child.misplaced",
		"quiz.question.type",
	]);
});
