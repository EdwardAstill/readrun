import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { QuizDiagnostic } from "../../domain/quiz/model.ts";
import type { RenderedQuizDefinition } from "./model.ts";
import { QuizBlock } from "./QuizBlock.tsx";

const definition: RenderedQuizDefinition = {
	schemaVersion: 1,
	instanceId: "page-check-1",
	id: "check",
	title: "Quick check",
	items: [
		{
			type: "freetext",
			id: "q-1",
			prompt: { html: "<p>Name it</p>", text: "Name it" },
			answer: { expected: "answer", caseSensitive: false },
		},
	],
};

test("QuizBlock emits one island host, safe payload, and readable no-script summary", () => {
	const html = renderToStaticMarkup(<QuizBlock definition={definition} />);

	expect(html).toContain('data-island="quiz"');
	expect(html).toContain('data-quiz-instance="page-check-1"');
	expect(html).toContain('data-quiz-root=""');
	expect(html).toContain('type="application/json"');
	expect(html).toContain('data-quiz-payload=""');
	expect(html).toContain("<noscript>");
	expect(html).toContain("Interactive grading requires JavaScript");
	expect(html).toContain("Name it");
	expect(html).toContain("rounded-xl");
});

test("QuizBlock renders author-facing validation diagnostics safely", () => {
	const diagnostics: QuizDiagnostic[] = [
		{
			severity: "error",
			code: "quiz.question.type",
			message: "Question <bad> needs a type.",
			position: { relPath: "quiz.md", line: 2 },
		},
	];
	const html = renderToStaticMarkup(<QuizBlock diagnostics={diagnostics} />);

	expect(html).toContain('data-quiz-invalid="true"');
	expect(html).toContain("Quiz unavailable");
	expect(html).toContain("Question &lt;bad&gt; needs a type.");
	expect(html).not.toContain('data-island="quiz"');
});
