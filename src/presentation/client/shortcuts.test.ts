import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";

import { installHappyDom } from "../../test/happy-dom.ts";

let restoreDom: (() => void) | undefined;
let teardownShortcuts: (() => void) | undefined;
let shortcutsModule: typeof import("./shortcuts.ts");
let overlayModule: typeof import("./overlay.ts");

beforeAll(async () => {
	restoreDom = installHappyDom("https://readrun.test/shortcuts-dispatch");
	overlayModule = await import("./overlay.ts");
	shortcutsModule = await import("./shortcuts.ts");
});

afterEach(() => {
	teardownShortcuts?.();
	teardownShortcuts = undefined;
	overlayModule.closeAllOverlays();
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("retains the page-search and shortcuts bindings", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();

	document.body.dispatchEvent(keydown("s"));
	expect(overlayModule.getActiveOverlay()).toBe("page-search-overlay");
	overlayModule.closeAllOverlays();

	document.body.dispatchEvent(keydown("?"));
	expect(overlayModule.getActiveOverlay()).toBe("shortcuts-overlay");
});

test("does not handle an Escape already consumed by a toolkit", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();
	const event = keydown("Escape");
	event.preventDefault();

	document.body.dispatchEvent(event);

	expect(overlayModule.getActiveOverlay()).toBeNull();
});

function keydown(key: string): KeyboardEvent {
	return new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
	});
}
