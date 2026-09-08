import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { installHappyDom } from "../../../test/happy-dom.ts";
import { DEFAULT_RUNTIME_CONFIG } from "../../../shared/runtime-config.ts";

let restoreDom: () => void;
let root: Root | undefined;
let module: typeof import("./SiteSearchIsland.tsx");
const originalFetch = globalThis.fetch;
const documents = [
	{ url: "/", relPath: "index.md", title: "Home", text: "Home contents", linkedRelPaths: ["research/alpha.md", "beta.md"] },
	{ url: "/alpha/", relPath: "research/alpha.md", title: "Alpha", text: "Alpha preview text", linkedRelPaths: ["index.md"] },
	{ url: "/beta/", relPath: "beta.md", title: "Beta", text: "Beta preview text", linkedRelPaths: [] },
	{ url: "/unlinked/", relPath: "unlinked.md", title: "Unlinked", text: "Other content", linkedRelPaths: [] },
];

beforeAll(async () => {
	restoreDom = installHappyDom();
	module = await import("./SiteSearchIsland.tsx");
});
afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	document.body.replaceChildren();
	window.history.replaceState(null, "", "/");
	globalThis.fetch = originalFetch;
});
afterAll(() => restoreDom());

async function render() {
	globalThis.fetch = Object.assign(async () => Response.json(documents), { preconnect: originalFetch.preconnect });
	const config = document.createElement("script");
	config.id = "readrun-runtime-config";
	config.textContent = JSON.stringify(DEFAULT_RUNTIME_CONFIG);
	document.body.append(config);
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => root?.render(<module.SiteSearchIsland open />));
}
async function key(element: Element, key: string) {
	await act(async () => element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
}
async function clickMode(name: string) {
	const button = [...document.querySelectorAll("button")].find((button) => button.textContent === name)!;
	await act(async () => button.click());
}
async function type(value: string) {
	const input = document.querySelector("input")!;
	await act(async () => {
		const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
		setter.call(input, value);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
}
const rows = () => [...document.querySelectorAll("[data-search-item]")].map((row) => row.textContent);
const preview = () => document.querySelector('[aria-label="Content preview"]')!.textContent;

test("folder search expands matching ancestors and previews without opening a file", async () => {
	await render();
	expect(rows()).toEqual(["research", "beta.md", "index.md", "unlinked.md"]);
	await type("research/alpha");
	expect(rows()).toEqual(["research", "alpha.md"]);
	expect(preview()).toContain("Alpha preview text");
	expect(window.location.pathname).toBe("/");
	await key(document.querySelector("input")!, "Tab");
	expect(document.activeElement?.getAttribute("aria-label")).toBe("alpha.md");
	await key(document.activeElement!, "Escape");
	expect(document.querySelector("input")!.value).toBe("");
	expect(rows()).toEqual(["research", "beta.md", "index.md", "unlinked.md"]);
});

test("WikiLinks has only current and preview panes, and keyboard selection updates the preview", async () => {
	await render();
	await clickMode("WikiLinks");
	expect(rows()).toEqual(["Alpha", "Beta"]);
	expect(document.querySelectorAll("[data-search-pane]")).toHaveLength(2);
	expect(document.querySelector('[aria-label^="Parent"]')).toBeNull();
	expect(preview()).toContain("Alpha preview text");
	await key(document.querySelector("input")!, "ArrowDown");
	expect(preview()).toContain("Beta preview text");
	await type("unlinked");
	expect(rows()).toEqual([]);
	expect(preview()).not.toContain("Beta preview text");
	await type("beta");
	expect(rows()).toEqual(["Beta"]);
	let opened = "";
	const intercept = (event: Event) => {
		const target = event.target as HTMLAnchorElement;
		if (target.tagName === "A") { opened = target.getAttribute("href")!; event.preventDefault(); }
	};
	document.addEventListener("click", intercept);
	try { await key(document.querySelector("input")!, "Enter"); }
	finally { document.removeEventListener("click", intercept); }
	expect(opened).toBe("/beta/");
});

test("WikiLinks follows the open page after navigation and handles notes with no links", async () => {
	await render();
	await clickMode("WikiLinks");
	await act(async () => {
		window.history.replaceState(null, "", "/alpha/");
		document.dispatchEvent(new Event("readrun:remount"));
	});
	expect(rows()).toEqual(["Home"]);
	await act(async () => {
		window.history.replaceState(null, "", "/beta/");
		document.dispatchEvent(new Event("readrun:remount"));
	});
	expect(rows()).toEqual([]);
	expect(document.body.textContent).toContain("This page has no resolved outgoing WikiLinks.");
});

test("wiki projects start with linked notes and reopening refreshes the file index", async () => {
	const nav = document.createElement("nav");
	nav.setAttribute("aria-label", "Wiki navigation");
	document.body.append(nav);
	await render();
	expect(rows()).toEqual(["Alpha", "Beta"]);
	await act(async () => root?.render(<module.SiteSearchIsland open={false} />));
	globalThis.fetch = Object.assign(async () => Response.json([
		{ ...documents[0], linkedRelPaths: ["unlinked.md"] }, ...documents.slice(1),
	]), { preconnect: originalFetch.preconnect });
	await act(async () => root?.render(<module.SiteSearchIsland open />));
	expect(rows()).toEqual(["Unlinked"]);
});

test("failed index loads report an error and can recover on reopening", async () => {
	await render();
	await act(async () => root?.render(<module.SiteSearchIsland open={false} />));
	globalThis.fetch = Object.assign(async () => new Response("Unavailable", { status: 503 }), { preconnect: originalFetch.preconnect });
	await act(async () => root?.render(<module.SiteSearchIsland open />));
	expect(document.querySelector('[role="alert"]')?.textContent).toContain("Could not load files");
	await act(async () => root?.render(<module.SiteSearchIsland open={false} />));
	globalThis.fetch = Object.assign(async () => Response.json(documents), { preconnect: originalFetch.preconnect });
	await act(async () => root?.render(<module.SiteSearchIsland open />));
	expect(document.querySelector('[role="alert"]')).toBeNull();
	expect(rows()).toContain("index.md");
});
