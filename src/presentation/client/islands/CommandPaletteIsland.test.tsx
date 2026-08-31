import {
	afterAll,
	afterEach,
	beforeAll,
	expect,
	test,
} from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { installHappyDom } from "../../../test/happy-dom.ts";
import type { ToolkitId } from "../toolkits/types.ts";

let restoreDom: (() => void) | undefined;
let root: Root | undefined;
let paletteModule: typeof import("./CommandPaletteIsland.tsx");
let overlayModule: typeof import("../overlay.ts");

beforeAll(async () => {
	restoreDom = installHappyDom("https://readrun.test/commands");
	overlayModule = await import("../overlay.ts");
	paletteModule = await import("./CommandPaletteIsland.tsx");
});

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	overlayModule.closeAllOverlays();
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("publishes and filters the four approved commands", () => {
	expect(
		paletteModule.COMMAND_PALETTE_COMMANDS.map((command) => command.title),
	).toEqual([
		"Open Python Terminal",
		"Open Scientific Calculator",
		"Search Site",
		"Search Page",
	]);
	expect(
		paletteModule
			.filterCommandPaletteCommands("python")
			.map((item) => item.id),
	).toEqual(["open-python-terminal"]);
	expect(
		paletteModule
			.filterCommandPaletteCommands("search")
			.map((item) => item.id),
	).toEqual(["search-site", "search-page"]);
});

test("renders the shared palette with shadcn CommandDialog chrome", async () => {
	await renderPalette({ onOpenToolkit: () => undefined });

	const content = document.querySelector<HTMLElement>(
		'[data-slot="dialog-content"]',
	);
	const close = document.querySelector<HTMLElement>('[data-slot="dialog-close"]');
	expect(content).toBeTruthy();
	expect(content?.id).toBe("command-palette-overlay");
	expect(content?.className).toContain("p-0");
	expect(close?.closest('[data-slot="dialog-content"]')).toBe(content);
	expect(document.querySelector('[data-slot="command"]')).toBeTruthy();
	expect(
		document.querySelector('[data-slot="command-input-wrapper"]'),
	).toBeTruthy();
	expect(document.querySelector('[data-slot="command-input"]')).toBeTruthy();
	expect(document.querySelector('[data-slot="command-list"]')).toBeTruthy();
	expect(document.querySelector('[data-slot="command-group"]')).toBeTruthy();
	expect(document.querySelectorAll('[data-slot="command-item"]')).toHaveLength(
		4,
	);
});

test("selects a filtered toolkit command with the keyboard", async () => {
	const opened: ToolkitId[] = [];
	await renderPalette({ onOpenToolkit: (id) => opened.push(id) });
	const input = document.querySelector<HTMLInputElement>(
		'input[aria-label="Command palette"]',
	)!;

	await setInputValue(input, "calculator");
	await keydown(input, "ArrowDown");
	await keydown(input, "Enter");

	expect(opened).toEqual(["scientific-calculator"]);
});

test("delegates search commands to their existing overlays", async () => {
	await renderPalette({ onOpenToolkit: () => undefined });

	await clickText("Search Site");
	expect(overlayModule.getActiveOverlay()).toBe("site-search-overlay");

	overlayModule.openOverlay("command-palette-overlay");
	await clickText("Search Page");
	expect(overlayModule.getActiveOverlay()).toBe("page-search-overlay");
});

async function renderPalette(props: {
	onOpenToolkit: (id: ToolkitId) => void;
}): Promise<void> {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	overlayModule.openOverlay("command-palette-overlay");
	const CommandPalette = paletteModule.CommandPaletteIsland;
	await act(async () => {
		root?.render(<CommandPalette open {...props} />);
	});
	await nextAnimationFrame();
}

async function setInputValue(
	input: HTMLInputElement,
	value: string,
): Promise<void> {
	await act(async () => {
		let prototype = Object.getPrototypeOf(input);
		let setter: ((this: HTMLInputElement, value: string) => void) | undefined;
		while (prototype && !setter) {
			setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
			prototype = Object.getPrototypeOf(prototype);
		}
		if (!setter) throw new Error("Expected native input value setter");
		setter.call(input, value);
		const InputEvent = input.ownerDocument.defaultView?.Event;
		if (!InputEvent) throw new Error("Expected a DOM Event constructor");
		input.dispatchEvent(new InputEvent("input", { bubbles: true }));
	});
}

async function keydown(element: HTMLElement, key: string): Promise<void> {
	await act(async () => {
		element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
	});
}

async function clickText(text: string): Promise<void> {
	const item = [
		...document.querySelectorAll<HTMLElement>('[data-slot="command-item"]'),
	].find((candidate) => candidate.textContent?.includes(text));
	if (!item) {
		throw new Error(`Expected command "${text}"; DOM: ${document.body.innerHTML}`);
	}
	await act(async () => item.click());
}

async function nextAnimationFrame(): Promise<void> {
	await act(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => resolve());
			}),
	);
}
