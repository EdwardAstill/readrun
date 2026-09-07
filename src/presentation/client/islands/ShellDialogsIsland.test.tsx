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

let restoreDom: (() => void) | undefined;
let root: Root | undefined;
let shellModule: typeof import("./ShellDialogsIsland.tsx");
let overlayModule: typeof import("../overlay.ts");

beforeAll(async () => {
	restoreDom = installHappyDom("https://readrun.test/shell");
	overlayModule = await import("../overlay.ts");
	shellModule = await import("./ShellDialogsIsland.tsx");
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
	await renderShell([]);

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

test("mounts site search only when search is enabled", async () => {
	await renderShell([], false);
	await act(async () => overlayModule.openOverlay("site-search-overlay"));
	await nextAnimationFrame();
	expect(document.querySelector('[aria-label="Search all pages"]')).toBeNull();

	await renderCurrentShell([], true);
	await nextAnimationFrame();
	expect(
		document.querySelector('input[aria-label="Search all pages"]'),
	).toBeTruthy();
});

test("the default shell offers only search commands and no toolkit windows", async () => {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	const ShellDialogs = shellModule.ShellDialogsIsland;
	await act(async () => {
		root?.render(<ShellDialogs searchEnabled settingsEnabled={false} />);
	});
	await dispatchPaletteShortcut(document.body, { ctrlKey: true });
	expect(
		[...document.querySelectorAll('[data-slot="command-item"]')].map(
			(item) => item.textContent,
		),
	).toEqual([
		"Search SiteSearch across every page.",
		"Search PageSearch within the current page.",
	]);
	expect(document.querySelector("[data-toolkit-id]")).toBeNull();
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

async function nextAnimationFrame(): Promise<void> {
	await act(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => resolve());
			}),
	);
}
