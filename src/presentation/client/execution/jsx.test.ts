import { expect, test, spyOn } from "bun:test";
import { act } from "react";
import { installHappyDom } from "../../../test/happy-dom.ts";
import {
	mountAutoJsxBlocks,
	runJsxBlock,
	teardownJsxMounts,
} from "./jsx.ts";



test("JSX retries failed loading, mounts Unicode, reruns cleanly and displays render errors", async () => {
	const restoreDom = installHappyDom();
	const tailwindRequested = Promise.withResolvers<HTMLScriptElement>();
	const appendToHead = document.head.appendChild.bind(document.head);
	const scriptLoading = spyOn(document.head, "appendChild").mockImplementation(
		<T extends Node>(node: T): T => {
			// Keep mocked CDN scripts inert until the test delivers load/error.
			if (node instanceof window.HTMLScriptElement) {
				node.setAttribute("type", "text/plain");
				if (node.getAttribute("src") === "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4") {
					tailwindRequested.resolve(node);
				}
			}
			return appendToHead(node);
		},
	);
	const originalBabel = Object.getOwnPropertyDescriptor(globalThis, "Babel");
	const errors = spyOn(console, "error").mockImplementation(() => {});
	let transforms = 0;
	Object.defineProperty(globalThis, "Babel", { configurable: true, value: {
		transform(code: string) {
			transforms++;
			if (code === "syntax-error") throw new Error("Invalid JSX");
			return { code };
		},
	} });
	try {
		const code = `function Counter() {
			const [n, setN] = React.useState(0);
			return React.createElement("button", { onClick: () => setN(n + 1) }, "café 世界 " + n);
		}
		render(React.createElement(Counter));`;
		document.body.innerHTML = `<div class="exec-block" data-language="jsx" data-block-id="example">
			<button class="exec-run-btn" data-block-id="example"></button>
			<script type="text/plain" data-source="example">${Buffer.from(code).toString("base64")}</script>
			<output class="exec-output" data-output="example"></output>
		</div>`;
		const button = document.querySelector<HTMLButtonElement>(".exec-run-btn")!;
		const output = document.querySelector("output")!;
		const first = mountAutoJsxBlocks();
		expect(button.disabled).toBe(true);
		document.head.querySelector<HTMLScriptElement>("script[src]")?.onerror?.(new Event("error"));
		await first;
		expect(output.textContent).toContain("Failed to load");
		expect(button.disabled).toBe(false);

		output.replaceChildren();
		const retry = mountAutoJsxBlocks();
		await runJsxBlock("example", code);
		expect(transforms).toBe(0);
		document.head.querySelector<HTMLScriptElement>("script[src]")?.onload?.(new Event("load"));
		const tailwindScript = await tailwindRequested.promise;
		const tailwindStyles = document.querySelector<HTMLStyleElement>("style[data-readrun-tailwind]");
		expect(tailwindStyles?.type).toBe("text/tailwindcss");
		expect(tailwindStyles?.textContent).toContain('@import "tailwindcss/theme.css" layer(theme)');
		expect(tailwindStyles?.textContent).toContain('@import "tailwindcss/utilities.css" layer(utilities)');
		expect(tailwindStyles?.textContent).not.toContain("preflight");
		expect(button.disabled).toBe(true);
		tailwindScript.onload?.(new Event("load"));
		await act(async () => { await retry; });
		expect(output.textContent).toBe("café 世界 0");
		await act(async () => output.querySelector<HTMLButtonElement>("button")!.click());
		expect(output.textContent).toBe("café 世界 1");
		await act(async () => { await runJsxBlock("example", code); });
		expect(output.textContent).toBe("café 世界 0");

		await act(async () => { await runJsxBlock("example", "syntax-error"); });
		expect(output.querySelector(".error")?.textContent).toBe("Invalid JSX");
		await act(async () => {
			await runJsxBlock("example", 'render(React.createElement(() => { throw new Error("Render failure"); }));');
		});
		expect(output.querySelector(".error")?.textContent).toBe("Render failure");
		expect(button.disabled).toBe(false);
		await act(async () => { await runJsxBlock("example", code); });
		expect(output.textContent).toBe("café 世界 0");

		await act(async () => {
			const pending = runJsxBlock("example", code);
			teardownJsxMounts();
			await pending;
		});
		expect(output.textContent).toBe("");
	} finally {
		await act(async () => teardownJsxMounts());
		if (originalBabel) Object.defineProperty(globalThis, "Babel", originalBabel);
		else Reflect.deleteProperty(globalThis, "Babel");
		errors.mockRestore();
		scriptLoading.mockRestore();
		restoreDom();
	}
});
