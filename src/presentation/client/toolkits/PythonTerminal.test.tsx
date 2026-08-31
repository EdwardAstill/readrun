import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { installHappyDom } from "../../../test/happy-dom.ts";
import { PythonTerminal } from "./PythonTerminal.tsx";
import type { TerminalPythonRuntime } from "./terminal-session.ts";
import {
	failsPreparationOnce,
	memoryTerminalRuntime,
} from "./terminal-test-runtime.ts";

let restoreDom: (() => void) | undefined;
let root: Root | undefined;

beforeAll(() => {
	restoreDom = installHappyDom("https://readrun.test/python-terminal");
});

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("loads, executes dependent commands, and renders output as text", async () => {
	await renderTerminal(memoryTerminalRuntime());
	const input = terminalInput();

	await submit(input, "x = 7");
	await submit(input, "print(x * 6)");

	expect(transcript().textContent).toContain("42");
	expect(input.disabled).toBe(false);
});

test("inserts a newline for Shift+Enter and recalls boundary history", async () => {
	await renderTerminal(memoryTerminalRuntime());
	const input = terminalInput();

	await setTextareaValue(input, "for value in [1, 2]:");
	await keydown(input, "Enter", { shiftKey: true });
	expect(input.value).toBe("for value in [1, 2]:\n");

	await submit(input, "x = 7");
	input.setSelectionRange(0, 0);
	await keydown(input, "ArrowUp");
	expect(input.value).toBe("x = 7");
});

test("clear preserves state and history while reset removes both", async () => {
	await renderTerminal(memoryTerminalRuntime());
	await submit(terminalInput(), "x = 7");
	await clickLabel("Clear Output");
	expect(document.querySelector("[data-terminal-entry]")).toBeNull();

	await submit(terminalInput(), "x");
	expect(document.body.textContent).toContain("7");
	await clickLabel("Reset Session");
	expect(document.querySelector("[data-terminal-entry]")).toBeNull();
	terminalInput().setSelectionRange(0, 0);
	await keydown(terminalInput(), "ArrowUp");
	expect(terminalInput().value).toBe("");
});

test("shows a preparation failure and retries in place", async () => {
	await renderTerminal(failsPreparationOnce());
	expect(document.querySelector('[role="alert"]')?.textContent).toContain(
		"offline",
	);
	await clickLabel("Retry Python runtime");
	expect(terminalInput().disabled).toBe(false);
});

test("renders submitted HTML-like source literally without creating elements", async () => {
	await renderTerminal(memoryTerminalRuntime());
	await submit(terminalInput(), "<img src=x onerror=alert(1)>");

	expect(transcript().textContent).toContain("<img src=x onerror=alert(1)>");
	expect(transcript().querySelector("img")).toBeNull();
});

test("does not let an old asynchronous disposal reset a reopened terminal", async () => {
	const runtime = resetDelayedRuntime();
	await renderTerminal(runtime);
	await submit(terminalInput(), "x = 7");

	await act(async () => root?.unmount());
	root = undefined;
	await renderTerminal(runtime);
	await submit(terminalInput(), "x = 7");
	runtime.finishPendingReset();
	await flush();
	await submit(terminalInput(), "print(x * 6)");

	expect(transcript().textContent).toContain("42");
});

async function renderTerminal(runtime: TerminalPythonRuntime): Promise<void> {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => root?.render(<PythonTerminal runtime={runtime} autoFocus={false} />));
	await flush();
}

function terminalInput(): HTMLTextAreaElement {
	const input = document.querySelector<HTMLTextAreaElement>(
		'textarea[aria-label="Python terminal input"]',
	);
	if (!input) throw new Error("Expected the Python terminal input");
	return input;
}

function transcript(): HTMLElement {
	const element = document.querySelector<HTMLElement>(
		"[data-terminal-transcript]",
	);
	if (!element) throw new Error("Expected the terminal transcript");
	return element;
}

async function setTextareaValue(
	input: HTMLTextAreaElement,
	value: string,
): Promise<void> {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLTextAreaElement.prototype,
		"value",
	)?.set;
	if (!setter) throw new Error("Expected textarea value setter");
	const InputEvent = input.ownerDocument.defaultView?.Event;
	if (!InputEvent) throw new Error("Expected a DOM Event constructor");
	await act(async () => {
		setter.call(input, value);
		input.dispatchEvent(new InputEvent("input", { bubbles: true }));
	});
}

async function submit(input: HTMLTextAreaElement, value: string): Promise<void> {
	await setTextareaValue(input, value);
	await keydown(input, "Enter");
	await flush();
}

async function keydown(
	input: HTMLTextAreaElement,
	key: string,
	options: KeyboardEventInit = {},
): Promise<void> {
	const KeyEvent = input.ownerDocument.defaultView?.KeyboardEvent;
	if (!KeyEvent) throw new Error("Expected a DOM KeyboardEvent constructor");
	await act(async () => {
		input.dispatchEvent(new KeyEvent("keydown", { bubbles: true, key, ...options }));
	});
}

async function clickLabel(label: string): Promise<void> {
	const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
		(candidate) => candidate.textContent === label,
	);
	if (!button) throw new Error(`Expected ${label} button`);
	await act(async () => button.click());
	await flush();
}

async function flush(): Promise<void> {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

function resetDelayedRuntime(): TerminalPythonRuntime & {
	finishPendingReset(): void;
} {
	const runtime = memoryTerminalRuntime();
	let releaseReset: (() => void) | undefined;
	return {
		...runtime,
		reset(sessionId) {
			return new Promise<void>((resolve) => {
				releaseReset = () => {
					void runtime.reset(sessionId).then(resolve);
				};
			});
		},
		finishPendingReset() {
			releaseReset?.();
		},
	};
}
