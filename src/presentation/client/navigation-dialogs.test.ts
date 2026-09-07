import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { installHappyDom } from "../../test/happy-dom.ts";
import { mountNavigationDialogs } from "./navigation-dialogs.ts";
import { closeAllOverlays, escapeSequence, getActiveOverlay, openOverlay } from "./overlay.ts";

let restore: () => void;
let teardown: (() => void) | undefined;
beforeAll(() => { restore = installHappyDom(); });
afterEach(() => {
	closeAllOverlays();
	teardown?.();
	document.body.replaceChildren();
});
afterAll(() => restore());

function setup() {
	document.body.innerHTML = `<button id="opener">Files</button>
		<dialog id="files-overlay" data-navigation-dialog><input /><a href="#heading">Page</a><button data-close-navigation-dialog>Close</button></dialog>
		<dialog id="outline-overlay" data-navigation-dialog><input /></dialog>
		<dialog id="resources-overlay" data-navigation-dialog><a data-resource-file href="#asset">Image</a></dialog>`;
	teardown = mountNavigationDialogs();
	const opener = document.querySelector<HTMLButtonElement>("#opener")!;
	opener.focus();
	return { opener, files: document.querySelector<HTMLDialogElement>("#files-overlay")! };
}

test("opens one dialog at a time, focuses search, and restores focus on dismissal", () => {
	const { opener, files } = setup();
	openOverlay("files-overlay");
	expect(files.open).toBe(true);
	expect(document.activeElement).toBe(files.querySelector("input"));
	openOverlay("outline-overlay");
	expect(files.open).toBe(false);
	expect(document.querySelector<HTMLDialogElement>("#outline-overlay")!.open).toBe(true);
	escapeSequence();
	expect(document.querySelector("dialog[open]")).toBeNull();
	expect(document.activeElement).toBe(opener);
	escapeSequence();
	expect(getActiveOverlay()).toBe("settings-overlay");
});

test("native cancel and the close button synchronize overlay state", () => {
	const { files } = setup();
	openOverlay("files-overlay");
	const cancel = new Event("cancel", { cancelable: true });
	files.dispatchEvent(cancel);
	expect(cancel.defaultPrevented).toBe(true);
	expect(getActiveOverlay()).toBeNull();
	expect(files.open).toBe(false);
	openOverlay("files-overlay");
	files.querySelector<HTMLButtonElement>("button")!.click();
	expect(files.open).toBe(false);
});

test("selecting navigation and resource links dismisses the dialog", () => {
	const { files } = setup();
	openOverlay("files-overlay");
	files.querySelector<HTMLAnchorElement>("a")!.click();
	expect(files.open).toBe(false);
	openOverlay("resources-overlay");
	document.querySelector<HTMLAnchorElement>("[data-resource-file]")!.click();
	expect(getActiveOverlay()).toBeNull();
	expect(document.querySelector("dialog[open]")).toBeNull();
});
