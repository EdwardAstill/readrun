import { afterEach, expect, test } from "bun:test";
import { installHappyDom } from "../../../test/happy-dom.ts";
import { DEFAULT_RUNTIME_CONFIG } from "../../../shared/runtime-config.ts";
import { initExecBlocks } from "./python.ts";

const originalFetch = globalThis.fetch;
let restoreDom: (() => void) | undefined;
let teardown: (() => void) | undefined;
afterEach(() => {
	teardown?.();
	restoreDom?.();
	globalThis.fetch = originalFetch;
});

function mountBlock(code: string) {
	restoreDom = installHappyDom();
	const config = document.createElement("script");
	config.id = "readrun-runtime-config";
	config.textContent = JSON.stringify({ ...DEFAULT_RUNTIME_CONFIG, enableLocalPython: true });
	document.head.append(config);
	window.localStorage.setItem("readrun:settings", JSON.stringify({ useLocalPython: true }));
	document.body.innerHTML = `<div class="exec-block" data-language="python">
		<button class="exec-run-btn" data-block-id="example"><svg><path /></svg></button>
		<script type="text/plain" data-source="example">${Buffer.from(code).toString("base64")}</script>
		<output class="exec-output" data-output="example"></output>
	</div>`;
	teardown = initExecBlocks();
	return {
		button: document.querySelector<HTMLButtonElement>("button")!,
		icon: document.querySelector("path")!,
		output: document.querySelector("output")!,
	};
}

function finished(button: HTMLButtonElement): Promise<void> {
	if (!button.disabled) return Promise.resolve();
	const { promise, resolve } = Promise.withResolvers<void>();
	const observer = new MutationObserver(() => {
		if (button.disabled) return;
		observer.disconnect();
		resolve();
	});
	observer.observe(button, { attributes: true, attributeFilter: ["disabled"] });
	return promise;
}

test("clicking the run icon preserves Unicode, blocks duplicate runs, and allows rerunning", async () => {
	const code = 'print("café 世界")';
	const { button, icon, output } = mountBlock(code);
	const response = Promise.withResolvers<Response>();
	const bodies: unknown[] = [];
	globalThis.fetch = Object.assign(async (_url: RequestInfo | URL, options?: RequestInit) => {
		bodies.push(JSON.parse(String(options?.body)));
		return response.promise;
	}, { preconnect: originalFetch.preconnect });

	icon.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	icon.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	expect(bodies).toEqual([{ code }]);
	expect(button.disabled).toBe(true);
	expect(button.getAttribute("aria-busy")).toBe("true");

	response.resolve(Response.json({ ok: true, stdout: "café 世界", stderr: "", files: [] }));
	await finished(button);
	expect(output.textContent).toBe("café 世界");
	expect(button.disabled).toBe(false);

	globalThis.fetch = Object.assign(async () => Response.json({ ok: true, stdout: "again", stderr: "", files: [] }), { preconnect: originalFetch.preconnect });
	button.click();
	await finished(button);
	expect(output.textContent).toBe("again");
});

test("a failed request remains visible and releases the run button", async () => {
	const { button, output } = mountBlock('print("hello")');
	globalThis.fetch = Object.assign(async () => { throw new Error("offline"); }, { preconnect: originalFetch.preconnect });
	button.click();
	await finished(button);
	expect(output.querySelector(".error")?.textContent).toContain("offline");
	expect(button.disabled).toBe(false);
	expect(button.getAttribute("aria-busy")).toBe("false");
});

test("an old local result cannot replace output after page navigation", async () => {
	const { button, output } = mountBlock('print("old")');
	const response = Promise.withResolvers<Response>();
	globalThis.fetch = Object.assign(async () => response.promise, { preconnect: originalFetch.preconnect });
	button.click();
	const replacement = document.createElement("output");
	replacement.className = "exec-output";
	replacement.dataset.output = "example";
	output.replaceWith(replacement);
	response.resolve(Response.json({ ok: true, stdout: "old", stderr: "", files: [] }));
	await finished(button);
	expect(replacement.textContent).toBe("");
});
