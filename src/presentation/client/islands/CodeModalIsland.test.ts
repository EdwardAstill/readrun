import { describe, expect, test } from "bun:test";

import { readCodeText } from "./CodeModalIsland.tsx";

describe("readCodeText", () => {
	test("prefers editable code", () => {
		const block = mockBlock({ editable: "edited()", encoded: btoa("source()") });
		expect(readCodeText(block)).toBe("edited()");
	});

	test("decodes embedded source before using visible code", () => {
		const block = mockBlock({ encoded: btoa("source()"), visible: "visible()" });
		expect(readCodeText(block)).toBe("source()");
	});

	test("falls back to visible code when the source payload is malformed", () => {
		const block = mockBlock({ encoded: "%%%", visible: "visible()" });
		expect(readCodeText(block)).toBe("visible()");
	});
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
