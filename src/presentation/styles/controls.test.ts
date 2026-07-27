import { expect, test } from "bun:test";

import { controlStyles } from "./controls.ts";

test("shared controls use semantic theme tokens", () => {
	expect(controlStyles).toContain(".rr-button--primary");
	expect(controlStyles).toContain("background: var(--rr-accent)");
	expect(controlStyles).toContain("color: var(--rr-on-accent)");
	expect(controlStyles).toContain("outline: 2px solid var(--rr-focus)");
	expect(controlStyles).not.toMatch(/#[0-9a-f]{3,8}/i);
});

test("shared controls cover compact, default, disabled, and placeholder states", () => {
	expect(controlStyles).toContain(".rr-control--compact");
	expect(controlStyles).toContain(".rr-control--default");
	expect(controlStyles).toContain(".rr-button:disabled");
	expect(controlStyles).toContain(".rr-input:disabled");
	expect(controlStyles).toContain(".rr-input::placeholder");
});
