import { expect, test } from "bun:test";
import { floatDesktopWindow } from "./floating.js";

test("waits for its own mapped window and floats it without touching focus", async () => {
	const calls = [];
	let polls = 0;
	await floatDesktopWindow(123, async (command, args) => {
		calls.push([command, ...args]);
		if (args[0] === "clients") {
			polls += 1;
			return { stdout: JSON.stringify([
				{ pid: 999, mapped: true },
				{ pid: 123, mapped: polls > 1 },
			]) };
		}
		return { stdout: "ok\n" };
	}, async () => {});
	expect(calls).toEqual([
		["hyprctl", "clients", "-j"],
		["hyprctl", "clients", "-j"],
		["hyprctl", "eval", 'hl.dispatch(hl.dsp.window.float({action="set", window="pid:123"})); hl.dispatch(hl.dsp.window.resize({x=1100, y=750, relative=false, window="pid:123"})); hl.dispatch(hl.dsp.window.center({window="pid:123"}))'],
	]);
});

test("reports an unmapped window rather than floating another app", async () => {
	await expect(floatDesktopWindow(123, async () => ({ stdout: "[]" }), async () => {}))
		.rejects.toThrow("Timed out");
});

test("reports compositor errors", async () => {
	await expect(floatDesktopWindow(123, async (_, args) => ({
		stdout: args[0] === "clients" ? '[{"pid":123,"mapped":true}]' : "Invalid dispatcher",
	}))).rejects.toThrow("Could not float readrun");
});
