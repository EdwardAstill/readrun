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
	delete window.readrunDesktop;
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

test("opens shortcuts when question mark is typed with Shift", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();

	document.body.dispatchEvent(
		new KeyboardEvent("keydown", {
			key: "?",
			code: "Slash",
			shiftKey: true,
			bubbles: true,
			cancelable: true,
		}),
	);

	expect(overlayModule.getActiveOverlay()).toBe("shortcuts-overlay");
});

test("o opens the outline and l opens links, consuming the opening key", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();
	for (const [key, overlay] of [["o", "outline-overlay"], ["l", "links-overlay"]] as const) {
		const event = keydown(key);
		document.body.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(overlayModule.getActiveOverlay()).toBe(overlay);
		overlayModule.closeAllOverlays();
	}
});

test("file, outline, and links shortcuts leave typing, modifiers, and open dialogs alone", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();
	let opened = 0;
	window.readrunDesktop = { openFiles: () => { opened += 1; } };
	for (const key of ["b", "o", "l"]) {
		for (const tag of ["input", "textarea", "select", "div"]) {
			const editable = document.createElement(tag);
			if (tag === "div") editable.contentEditable = "true";
			document.body.append(editable);
			const event = keydown(key);
			editable.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
			expect(overlayModule.getActiveOverlay()).toBeNull();
			editable.remove();
		}
		for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"]) {
			const event = new KeyboardEvent("keydown", { key, [modifier]: true, bubbles: true, cancelable: true });
			document.body.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
			expect(overlayModule.getActiveOverlay()).toBeNull();
		}
		overlayModule.openOverlay("settings-overlay");
		document.body.dispatchEvent(keydown(key));
		expect(overlayModule.getActiveOverlay()).toBe("settings-overlay");
		overlayModule.closeAllOverlays();
	}
	expect(opened).toBe(0);
});

test("b opens the system file picker without a Files dialog", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();
	let opened = 0;
	window.readrunDesktop = { openFiles: () => { opened += 1; } };
	const event = keydown("b");
	document.body.dispatchEvent(event);
	expect(event.defaultPrevented).toBe(true);
	expect(opened).toBe(1);
	expect(overlayModule.getActiveOverlay()).toBeNull();
});

test("does not handle an Escape already consumed by a toolkit", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();
	const event = keydown("Escape");
	event.preventDefault();

	document.body.dispatchEvent(event);

	expect(overlayModule.getActiveOverlay()).toBeNull();
});

test("pressing b swallows the key so it never types into the files search", () => {
	teardownShortcuts = shortcutsModule.initShortcuts();
	const input = document.createElement("input");
	document.body.append(input);

	// The shortcut must consume the keydown; the value change would otherwise
	// come from the same event's default text-insertion action once the files
	// dialog focuses its search input synchronously.
	const event = keydown("b");
	document.body.dispatchEvent(event);

	expect(event.defaultPrevented).toBe(true);
	expect(overlayModule.getActiveOverlay()).toBe("files-overlay");
	expect(input.value).toBe("");
});

function keydown(key: string): KeyboardEvent {
	return new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
	});
}
