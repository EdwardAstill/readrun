import { describe, expect, test } from "bun:test";

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { installHappyDom } from "../../../test/happy-dom.ts";
import { CodeModalIsland, readCodeText } from "./CodeModalIsland.tsx";

describe("readCodeText", () => {
	test("prefers editable code", () => {
		const block = mockBlock({ editable: "edited()", encoded: btoa("source()") });
		expect(readCodeText(block)).toBe("edited()");
	});

	test("decodes embedded source before using visible code", () => {
		const block = mockBlock({ encoded: btoa("source()"), visible: "visible()" });
		expect(readCodeText(block)).toBe("source()");
	});

	test("decodes UTF-8 source for copying and the enlarged view", () => {
		const source = 'print("café 世界")';
		const block = mockBlock({ encoded: Buffer.from(source).toString("base64") });
		expect(readCodeText(block)).toBe(source);
	});

	test("falls back to visible code when the source payload is malformed", () => {
		const block = mockBlock({ encoded: "%%%", visible: "visible()" });
		expect(readCodeText(block)).toBe("visible()");
	});
});

test("enlarging preserves live output interactions, busy state, and restores output on navigation", async () => {
	const restoreDom = installHappyDom();
	document.body.innerHTML = `<div class="exec-block" data-language="jsx">
		<button class="exec-enlarge-btn">Enlarge</button>
		<button class="exec-run-btn" disabled aria-label="Loading React...">Run</button>
		<output class="exec-output"><button id="interactive">Count</button></output>
	</div><div id="modal-root"></div>`;
	const block = document.querySelector<HTMLElement>(".exec-block")!;
	const output = block.querySelector("output")!;
	const interactive = output.querySelector<HTMLButtonElement>("button")!;
	let count = 0;
	interactive.addEventListener("click", () => { count++; });
	const root = createRoot(document.getElementById("modal-root")!);
	try {
		await act(async () => { root.render(createElement(CodeModalIsland)); });
		await act(async () => block.querySelector<HTMLButtonElement>(".exec-enlarge-btn")!.click());
		expect(document.querySelector("#code-modal-output output") === output).toBe(true);
		expect(document.querySelector<HTMLButtonElement>("#code-modal-run")?.disabled).toBe(true);
		interactive.click();
		expect(count).toBe(1);
		await act(async () => { document.dispatchEvent(new Event("readrun:remount")); });
		expect(block.querySelector("output") === output).toBe(true);
		expect(document.querySelector("#code-modal-output") === null).toBe(true);
	} finally {
		await act(async () => root.unmount());
		restoreDom();
	}
});

function mockBlock(values: {
	editable?: string;
	encoded?: string;
	visible?: string;
}): HTMLElement {
	return {
		querySelector(selector: string) {
			if (selector === ".exec-editable" && values.editable !== undefined) {
				return { value: values.editable };
			}
			if (selector === "script[data-source]" && values.encoded !== undefined) {
				return { textContent: values.encoded };
			}
			if (selector === "pre code" && values.visible !== undefined) {
				return { textContent: values.visible };
			}
			return null;
		},
	} as unknown as HTMLElement;
}
