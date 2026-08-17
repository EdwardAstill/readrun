import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import type { Root } from "react-dom/client";

import { installHappyDom } from "../../test/happy-dom.ts";
import type { RenderedQuizDefinition, RenderedRichText } from "./model.ts";
import { QuizIsland } from "./QuizIsland.tsx";

const rich = (text: string): RenderedRichText => ({
	html: `<p>${text}</p>`,
	text,
});

const definition: RenderedQuizDefinition = {
	schemaVersion: 1,
	instanceId: "page-check-1",
	id: "check",
	title: "Quiz interaction",
	items: [
		{
			type: "single",
			id: "q-1",
			prompt: rich("Choose A"),
			hint: rich("It is the first choice."),
			explanation: rich("A is the expected answer."),
			choices: [
				{ id: "a", content: rich("A"), correct: true },
				{ id: "b", content: rich("B"), correct: false },
			],
		},
		{
			type: "freetext",
			id: "q-2",
			prompt: rich("Type yes"),
			answer: { expected: "yes", caseSensitive: false },
		},
	],
};

const choiceDefinition: RenderedQuizDefinition = {
	schemaVersion: 1,
	instanceId: "page-choice-types-1",
	id: "choice-types",
	title: "Choice types",
	items: [
		{
			type: "multi",
			id: "q-multi",
			prompt: rich("Choose both vowels"),
			choices: [
				{ id: "a", content: rich("A"), correct: true },
				{ id: "b", content: rich("B"), correct: false },
				{ id: "e", content: rich("E"), correct: true },
			],
		},
		{
			type: "truefalse",
			id: "q-boolean",
			prompt: rich("The sky is green"),
			choices: [
				{ id: "true", content: rich("True"), correct: false },
				{ id: "false", content: rich("False"), correct: true },
			],
			correctAnswer: false,
		},
	],
};

let root: Root | undefined;
let restoreDom: (() => void) | undefined;

beforeAll(() => {
	restoreDom = installHappyDom("https://readrun.test/quiz");
});

afterEach(async () => {
	if (root) {
		await act(async () => root?.unmount());
		root = undefined;
	}
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("QuizIsland submits deliberately, locks answers, scores, and restarts", async () => {
	const { createRoot } = await import("react-dom/client");
	const container = document.createElement("div");
	container.dataset.quizInstance = definition.instanceId;
	document.body.append(container);
	root = createRoot(container, { identifierPrefix: "test-quiz-" });
	await act(async () => root?.render(<QuizIsland definition={definition} />));

	expect(document.body.textContent).toContain("Step 1 of 2");
	expect(findButton("Check answer").disabled).toBe(true);
	const firstChoice = document.querySelector<HTMLInputElement>(
		'input[type="radio"][value="a"]',
	)!;
	await act(async () => firstChoice.click());
	expect(firstChoice.checked).toBe(true);
	expect(findButton("Check answer").disabled).toBe(false);
	expect(document.body.textContent).not.toContain("Correct.");

	await act(async () => {
		document.querySelector("form")?.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "ArrowRight",
				bubbles: true,
				cancelable: true,
			}),
		);
	});
	expect(
		document.querySelector<HTMLElement>(
			'[data-slot="questionnaire-item"][data-active]',
		)?.dataset.quizStep,
	).toBe("q-1");

	await act(async () => findButton("Show hint").click());
	expect(findButton("Hide hint").getAttribute("aria-expanded")).toBe("true");
	expect(document.body.textContent).toContain("It is the first choice.");

	await act(async () => findButton("Check answer").click());
	expect(document.body.textContent).toContain("Correct.");
	expect(document.body.textContent).toContain("A is the expected answer.");
	expect(firstChoice.disabled).toBe(true);

	await act(async () => findButton("Next").click());
	expect(document.body.textContent).toContain("Step 2 of 2");
	const input = document.querySelector<HTMLInputElement>(
		'input[aria-label="Answer: Type yes"]',
	)!;
	await act(async () => {
		setInputValue(input, "no");
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
	expect(findButton("Check answer").disabled).toBe(false);
	await act(async () => findButton("Check answer").click());
	expect(document.body.textContent).toContain("Incorrect.");
	expect(document.body.textContent).toContain("Expected answer: yes");
	expect(input.disabled).toBe(true);

	await act(async () => findButton("View results").click());
	expect(document.body.textContent).toContain("Quiz interaction: results");
	expect(document.body.textContent).toContain("1 / 2");
	expect(document.activeElement?.textContent).toContain("results");

	await act(async () => findButton("Restart quiz").click());
	expect(document.body.textContent).toContain("Step 1 of 2");
	expect(document.body.textContent).not.toContain("Correct.");
	expect(
		document.querySelector<HTMLInputElement>('input[type="radio"][value="a"]')
			?.checked,
	).toBe(false);
});

test("QuizIsland renders native multi-select and true/false controls", async () => {
	const { createRoot } = await import("react-dom/client");
	const container = document.createElement("div");
	container.dataset.quizInstance = choiceDefinition.instanceId;
	document.body.append(container);
	root = createRoot(container, { identifierPrefix: "test-choice-types-" });
	await act(async () => root?.render(<QuizIsland definition={choiceDefinition} />));

	const multiInputs = [
		...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
	];
	expect(multiInputs.map((input) => input.value)).toEqual(["a", "b", "e"]);
	await act(async () => {
		multiInputs[0]?.click();
		multiInputs[2]?.click();
	});
	expect(findButton("Check answer").disabled).toBe(false);
	await act(async () => findButton("Check answer").click());
	expect(document.body.textContent).toContain("Correct.");
	expect(multiInputs.every((input) => input.disabled)).toBe(true);

	await act(async () => findButton("Next").click());
	const booleanInputs = [
		...document.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
	].filter((input) => !input.disabled);
	expect(booleanInputs.map((input) => input.value)).toEqual(["true", "false"]);
	await act(async () => booleanInputs[1]?.click());
	await act(async () => findButton("Check answer").click());
	expect(document.body.textContent).toContain("Correct.");

	await act(async () => findButton("View results").click());
	expect(document.body.textContent).toContain("2 / 2");
});

function findButton(label: string): HTMLButtonElement {
	const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
		(candidate) => !candidate.hidden && candidate.textContent?.trim() === label,
	);
	if (!button) throw new Error(`Button "${label}" not found`);
	return button;
}

function setInputValue(input: HTMLInputElement, value: string): void {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		"value",
	)?.set;
	setter?.call(input, value);
}
