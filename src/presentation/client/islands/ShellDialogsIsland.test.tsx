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
import type { ToolkitDefinition } from "../toolkits/types.ts";

const terminalDefinition: ToolkitDefinition = {
	id: "python-terminal",
	title: "Python Terminal",
	description: "Run persistent Python commands in this browser.",
	defaultSize: { width: 640, height: 420 },
	minimumSize: { width: 360, height: 240 },
	render: () => (
		<textarea
			aria-label="Test terminal input"
			data-toolkit-primary-input
			defaultValue="initial"
		/>
	),
};

let restoreDom: (() => void) | undefined;
let root: Root | undefined;
let shellModule: typeof import("./ShellDialogsIsland.tsx");
let overlayModule: typeof import("../overlay.ts");
let registryModule: typeof import("../toolkits/registry.tsx");
let shortcutsModule: typeof import("../shortcuts.ts");
let shellIslandsModule: typeof import("../shell-islands.tsx");

beforeAll(async () => {
	restoreDom = installHappyDom("https://readrun.test/shell");
	overlayModule = await import("../overlay.ts");
	shortcutsModule = await import("../shortcuts.ts");
	registryModule = await import("../toolkits/registry.tsx");
	shellModule = await import("./ShellDialogsIsland.tsx");
	shellIslandsModule = await import("../shell-islands.tsx");
});

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	await act(async () => overlayModule.closeAllOverlays());
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("opens the command palette from Ctrl/Cmd+K, including editable fields", async () => {
	await renderShell([terminalDefinition]);

	const ctrl = await dispatchPaletteShortcut(document.body, { ctrlKey: true });
	expect(ctrl.defaultPrevented).toBe(true);
	expect(overlayModule.getActiveOverlay()).toBe("command-palette-overlay");

	await act(async () => overlayModule.closeAllOverlays());
	const editable = document.createElement("input");
	document.body.append(editable);
	const meta = await dispatchPaletteShortcut(editable, { metaKey: true });
	expect(meta.defaultPrevented).toBe(true);
	expect(overlayModule.getActiveOverlay()).toBe("command-palette-overlay");
});

test("preserves a toolkit across restore and navigation but resets it after close", async () => {
	await renderShell([terminalDefinition]);
	await openCommand("Open Python Terminal");

	const first = terminalInput();
	expect(document.activeElement).toBe(first);
	first.value = "preserved";

	await clickLabel("Minimize Python Terminal");
	document.dispatchEvent(new Event("readrun:remount"));
	expect(document.querySelector('[aria-label="Test terminal input"]')).toBe(first);
	expect(first.value).toBe("preserved");

	await openCommand("Open Python Terminal");
	expect(terminalInput()).toBe(first);
	expect(document.querySelectorAll('[data-toolkit-id="python-terminal"]')).toHaveLength(1);
	expect(document.activeElement).toBe(first);

	await clickLabel("Close Python Terminal");
	await openCommand("Open Python Terminal");
	const reopened = terminalInput();
	expect(reopened).not.toBe(first);
	expect(reopened.value).toBe("initial");
});

test("Escape closes the toolkit without opening Settings", async () => {
	await renderShell([terminalDefinition]);
	await openCommand("Open Python Terminal");
	const teardownShortcuts = shortcutsModule.initShortcuts();

	try {
		await act(async () => {
			document.body.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "Escape",
					bubbles: true,
					cancelable: true,
				}),
			);
		});

		expect(document.querySelector('[data-toolkit-id="python-terminal"]')).toBeNull();
		expect(overlayModule.getActiveOverlay()).toBeNull();
	} finally {
		teardownShortcuts();
	}
});

test("Escape remains toolkit-owned in the production mount order", async () => {
	const host = document.createElement("div");
	host.dataset.island = "shell-dialogs";
	host.dataset.searchEnabled = "true";
	host.dataset.settingsEnabled = "true";
	document.body.append(host);
	const mounted: {
		shellHandle?: ReturnType<
			typeof shellIslandsModule.mountApplicationShellIslands
		>;
		teardownShortcuts?: () => void;
	} = {};

	try {
		await act(async () => {
			mounted.shellHandle =
				shellIslandsModule.mountApplicationShellIslands(document);
			mounted.teardownShortcuts = shortcutsModule.initShortcuts();
		});
		await nextAnimationFrame();
		await openCommand("Open Scientific Calculator");
		expect(
			document.querySelector('[data-toolkit-id="scientific-calculator"]'),
		).toBeTruthy();

		await act(async () => {
			document.body.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "Escape",
					bubbles: true,
					cancelable: true,
				}),
			);
		});

		expect(
			document.querySelector('[data-toolkit-id="scientific-calculator"]'),
		).toBeNull();
		expect(overlayModule.getActiveOverlay()).toBeNull();
	} finally {
		mounted.teardownShortcuts?.();
		await act(async () => mounted.shellHandle?.teardown());
	}
});

test("preserves the real calculator expression through restore and navigation", async () => {
	const calculator = registryModule.getToolkitDefinition(
		"scientific-calculator",
	)!;
	await renderShell([calculator]);
	await openCommand("Open Scientific Calculator");

	const expression = calculatorExpression();
	await clickButton("7");
	await clickButton("Multiply");
	await clickButton("8");
	expect(expression.value).toBe("7×8");

	await clickLabel("Minimize Scientific Calculator");
	await clickLabel("Restore Scientific Calculator");
	document.dispatchEvent(new Event("readrun:remount"));

	expect(calculatorExpression()).toBe(expression);
	expect(expression.value).toBe("7×8");
});

test("mounts site search only when search is enabled", async () => {
	await renderShell([terminalDefinition], false);
	await act(async () => overlayModule.openOverlay("site-search-overlay"));
	await nextAnimationFrame();
	expect(document.querySelector('[aria-label="Search all pages"]')).toBeNull();

	await renderCurrentShell([terminalDefinition], true);
	await nextAnimationFrame();
	expect(
		document.querySelector('input[aria-label="Search all pages"]'),
	).toBeTruthy();
});

async function renderShell(
	definitions: readonly ToolkitDefinition[],
	searchEnabled = true,
): Promise<void> {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await renderCurrentShell(definitions, searchEnabled);
}

async function renderCurrentShell(
	definitions: readonly ToolkitDefinition[],
	searchEnabled: boolean,
): Promise<void> {
	const ShellDialogs = shellModule.ShellDialogsIsland;
	await act(async () => {
		root?.render(
			<ShellDialogs
				searchEnabled={searchEnabled}
				settingsEnabled={false}
				toolkitDefinitions={definitions}
			/>,
		);
	});
}

async function dispatchPaletteShortcut(
	target: EventTarget,
	modifiers: { ctrlKey?: boolean; metaKey?: boolean },
): Promise<KeyboardEvent> {
	const event = new KeyboardEvent("keydown", {
		key: "k",
		bubbles: true,
		cancelable: true,
		...modifiers,
	});
	await act(async () => target.dispatchEvent(event));
	await nextAnimationFrame();
	return event;
}

async function openCommand(title: string): Promise<void> {
	await dispatchPaletteShortcut(document.body, { ctrlKey: true });
	await clickText(title);
	await nextAnimationFrame();
}

async function clickText(text: string): Promise<void> {
	const item = [...document.querySelectorAll<HTMLAnchorElement>("a")].find(
		(candidate) => candidate.textContent?.includes(text),
	);
	if (!item) throw new Error(`Expected command "${text}"`);
	await act(async () => item.click());
}

async function clickLabel(label: string): Promise<void> {
	const control = document.querySelector<HTMLElement>(`[aria-label="${label}"]`);
	if (!control) throw new Error(`Expected control labelled "${label}"`);
	await act(async () => control.click());
	await nextAnimationFrame();
}

async function clickButton(label: string): Promise<void> {
	const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
		(candidate) => candidate.getAttribute("aria-label") === label,
	);
	if (!button) throw new Error(`Expected button "${label}"`);
	await act(async () => button.click());
}

function terminalInput(): HTMLTextAreaElement {
	const input = document.querySelector<HTMLTextAreaElement>(
		'[aria-label="Test terminal input"]',
	);
	if (!input) throw new Error("Expected test terminal input");
	return input;
}

function calculatorExpression(): HTMLInputElement {
	const input = document.querySelector<HTMLInputElement>("#sci-calc-expression");
	if (!input) throw new Error("Expected calculator expression");
	return input;
}

async function nextAnimationFrame(): Promise<void> {
	await act(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => resolve());
			}),
	);
}
