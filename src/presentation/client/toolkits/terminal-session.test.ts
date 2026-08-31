import { expect, test } from "bun:test";

import { TerminalSession } from "./terminal-session.ts";
import {
	failsPreparationOnce,
	memoryTerminalRuntime,
	rejectsExecutionOnce,
} from "./terminal-test-runtime.ts";

test("queues dependent commands and records output in submission order", async () => {
	const session = new TerminalSession(memoryTerminalRuntime(), "terminal-test");
	await session.prepare();

	const first = session.submit("x = 3");
	const second = session.submit("print(x)");
	await Promise.all([first, second]);

	expect(session.getSnapshot().entries).toEqual([
		{
			id: 1,
			source: "x = 3",
			stdout: "",
			stderr: "",
			result: null,
			error: null,
		},
		{
			id: 2,
			source: "print(x)",
			stdout: "3\n",
			stderr: "",
			result: null,
			error: null,
		},
	]);
});

test("clear keeps history and runtime state while reset removes both", async () => {
	const session = new TerminalSession(memoryTerminalRuntime(), "terminal-test");
	await session.prepare();
	await session.submit("x = 3");
	session.clearOutput();
	expect(session.previousCommand()).toBe("x = 3");
	await session.submit("x");
	expect(session.getSnapshot().entries[0]?.result).toBe("3");

	await session.reset();
	expect(session.getSnapshot().entries).toEqual([]);
	expect(session.previousCommand()).toBe("");
});

test("keeps commands submitted after reset on the new session boundary", async () => {
	const session = new TerminalSession(memoryTerminalRuntime(), "terminal-test");
	await session.prepare();
	const oldCommand = session.submit("x = 3");
	const reset = session.reset();
	const newCommand = session.submit("x = 7");
	await Promise.all([oldCommand, reset, newCommand]);

	expect(session.getSnapshot().entries).toEqual([
		{
			id: 1,
			source: "x = 7",
			stdout: "",
			stderr: "",
			result: null,
			error: null,
		},
	]);
	expect(session.previousCommand()).toBe("x = 7");
});

test("keeps session namespaces isolated while sharing one runtime", async () => {
	const runtime = memoryTerminalRuntime();
	const first = new TerminalSession(runtime, "terminal-one");
	const second = new TerminalSession(runtime, "terminal-two");
	await Promise.all([first.prepare(), second.prepare()]);

	await first.submit("x = 3");
	await second.submit("x");
	expect(second.getSnapshot().entries[0]?.error).toContain("not defined");

	await first.submit("x");
	expect(first.getSnapshot().entries.at(-1)?.result).toBe("3");
});

test("reports prepare failure and succeeds through retry", async () => {
	const session = new TerminalSession(failsPreparationOnce(), "terminal-test");
	await session.prepare();
	expect(session.getSnapshot().status).toBe("error");
	expect(session.getSnapshot().loadError).toContain("offline");

	await session.retry();
	expect(session.getSnapshot().status).toBe("ready");
});

test("an execution error does not poison the command queue", async () => {
	const session = new TerminalSession(memoryTerminalRuntime(), "terminal-test");
	await session.prepare();
	await session.submit("raise");
	await session.submit("x = 3");
	expect(session.getSnapshot().entries.map((entry) => entry.error)).toEqual([
		"Traceback: boom",
		null,
	]);
});

test("turns a rejected execution into a transcript error and remains usable", async () => {
	const session = new TerminalSession(rejectsExecutionOnce(), "terminal-test");
	await session.prepare();
	await session.submit("import unavailable_package");
	await session.submit("x = 3");

	expect(session.getSnapshot().entries[0]?.error).toContain(
		"package install failed",
	);
	expect(session.getSnapshot().entries[1]?.error).toBeNull();
});

test("replaces snapshots before notifying subscribers", async () => {
	const session = new TerminalSession(memoryTerminalRuntime(), "terminal-test");
	const snapshots = [session.getSnapshot()];
	const unsubscribe = session.subscribe(() => snapshots.push(session.getSnapshot()));

	await session.prepare();
	await session.submit("x = 7");
	unsubscribe();

	expect(new Set(snapshots).size).toBe(snapshots.length);
	expect(snapshots.at(-1)?.entries[0]?.source).toBe("x = 7");
});

test("ignores blank submissions and clamps history navigation", async () => {
	const session = new TerminalSession(memoryTerminalRuntime(), "terminal-test");
	await session.prepare();
	await session.submit("  \n ");
	await session.submit("x = 3");
	await session.submit("print(x * 6)");

	expect(session.previousCommand()).toBe("print(x * 6)");
	expect(session.previousCommand()).toBe("x = 3");
	expect(session.previousCommand()).toBe("x = 3");
	expect(session.nextCommand()).toBe("print(x * 6)");
	expect(session.nextCommand()).toBe("");
	expect(session.nextCommand()).toBe("");
	expect(session.getSnapshot().entries).toHaveLength(2);
});

test("dispose immediately blocks submissions and resets after queued work", async () => {
	let releaseExecution: (() => void) | undefined;
	let resetObserved = false;
	const runtime = memoryTerminalRuntime();
	const delayedRuntime = {
		prepare: () => runtime.prepare(),
		execute: async (sessionId: string, source: string) => {
			await new Promise<void>((resolve) => {
				releaseExecution = resolve;
			});
			return runtime.execute(sessionId, source);
		},
		reset: async (sessionId: string) => {
			resetObserved = true;
			await runtime.reset(sessionId);
		},
	};
	const session = new TerminalSession(delayedRuntime, "terminal-test");
	await session.prepare();
	let notifications = 0;
	session.subscribe(() => notifications++);
	const running = session.submit("x = 3");
	await Promise.resolve();
	const dispose = session.dispose();
	await session.submit("x = 7");

	expect(resetObserved).toBeFalse();
	const notificationsAtDispose = notifications;
	releaseExecution?.();
	await Promise.all([running, dispose, session.dispose()]);

	expect(resetObserved).toBeTrue();
	expect(notifications).toBe(notificationsAtDispose);
});
