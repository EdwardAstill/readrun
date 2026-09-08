import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { installHappyDom } from "../../../test/happy-dom.ts";
import { activeView } from "./controller.ts";
import type { ReadingWorkspaceHandle } from "./ReadingWorkspace.tsx";
import { WORKSPACE_FOCUS } from "./frame-bridge.ts";
import { createLiveClient } from "../live.ts";
import { DEFAULT_RUNTIME_CONFIG } from "../../../shared/runtime-config.ts";

let restore: () => void;
let workspace: ReadingWorkspaceHandle | null = null;
let module: typeof import("./ReadingWorkspace.tsx");
const originalCustomEvent = globalThis.CustomEvent;
const originalDOMParser = globalThis.DOMParser;

beforeAll(async () => {
	restore = installHappyDom();
	globalThis.CustomEvent = window.CustomEvent;
	globalThis.DOMParser = window.DOMParser;
	module = await import("./ReadingWorkspace.tsx");
});
afterEach(async () => {
	await act(async () => workspace?.teardown());
	workspace = null;
	document.body.replaceChildren();
	window.history.replaceState({}, "", "/");
});
afterAll(() => { globalThis.CustomEvent = originalCustomEvent; globalThis.DOMParser = originalDOMParser; restore(); });

async function mount() {
	document.body.innerHTML = '<div class="readrun-content"><main id="main-content"><h1>First file</h1></main></div>';
	await act(async () => { workspace = module.mountReadingWorkspace(); });
	return workspace!;
}

function host(id: string) {
	return document.querySelector<HTMLElement>(`[data-document-frame-host="${id}"]`)!;
}

test("initial document is visible, and tab switches retain the same iframe node", async () => {
	const { controller } = await mount();
	const first = activeView(controller.store.getState())!.id;
	const frame = host(first).querySelector("iframe");
	expect(host(first).hidden).toBe(false);
	await act(async () => { controller.open("/second", "Second file"); });
	expect(host(first).hidden).toBe(true);
	expect(host(first).querySelector("iframe")).toBe(frame);
	await act(async () => { frame!.dispatchEvent(new CustomEvent(WORKSPACE_FOCUS)); });
	expect(activeView(controller.store.getState())?.type).toBe("/second");
	expect(host(first).hidden).toBe(true);
	await act(async () => { controller.open("/", "First file"); });
	expect(host(first).hidden).toBe(false);
	expect(host(first).querySelector("iframe")).toBe(frame);
});

test("split, drag, float, and dock never reparent an existing document frame", async () => {
	const { controller } = await mount();
	const id = activeView(controller.store.getState())!.id;
	const frame = host(id).querySelector("iframe");
	const parent = host(id).parentElement;
	await act(async () => { controller.split("horizontal"); });
	const targetStackId = controller.store.getState().activeStackId!;
	await act(async () => { controller.store.dispatch({ type: "view/move", viewId: id, targetStackId, edge: "center" }); });
	await act(async () => { controller.store.dispatch({ type: "view/float", viewId: id }); });
	expect(host(id).querySelector("iframe")).toBe(frame);
	expect(host(id).parentElement).toBe(parent);
	expect(host(id).hidden).toBe(false);
	await act(async () => { controller.store.dispatch({ type: "view/dock", viewId: id }); });
	expect(host(id).querySelector("iframe")).toBe(frame);
	expect(host(id).parentElement).toBe(parent);
	expect(host(id).hidden).toBe(false);
});

test("closing the final tab releases its iframe and shows a way to open another file", async () => {
	const { controller } = await mount();
	await act(async () => controller.store.applyCommand("view/close"));
	expect(document.querySelector("iframe")).toBeNull();
	expect(document.querySelector('[data-open-overlay="files-overlay"]')?.textContent).toBe("Open a file");
});

test("keyboard resizing changes the layout without replacing document frames", async () => {
	const { controller } = await mount();
	await act(async () => { controller.split("horizontal"); });
	const frames = [...document.querySelectorAll("iframe")];
	const divider = document.querySelector('[role="separator"]')!;
	await act(async () => { divider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); });
	expect(divider.getAttribute("aria-valuenow")).toBe("55");
	expect([...document.querySelectorAll("iframe")]).toEqual(frames);
	await act(async () => { divider.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); });
	expect(divider.getAttribute("aria-valuenow")).toBe("50");
});

test("back navigation selects an existing tab without adding another history entry", async () => {
	const handle = await mount();
	await act(async () => { handle.controller.open("/second", "Second file"); });
	const length = window.history.length;
	window.history.replaceState({}, "", "/");
	await act(async () => { await handle.navigate("/", "popstate"); });
	expect(activeView(handle.controller.store.getState())?.type).toBe("/");
	expect(window.history.length).toBe(length);
	expect(document.querySelectorAll("iframe")).toHaveLength(2);
});

test("a failed request leaves open documents intact and displays an error", async () => {
	const handle = await mount();
	const originalFetch = globalThis.fetch;
	globalThis.fetch = Object.assign(async () => new Response("Missing", { status: 404 }), { preconnect: originalFetch.preconnect });
	try {
		await act(async () => { await handle.navigate("/missing", "navigation"); });
		expect(document.querySelectorAll("iframe")).toHaveLength(1);
		expect(activeView(handle.controller.store.getState())?.type).toBe("/");
		expect(document.querySelector('[role="alert"]')?.textContent).toContain("404");
	} finally { globalThis.fetch = originalFetch; }
});

test("a slow response cannot steal focus after a newer navigation", async () => {
	const handle = await mount();
	const originalFetch = globalThis.fetch;
	let respond!: (response: Response) => void;
	globalThis.fetch = Object.assign(() => new Promise<Response>((resolve) => { respond = resolve; }), { preconnect: originalFetch.preconnect });
	try {
		const pending = handle.navigate("/slow", "navigation");
		await act(async () => { await handle.navigate("/", "popstate"); });
		await act(async () => {
			respond(new Response('<main id="main-content"><h1>Slow file</h1></main>'));
			await pending;
		});
		expect(document.querySelectorAll("iframe")).toHaveLength(1);
		expect(activeView(handle.controller.store.getState())?.type).toBe("/");
	} finally { globalThis.fetch = originalFetch; }
});

test("document live clients share an event stream and detach independently", async () => {
	const shared = new EventTarget();
	const navigation = () => {
		let request = 0;
		return {
			currentUrl: "/",
			get currentRequestId() { return request; },
			reserveRequestId: () => ++request,
			teardown() {},
			async navigate() { return true; },
			async handlePopstate() { return true; },
			swap: () => true,
		};
	};
	const firstNavigation = navigation();
	const secondNavigation = navigation();
	const options = {
		runtime: { ...DEFAULT_RUNTIME_CONFIG, enableLiveReload: true },
		eventTarget: shared,
		connect: (): EventSource => { throw new Error("A document must not open another SSE connection"); },
	};
	const first = createLiveClient({ ...options, navigation: firstNavigation });
	const second = createLiveClient({ ...options, navigation: secondNavigation });
	const originalFetch = globalThis.fetch;
	globalThis.fetch = Object.assign(async () => new Response('<main id="main-content">Updated</main>'), { preconnect: originalFetch.preconnect });
	try {
		first.disconnect();
		await act(async () => {
			shared.dispatchEvent(new window.MessageEvent("snapshot", { data: JSON.stringify({ type: "snapshot", version: 2 }) }));
		});
		expect(firstNavigation.currentRequestId).toBe(0);
		expect(secondNavigation.currentRequestId).toBe(1);
	} finally { second.disconnect(); globalThis.fetch = originalFetch; }
});
