import { afterAll, expect, test } from "bun:test";

import { installHappyDom } from "../../../test/happy-dom.ts";

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

test("executable block package installs remain best-effort", async () => {
	const { runPyodidePython } = await import("./pyodide.ts");
	interpreter.failedPackages.add("pillow");

	await expect(runPyodidePython("import PIL")).resolves.toEqual({
		stdout: "",
		stderr: "",
		images: [],
	});
});

function createFakePyodide() {
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
			if (code.includes("_readrun_stdout.getvalue()")) return "";
			if (code.includes("_readrun_stderr.getvalue()")) return "";
			if (code.includes("_readrun_figures")) return [];
			return undefined;
		},
	};

	return { failedPackages, runtime };
}
