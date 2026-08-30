import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MarkdownPage } from "../../domain/pages/page.ts";
import { installHappyDom } from "../../test/happy-dom.ts";
import "../client/math.ts";
import { renderMarkdown } from "../markdown/renderMarkdown.ts";
import type { RenderedQuizDefinition, RenderedRichText } from "./model.ts";
import { QuizBlock } from "./QuizBlock.tsx";

const rich = (text: string): RenderedRichText => ({ html: text, text });

function definition(instanceId: string, title: string): RenderedQuizDefinition {
	return {
		schemaVersion: 1,
		instanceId,
		id: "same-local-id",
		title,
		items: [
			{
				type: "single",
				id: "q-1",
				prompt: rich("Choose one"),
				choices: [
					{ id: "a", content: rich("A"), correct: true },
					{ id: "b", content: rich("B"), correct: false },
				],
			},
		],
	};
}

let restoreDom: (() => void) | undefined;

beforeAll(() => {
	restoreDom = installHappyDom("https://readrun.test/mount");
});

afterEach(() => {
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("mountQuizIslands isolates roots and payload errors, then disposes every mount", async () => {
	const first = definition("page-first-1", "First quiz");
	const second = definition("page-second-2", "Second quiz");
	document.body.innerHTML = [
		renderToStaticMarkup(<QuizBlock definition={first} />),
		renderToStaticMarkup(<QuizBlock definition={second} />),
		renderToStaticMarkup(<QuizBlock definition={definition("bad-3", "Bad")} />),
	].join("");
	const hosts = [...document.querySelectorAll<HTMLElement>('[data-island="quiz"]')];
	hosts[2]!.querySelector("[data-quiz-payload]")!.textContent = "{";

	const { mountQuizIslands } = await import("./mount.tsx");
	let dispose: (() => void) | undefined;
	await act(async () => {
		dispose = mountQuizIslands(document);
	});

	expect(hosts.every((host) => host.dataset.quizMounted === "true")).toBe(true);
	expect(hosts[0]?.textContent).toContain("First quiz");
	expect(hosts[1]?.textContent).toContain("Second quiz");
	expect(hosts[2]?.textContent).toContain("Quiz could not load");
	expect(hosts[2]?.textContent).toContain("not valid JSON");
	expect(hosts[0]!.querySelectorAll("[data-quiz-root]")).toHaveLength(2);
	expect(hosts[1]!.querySelectorAll("[data-quiz-root]")).toHaveLength(2);

	const firstInput = hosts[0]!.querySelector<HTMLInputElement>(
		'input[type="radio"][value="a"]',
	)!;
	const secondInput = hosts[1]!.querySelector<HTMLInputElement>(
		'input[type="radio"][value="a"]',
	)!;
	expect(firstInput.name).not.toBe(secondInput.name);
	expect(firstInput.id).not.toBe(secondInput.id);
	const firstStep = hosts[0]!.querySelector<HTMLElement>("[data-quiz-step]")!;
	const secondStep = hosts[1]!.querySelector<HTMLElement>("[data-quiz-step]")!;
	const firstLabelTarget = firstStep.getAttribute("aria-labelledby")!;
	const secondLabelTarget = secondStep.getAttribute("aria-labelledby")!;
	expect(firstLabelTarget).not.toBe(secondLabelTarget);
	expect(hosts[0]!.querySelector(`#${CSS.escape(firstLabelTarget)}`)).not.toBeNull();
	expect(hosts[0]!.querySelector(`#${CSS.escape(secondLabelTarget)}`)).toBeNull();
	expect(hosts[1]!.querySelector(`#${CSS.escape(secondLabelTarget)}`)).not.toBeNull();
	expect(hosts[1]!.querySelector(`#${CSS.escape(firstLabelTarget)}`)).toBeNull();
	await act(async () => firstInput.click());
	expect(firstInput.checked).toBe(true);
	expect(secondInput.checked).toBe(false);
	await completeQuiz(hosts[0]!);
	expect(hosts[0]!.contains(document.activeElement)).toBe(true);
	expect(hosts[1]!.contains(document.activeElement)).toBe(false);
	await act(async () => button(hosts[0]!, "Restart quiz").click());
	expect(hosts[0]!.contains(document.activeElement)).toBe(true);
	expect(document.activeElement?.matches("[data-quiz-step='q-1']")).toBe(true);

	await act(async () => secondInput.click());
	await completeQuiz(hosts[1]!);
	expect(hosts[1]!.contains(document.activeElement)).toBe(true);
	expect(hosts[0]!.contains(document.activeElement)).toBe(false);
	await act(async () => button(hosts[1]!, "Restart quiz").click());
	expect(hosts[1]!.contains(document.activeElement)).toBe(true);
	expect(document.activeElement?.matches("[data-quiz-step='q-1']")).toBe(true);

	await act(async () => dispose?.());
	expect(hosts.every((host) => host.dataset.quizMounted === undefined)).toBe(
		true,
	);
	expect(
		hosts.every(
			(host) => host.querySelector<HTMLElement>("[data-quiz-root]")?.textContent === "",
		),
	).toBe(true);
});

test("quiz rich text renders math when content is mounted and revealed", async () => {
	const mathQuiz: RenderedQuizDefinition = {
		schemaVersion: 1,
		instanceId: "page-math-1",
		id: "math",
		title: "Math quiz",
		items: [
			{
				type: "single",
				id: "q-1",
				prompt: rich("<p>Choose $x^2$.</p>"),
				hint: rich("<p>Hint: $x$.</p>"),
				explanation: rich("<p>Because $$x \\cdot x = x^2$$.</p>"),
				choices: [
					{ id: "a", content: rich("$x^2$"), correct: true },
					{ id: "b", content: rich("$2x$"), correct: false },
				],
			},
		],
	};
	document.body.innerHTML = renderToStaticMarkup(
		<QuizBlock definition={mathQuiz} />,
	);

	const { mountQuizIslands } = await import("./mount.tsx");
	let dispose: (() => void) | undefined;
	await act(async () => {
		dispose = mountQuizIslands(document);
	});

	expect(document.querySelectorAll(".katex").length).toBe(3);
	await act(async () => {
		document.querySelector<HTMLButtonElement>("button[aria-expanded='false']")?.click();
	});
	expect(document.body.textContent).toContain("Hint:");
	expect(document.querySelectorAll(".katex").length).toBe(4);

	await act(async () => {
		document.querySelector<HTMLInputElement>('input[value="a"]')?.click();
	});
	const checkAnswer = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
		(button) => button.textContent === "Check answer",
	);
	await act(async () => checkAnswer?.click());
	expect(document.querySelector("[data-quiz-root]")?.textContent).toContain(
		"Because",
	);
	expect(document.querySelectorAll(".katex-display").length).toBe(1);

	await act(async () => dispose?.());
});

test("mounted quiz keeps block rich text out of legend and span containers", async () => {
	document.body.innerHTML = renderToStaticMarkup(
		<QuizBlock definition={definition("page-markup-1", "Markup quiz")} />,
	);
	const host = document.querySelector<HTMLElement>('[data-island="quiz"]')!;

	const { mountQuizIslands } = await import("./mount.tsx");
	let dispose: (() => void) | undefined;
	await act(async () => {
		dispose = mountQuizIslands(document);
	});

	const activeStep = host.querySelector<HTMLElement>("[data-quiz-step]")!;
	const labelTarget = activeStep.getAttribute("aria-labelledby")!;
	expect(host.querySelector(`#${CSS.escape(labelTarget)}`)).not.toBeNull();
	expect(host.querySelectorAll("legend div, span div")).toHaveLength(0);

	await act(async () => {
		host.querySelector<HTMLInputElement>('input[value="a"]')?.click();
	});
	await completeQuiz(host);
	expect(host.querySelectorAll("legend div, span div")).toHaveLength(0);

	await act(async () => dispose?.());
});

test("authored block choice payloads mount outside inline ancestors and grade safely", async () => {
	// Catches passing inline=true to the ReadRun choice rich-text wrapper.
	const rendered = renderMarkdown({
		page: markdownPage(`[quiz id=raw-block title="Raw block"]
[question type=single]
Choose the block choice.
- [x] <div data-raw-block>Block choice $x^2$</div>
- [ ] Plain distractor
[/question]
[/quiz]`),
	});
	document.body.innerHTML = rendered.html;
	const host = document.querySelector<HTMLElement>('[data-island="quiz"]')!;
	const payload = JSON.parse(
		host.querySelector<HTMLScriptElement>("[data-quiz-payload]")!.textContent!,
	);
	expect(payload.items[0].choices[0].content.html).toBe(
		'<div data-raw-block>Block choice $x^2$</div>\n',
	);

	const { mountQuizIslands } = await import("./mount.tsx");
	let dispose: (() => void) | undefined;
	await act(async () => {
		dispose = mountQuizIslands(document);
	});

	const choiceBlock = host.querySelector<HTMLElement>(
		'[data-slot="questionnaire-choice"] [data-raw-block]',
	)!;
	expect(choiceBlock.closest("label, span, p")).toBeNull();
	const correctInput = host.querySelector<HTMLInputElement>(
		'input[value="q-1-choice-1"]',
	)!;
	const labelledBy = correctInput.getAttribute("aria-labelledby");
	expect(labelledBy?.split(/\s+/)).toHaveLength(1);
	expect(host.querySelector(`#${CSS.escape(labelledBy!)}`)).not.toBeNull();

	const distractor = host.querySelector<HTMLInputElement>(
		'input[value="q-1-choice-2"]',
	)!;
	await act(async () => distractor.click());
	await act(async () => button(host, "Check answer").click());
	expect(host.textContent).toContain("Incorrect.");
	expect(host.querySelectorAll(".katex")).toHaveLength(2);
	const expectedBlock = host.querySelector<HTMLElement>(
		'[data-slot="quiz-expected-answer"] [data-raw-block]',
	)!;
	expect(expectedBlock.closest("label, span, p")).toBeNull();

	await act(async () => dispose?.());
});

test("authored single-line choices preserve block-producing Markdown fragments", () => {
	// Catches changing choice rendering away from ReadRun's Markdown fragment renderer.
	for (const fixture of [
		["heading", "### Block heading", '<h3 id="block-heading">Block heading</h3>\n'],
		["blockquote", "> Quoted block", "<blockquote>\nQuoted block\n</blockquote>\n"],
		["horizontal rule", "---", "<hr />\n"],
	] as const) {
		const [name, source, expectedHtml] = fixture;
		const rendered = renderMarkdown({
			page: markdownPage(`[quiz id=${name.replace(" ", "-")}]
[question type=single]
Choose the fragment.
- [x] ${source}
- [ ] Plain distractor
[/question]
[/quiz]`),
		});
		const payload = JSON.parse(
			rendered.html.match(/<script[^>]*data-quiz-payload[^>]*>(.*?)<\/script>/)?.[1] ??
				"",
		);
		expect(payload.items[0].choices[0].content.html).toBe(expectedHtml);
	}
});

async function completeQuiz(host: HTMLElement): Promise<void> {
	await act(async () => button(host, "Check answer").click());
	await act(async () => button(host, "View results").click());
}

function button(host: HTMLElement, label: string): HTMLButtonElement {
	const match = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
		(candidate) => candidate.textContent === label,
	);
	if (!match) throw new Error(`Expected button "${label}"`);
	return match;
}

function markdownPage(body: string): MarkdownPage {
	return {
		kind: "markdown",
		ext: ".md",
		url: "/quiz",
		filePath: "quiz.md",
		relPath: "quiz.md",
		filename: "quiz.md",
		title: "Quiz",
		mtimeMs: 0,
		body,
		tags: [],
		outboundLinks: [],
	};
}
