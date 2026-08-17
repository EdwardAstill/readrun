import { expect, test } from "bun:test";

import type { Block } from "../blocks/model.ts";
import { parseBlockTree } from "../blocks/parser.ts";
import { parseQuiz } from "./parser.ts";

function parse(source: string) {
	const tree = parseBlockTree(source).tree;
	const block = tree.find(
		(node): node is Block => node.type === "block" && node.name === "quiz",
	);
	if (!block) throw new Error("Quiz block not found");
	return parseQuiz(block, { relPath: "legacy.md", quizIndex: 1 });
}

test("legacy compact quizzes translate to the canonical model with one warning", () => {
	const result = parse(`[quiz title="Legacy"]
Read this first.

Pick one
- [ ] A
- [x] B
_ A hint
> An explanation

Choose all
- [x] A
- [x] B

Is it true?
true

Name it
= Answer
[/quiz]`);

	expect(result.syntax).toBe("legacy");
	expect(result.definition?.id).toBe("quiz-2");
	expect(result.definition?.items.map((item) => item.type)).toEqual([
		"info",
		"single",
		"multi",
		"truefalse",
		"freetext",
	]);
	expect(result.diagnostics).toHaveLength(1);
	expect(result.diagnostics[0]?.code).toBe("quiz.syntax.legacy");
	expect(result.diagnostics[0]?.severity).toBe("warning");
});

test("legacy trailing-star answers get exact task-list migration guidance", () => {
	const result = parse(`[quiz]
Pick one
- Wrong
- Right *
[/quiz]`);

	const issue = result.diagnostics.find((item) => item.code === "quiz.choice.marker");
	expect(issue?.severity).toBe("error");
	expect(issue?.position.line).toBe(4);
	expect(issue?.message).toContain('- [x] Right');
});
