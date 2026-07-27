import { expect, test } from "bun:test";
import {
	initialiseTailwind,
	widgetTokenCompatibilityStyles,
} from "./jsx.ts";

test("widget compatibility tokens stay scoped to JSX output", () => {
	expect(widgetTokenCompatibilityStyles).toContain(".jsx-output__mount {");
	expect(widgetTokenCompatibilityStyles).not.toContain(":root");
	expect(widgetTokenCompatibilityStyles).toContain("--radius: 0;");
});

test("initialiseTailwind loads the runtime before applying configuration", async () => {
	const events: string[] = [];

	await initialiseTailwind(
		async () => {
			events.push("runtime");
		},
		() => {
			events.push("config");
		},
	);

	expect(events).toEqual(["runtime", "config"]);
});

test("initialiseTailwind does not configure a runtime that failed to load", async () => {
	let configured = false;

	await expect(
		initialiseTailwind(
			async () => {
				throw new Error("network error");
			},
			() => {
				configured = true;
			},
		),
	).rejects.toThrow("network error");

	expect(configured).toBe(false);
});
