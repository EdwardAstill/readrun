import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installHappyDom } from "../../test/happy-dom.ts";
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

	const firstInput = hosts[0]!.querySelector<HTMLInputElement>(
		'input[type="radio"][value="a"]',
	)!;
	const secondInput = hosts[1]!.querySelector<HTMLInputElement>(
		'input[type="radio"][value="a"]',
	)!;
	expect(firstInput.name).not.toBe(secondInput.name);
	expect(firstInput.id).not.toBe(secondInput.id);
	await act(async () => firstInput.click());
	expect(firstInput.checked).toBe(true);
	expect(secondInput.checked).toBe(false);

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
