import { describe, expect, test } from "bun:test";

import {
	normalizeTreeSearch,
	syncTreeFoldButton,
	toggleTreeBranches,
} from "./filterable-tree.ts";

describe("filterable tree helpers", () => {
	test("normalizes search whitespace and case", () => {
		expect(normalizeTreeSearch("  Project   LAYOUT ")).toBe("project layout");
	});

	test("toggles all branches from the aggregate open state", () => {
		const branches = [{ open: true }, { open: false }] as HTMLDetailsElement[];

		expect(toggleTreeBranches(branches)).toBe(false);
		expect(branches.map((branch) => branch.open)).toEqual([false, false]);
		expect(toggleTreeBranches(branches)).toBe(true);
		expect(branches.map((branch) => branch.open)).toEqual([true, true]);
	});

	test("keeps the fold button label and expanded state in sync", () => {
		const attributes = new Map<string, string>();
		const button = {
			textContent: "",
			setAttribute(name: string, value: string) {
				attributes.set(name, value);
			},
			removeAttribute(name: string) {
				attributes.delete(name);
			},
		} as unknown as HTMLElement;
		const labels = {
			empty: "Nothing to expand",
			expand: "Expand all",
			collapse: "Collapse all",
		};

		syncTreeFoldButton(button, [{ open: true } as HTMLDetailsElement], labels);
		expect(button.textContent).toBe("-");
		expect(attributes.get("aria-label")).toBe("Collapse all");
		expect(attributes.get("aria-expanded")).toBe("true");
		expect(attributes.has("disabled")).toBe(false);

		syncTreeFoldButton(button, [], labels);
		expect(button.textContent).toBe("+");
		expect(attributes.get("aria-label")).toBe("Nothing to expand");
		expect(attributes.get("aria-expanded")).toBe("false");
		expect(attributes.has("disabled")).toBe(true);
	});
});
