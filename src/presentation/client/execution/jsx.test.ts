import { expect, test } from "bun:test";
import { initialiseTailwind } from "./jsx.ts";

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
