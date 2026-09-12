import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { installHappyDom } from "../../test/happy-dom.ts";
import { Quiz } from "../components/quiz/Quiz.tsx";
import type { QuizDefinition } from "../components/quiz/model.ts";

const definition: QuizDefinition = {
	id: "local-source",
	title: "Local source quiz",
	items: [
		{
			type: "single",
			id: "question-1",
			prompt: "Choose the correct answer",
			choices: [
				{ id: "right", content: "Right", correct: true },
				{ id: "wrong", content: "Wrong", correct: false },
			],
		},
	],
};

let restoreDom: (() => void) | undefined;
let root: Root | undefined;

beforeAll(() => {
	restoreDom = installHappyDom("https://readrun.test/registry-source");
});

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("the committed local Quiz completes a question and restarts with cleared state", async () => {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => root?.render(<Quiz quiz={definition} />));

	const answer = container.querySelector<HTMLInputElement>(
		'input[type="radio"][value="right"]',
	);
	if (!answer) throw new Error("Expected the correct answer control");
	await act(async () => answer.click());
	await act(async () => button(container, "Check answer").click());
	await act(async () => button(container, "View results").click());

	expect(container.textContent).toContain("Local source quiz: results");
	expect(container.textContent).toContain("1 / 1");

	await act(async () => button(container, "Restart quiz").click());
	const restartedAnswer = container.querySelector<HTMLInputElement>(
		'input[type="radio"][value="right"]',
	);
	expect(restartedAnswer?.checked).toBe(false);
	expect(button(container, "Check answer").disabled).toBe(true);
});

function button(container: HTMLElement, label: string): HTMLButtonElement {
	const match = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
		(candidate) => candidate.textContent === label,
	);
	if (!match) throw new Error(`Expected button "${label}"`);
	return match;
}

test("number grid jumps to unanswered questions, preserves drafts, and completes out of order", async () => {
  const question = definition.items[0]!;
  if (question.type === "info") throw new Error("Expected a question");
  const quiz: QuizDefinition = {
    ...definition,
    items: [
      { type: "info", id: "intro", content: "Introduction" },
      question,
      { ...question, id: "second" },
      { ...question, id: "third", index: 42 },
    ],
  };
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<Quiz quiz={quiz} />));
  const grid = container.querySelector('nav[aria-label="Quiz questions"]')!;
  expect([...grid.querySelectorAll("button")].map((item) => item.textContent)).toEqual(["1", "2", "42"]);
  const jump = async (number: number) => {
    await act(async () => button(grid as HTMLElement, String(number)).click());
    expect(button(grid as HTMLElement, String(number)).getAttribute("aria-current")).toBe("step");
  };
  const answer = () => container.querySelector<HTMLInputElement>('[data-quiz-step]:not([hidden]) input[value="right"]')!;
  await jump(1);
  await act(async () => answer().click());
  await jump(42);
  expect(container.textContent).toContain("Question 42");
  expect(container.textContent).not.toContain("Step ");
  expect(answer().checked).toBe(false);
  await act(async () => answer().click());
  await act(async () => button(container, "Check answer").click());
  expect(button(container, "View results").disabled).toBe(true);
  await jump(1);
  expect(answer().checked).toBe(true);
  await act(async () => button(container, "Check answer").click());
  await jump(2);
  await act(async () => answer().click());
  await act(async () => button(container, "Check answer").click());
  await act(async () => button(container, "View results").click());
  expect(container.textContent).toContain("3 / 3");
});
