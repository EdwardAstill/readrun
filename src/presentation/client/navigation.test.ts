import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { installHappyDom } from "../../test/happy-dom.ts";
import { createShellNavigation, type ShellNavigationState } from "./navigation.ts";

let restore: () => void;
let navigation: ShellNavigationState | undefined;
const originalAnchor = globalThis.HTMLAnchorElement;
beforeAll(() => {
	restore = installHappyDom("https://readrun.test/docs/start");
	globalThis.HTMLAnchorElement = window.HTMLAnchorElement;
});
afterEach(() => {
	navigation?.teardown();
	navigation = undefined;
	document.body.replaceChildren();
	document.querySelector("base")?.remove();
});
afterAll(() => { globalThis.HTMLAnchorElement = originalAnchor; restore(); });

function click(href: string, init: MouseEventInit = {}, attributes: Record<string, string> = {}, prevented = false) {
	const link = document.createElement("a");
	link.href = href;
	for (const [key, value] of Object.entries(attributes)) link.setAttribute(key, value);
	document.body.append(link);
	let intercepted = false;
	// Observe the navigation handler before preventing happy-dom's native navigation.
	const preventNative = (event: Event) => { intercepted = event.defaultPrevented; event.preventDefault(); };
	document.addEventListener("click", preventNative, { once: true });
	const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
	if (prevented) event.preventDefault();
	link.dispatchEvent(event);
	link.remove();
	return intercepted;
}

test("ordinary, Ctrl and Cmd local links use the workspace callback and preserve fragments", () => {
	const opened: string[] = [];
	navigation = createShellNavigation({ onNavigate: async (url) => { opened.push(url); return true; } });
	expect(click("chapter#example")).toBe(true);
	expect(click("chapter#example", { ctrlKey: true })).toBe(true);
	expect(click("https://readrun.test/docs/chapter#example", { metaKey: true })).toBe(true);
	expect(opened).toEqual(["/docs/chapter#example", "/docs/chapter#example", "/docs/chapter#example"]);
});

test("non-document links and other browser gestures are not intercepted", () => {
	const opened: string[] = [];
	navigation = createShellNavigation({ onNavigate: async (url) => { opened.push(url); return true; } });
	for (const href of ["https://outside.test/chapter", "//outside.test/chapter", "mailto:test@example.com", "javascript:void(0)", "#example", "/docs/start#example", "/docs/start#", "#", "/image.png", "/source.pdf", "/archive.zip"]) {
		expect(click(href, { ctrlKey: true })).toBe(false);
	}
	const nativeAttributes: Record<string, string>[] = [{ target: "_blank" }, { target: "_parent" }, { download: "" }, { "data-resource-file": "" }];
	for (const attributes of nativeAttributes) {
		expect(click("chapter", { ctrlKey: true }, attributes)).toBe(false);
	}
	for (const init of [{ shiftKey: true }, { altKey: true }, { ctrlKey: true, shiftKey: true }, { button: 1 }]) {
		expect(click("chapter", init)).toBe(false);
	}
	click("chapter", {}, {}, true);
	expect(opened).toEqual([]);
});

test("standalone readers leave modified links to the browser", () => {
	navigation = createShellNavigation();
	expect(click("chapter", { ctrlKey: true })).toBe(false);
	expect(click("chapter", { metaKey: true })).toBe(false);
});

test("links respect the document base URL and inherited browsing target", () => {
	const opened: string[] = [];
	navigation = createShellNavigation({ onNavigate: async (url) => { opened.push(url); return true; } });
	const base = document.createElement("base");
	base.href = "/mounted/";
	document.head.append(base);
	expect(click("chapter", { ctrlKey: true })).toBe(true);
	expect(opened).toEqual(["/mounted/chapter"]);
	base.target = "_blank";
	expect(click("chapter", { ctrlKey: true })).toBe(false);
});

test("queries distinguish documents and sidebar entries identify dotted document routes", () => {
	const opened: string[] = [];
	navigation = createShellNavigation({ onNavigate: async (url) => { opened.push(url); return true; } });
	document.body.innerHTML = '<nav class="sidebar-nav"><a href="/docs/version.2">Version 2</a></nav>';
	expect(click("/docs/start?mode=other#example")).toBe(true);
	expect(click("/docs/version.2", { ctrlKey: true })).toBe(true);
	expect(opened).toEqual(["/docs/start?mode=other#example", "/docs/version.2"]);
});
