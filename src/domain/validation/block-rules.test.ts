import { expect, test } from "bun:test";

import { validateBlocks } from "./block-rules.ts";

function validate(body: string) {
	return validateBlocks({
		pages: [
			{
				kind: "markdown",
				relPath: "notes/quiz.md",
				title: "Quiz",
				body,
			},
		],
	});
}

test("quiz-owned nested blocks validate without generic unknown warnings", () => {
	const result = validate(`[quiz id=check]
[info]
Read this.
[/info]
[question id=one type=single]
Choose one.
- [x] A
- [ ] B
[hint]
Look closely.
[/hint]
[explain]
A is correct.
[/explain]
[/question]
[/quiz]`);

	expect(result.issues).toEqual([]);
});

test("quiz diagnostics retain targeted codes, severity, path, and source line", () => {
	const result = validate(`[quiz]
[question type=single]
Choose one.
- Answer *
- [ ] Other
[/question]
[group]
No groups
[/group]
[/quiz]`);

	const marker = result.issues.find((issue) => issue.code === "quiz.choice.marker");
	expect(marker?.severity).toBe("error");
	expect(marker?.position).toEqual({ relPath: "notes/quiz.md", line: 4 });
	expect(result.issues.some((issue) => issue.code === "quiz.group.unsupported")).toBe(
		true,
	);
});

test("duplicate quiz item IDs are errors", () => {
	const result = validate(`[quiz]
[question id=same type=single]
One
- [x] A
- [ ] B
[/question]
[question id=same type=single]
Two
- [x] A
- [ ] B
[/question]
[/quiz]`);

	expect(result.errors.some((issue) => issue.code === "quiz.id.duplicate")).toBe(
		true,
	);
});

test("quiz IDs must be unique within a page", () => {
	const result = validate(`[quiz id=same]
[question type=truefalse]
One
- [x] True
- [ ] False
[/question]
[/quiz]
[quiz id=same]
[question type=truefalse]
Two
- [x] True
- [ ] False
[/question]
[/quiz]`);

	const duplicate = result.errors.find(
		(issue) => issue.code === "quiz.id.duplicate",
	);
	expect(duplicate?.message).toContain('Quiz ID "same"');
	expect(duplicate?.position?.line).toBe(8);
});

test("legacy quizzes warn once and still receive semantic validation", () => {
	const result = validate(`[quiz]
Pick one
- [x] A
- [ ] B
[/quiz]`);

	expect(
		result.warnings.filter((issue) => issue.code === "quiz.syntax.legacy"),
	).toHaveLength(1);
	expect(result.errors).toEqual([]);
});

test("quiz-internal names remain unknown outside a quiz", () => {
	const result = validate(`[question type=single]
Not owned by a quiz
[/question]

[mystery]
Unknown
[/mystery]`);

	expect(result.warnings.map((issue) => issue.code)).toEqual([
		"block.unknown",
		"block.unknown",
	]);
	expect(result.warnings[0]?.position?.line).toBe(1);
});
