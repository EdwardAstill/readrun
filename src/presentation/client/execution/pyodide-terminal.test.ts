import { afterAll, expect, test } from "bun:test";

import { installHappyDom } from "../../../test/happy-dom.ts";

interface FakeExecution {
	stdout: string;
	stderr: string;
	result: string | null;
	error: string | null;
}

const restoreDom = installHappyDom();
const originalLoadPyodide = Object.getOwnPropertyDescriptor(
	globalThis,
	"loadPyodide",
);
const interpreter = createFakePyodide();

Object.defineProperty(globalThis, "loadPyodide", {
	configurable: true,
	writable: true,
	value: async () => interpreter.runtime,
});

afterAll(() => {
	restoreDom();
	if (originalLoadPyodide) {
		Object.defineProperty(globalThis, "loadPyodide", originalLoadPyodide);
	} else {
		Reflect.deleteProperty(globalThis, "loadPyodide");
	}
});

test("a failed script load can retry through a fresh loader attempt", async () => {
	const { loadPyodideRuntime } = await import("./pyodide.ts");
	const firstLoad = loadPyodideRuntime();
	const firstScript = document.head.querySelector<HTMLScriptElement>("script");
	firstScript?.onerror?.(new Event("error"));
	await expect(firstLoad).rejects.toThrow("Failed to load Pyodide");

	const retry = loadPyodideRuntime();
	const scripts = document.head.querySelectorAll<HTMLScriptElement>("script");
	expect(scripts).toHaveLength(2);
	scripts[1]?.onload?.(new Event("load"));

	expect(await retry).toBe(interpreter.runtime);
});

test("terminal execution preserves quoted input and isolates session globals", async () => {
	const { pyodideTerminalRuntime } = await import("./pyodide.ts");
	await pyodideTerminalRuntime.prepare();
	await pyodideTerminalRuntime.execute('terminal-"one"', "x = 7");

	expect(
		await pyodideTerminalRuntime.execute('terminal-"one"', "x * 6"),
	).toMatchObject({ result: "42", error: null });
	expect(
		await pyodideTerminalRuntime.execute("terminal-two", "x"),
	).toMatchObject({ result: null, error: expect.stringContaining("not defined") });
});

test("reset removes only the named terminal namespace", async () => {
	const { pyodideTerminalRuntime } = await import("./pyodide.ts");
	await pyodideTerminalRuntime.execute("terminal-reset", "x = 3");
	await pyodideTerminalRuntime.execute("terminal-kept", "x = 7");
	await pyodideTerminalRuntime.reset("terminal-reset");

	expect(
		await pyodideTerminalRuntime.execute("terminal-reset", "x"),
	).toMatchObject({ result: null, error: expect.stringContaining("not defined") });
	expect(
		await pyodideTerminalRuntime.execute("terminal-kept", "x"),
	).toMatchObject({ result: "7", error: null });
});

test("terminal installs are strict while executable block installs stay best-effort", async () => {
	const { pyodideTerminalRuntime, runPyodidePython } = await import(
		"./pyodide.ts"
	);
	interpreter.failedPackages.add("pillow");

	await expect(
		pyodideTerminalRuntime.execute("terminal-packages", "import PIL"),
	).rejects.toThrow("package install failed for pillow");
	await expect(runPyodidePython("import PIL")).resolves.toMatchObject({
		stdout: "",
		stderr: "",
	});
});

function createFakePyodide() {
	const sessions = new Map<string, Map<string, number>>();
	const failedPackages = new Set<string>();

	const runtime = {
		FS: {
			writeFile() {},
			readFile: () => new Uint8Array(),
			readdir: () => [".", ".."],
		},
		async loadPackage() {},
		pyimport() {
			return {
				async install(pkg: string) {
					if (failedPackages.has(pkg)) {
						throw new Error(`package install failed for ${pkg}`);
					}
				},
			};
		},
		runPython(code: string): unknown {
			if (code.includes("def _readrun_terminal_execute")) {
				return undefined;
			}
			if (code.startsWith("_readrun_terminal_execute(")) {
				const arguments_ = parseHelperArguments(
					code,
					"_readrun_terminal_execute",
				);
				const sessionId = arguments_[0]!;
				const source = arguments_[1]!;
				const namespace = sessions.get(sessionId) ?? new Map<string, number>();
				sessions.set(sessionId, namespace);
				return JSON.stringify(execute(namespace, source));
			}
			if (code.startsWith("_readrun_terminal_reset(")) {
				const arguments_ = parseHelperArguments(
					code,
					"_readrun_terminal_reset",
				);
				const sessionId = arguments_[0]!;
				sessions.delete(sessionId);
				return undefined;
			}
			if (code.includes("_readrun_stdout.getvalue()")) {
				return "";
			}
			if (code.includes("_readrun_stderr.getvalue()")) {
				return "";
			}
			if (code.includes("_readrun_figures")) {
				return [];
			}
			return undefined;
		},
	};

	return { failedPackages, runtime };
}

function parseHelperArguments(code: string, helper: string): string[] {
	const serialized = code.slice(helper.length + 1, -1);
	return JSON.parse(`[${serialized}]`) as string[];
}

function execute(
	namespace: Map<string, number>,
	source: string,
): FakeExecution {
	const base = { stdout: "", stderr: "", result: null, error: null };
	const assignment = /^x\s*=\s*(3|7)$/.exec(source.trim());
	if (assignment) {
		namespace.set("x", Number(assignment[1]));
		return base;
	}

	const value = namespace.get("x");
	if (value === undefined) {
		return { ...base, error: "NameError: name 'x' is not defined" };
	}
	if (source.trim() === "x") {
		return { ...base, result: String(value) };
	}
	if (source.trim() === "x * 6") {
		return { ...base, result: String(value * 6) };
	}
	return base;
}
