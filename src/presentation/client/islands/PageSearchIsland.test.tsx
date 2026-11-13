import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { installHappyDom } from "../../../test/happy-dom.ts";
import type * as PageModule from "./PageSearchIsland.tsx";
import type * as OverlayModule from "../overlay.ts";
import { initShortcuts } from "../shortcuts.ts";

let restore: () => void;
let root: Root | undefined;
let page: typeof PageModule;
let overlays: typeof OverlayModule;
let teardownShortcuts: (() => void) | undefined;
beforeAll(async () => {
	restore = installHappyDom();
	HTMLElement.prototype.scrollIntoView = () => {};
	// Load dialog modules after installing the DOM their focus-management hooks use.
	page = await import("./PageSearchIsland.tsx");
	overlays = await import("../overlay.ts");
});
afterEach(async () => {
	teardownShortcuts?.();
	teardownShortcuts = undefined;
	await act(async () => root?.unmount());
	root = undefined;
	overlays.closeAllOverlays();
	document.body.replaceChildren();
});
afterAll(() => restore());

async function render() {
	document.body.innerHTML = '<main id="main-content"><h2>Needle</h2><p>Needle again</p></main><div id="search-host"></div>';
	root = createRoot(document.querySelector("#search-host")!);
	overlays.openOverlay("page-search-overlay");
	await act(async () => root!.render(<page.PageSearchIsland open />));
	const input = document.querySelector("input")!;
	// Chromium's modal isolation can aria-hide individual article children.
	for (const child of document.querySelector("main")!.children) child.setAttribute("aria-hidden", "true");
	await act(async () => {
		Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!.call(input, "needle");
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
	return input;
}

test("Escape from page search closes once instead of reopening settings", async () => {
	const input = await render();
	teardownShortcuts = initShortcuts();
	await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
	expect(overlays.getActiveOverlay()).toBeNull();
});

test("page search preserves modified Enter and refreshes matches after page remount", async () => {
	const input = await render();
	const modified = new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true, cancelable: true });
	await act(async () => input.dispatchEvent(modified));
	expect(modified.defaultPrevented).toBe(false);
	expect(document.querySelectorAll("mark")).toHaveLength(2);
	await act(async () => {
		document.querySelector("main")!.innerHTML = "<p>New needle</p>";
		document.dispatchEvent(new Event("readrun:remount"));
	});
	expect(document.querySelectorAll("mark")).toHaveLength(1);
	expect(document.querySelector("mark")!.textContent).toBe("needle");
});

test("page search has one working close control", async () => {
	await render();
	expect(document.querySelector('[aria-label="Close search"]')).toBeNull();
	const buttons = document.querySelectorAll<HTMLButtonElement>('#page-search-overlay [data-slot="dialog-close"]');
	expect(buttons).toHaveLength(1);
	await act(async () => buttons[0]!.click());
	expect(overlays.getActiveOverlay()).toBeNull();
});
