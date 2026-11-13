import { afterAll, expect, test, spyOn } from "bun:test";

import { installHappyDom } from "../../../test/happy-dom.ts";
import { DEFAULT_RUNTIME_CONFIG } from "../../../shared/runtime-config.ts";
import { loadPyodideRuntime, runPyodideBlock, runPyodidePython } from "./pyodide.ts";

const restoreDom = installHappyDom();
const appendToHead = document.head.appendChild.bind(document.head);
const scriptLoading = spyOn(document.head, "appendChild").mockImplementation(
	<T extends Node>(node: T): T => {
		// Keep mocked CDN scripts inert until the test delivers load/error.
		if (node instanceof Element && node.tagName === "SCRIPT") node.setAttribute("type", "text/plain");
		return appendToHead(node);
	},
);
const originalLoadPyodide = Object.getOwnPropertyDescriptor(
	globalThis,
	"loadPyodide",
);
const interpreter = createFakePyodide();
const originalFetch = globalThis.fetch;

Object.defineProperty(globalThis, "loadPyodide", {
	configurable: true,
	writable: true,
	value: async () => interpreter.runtime,
});

afterAll(() => {
	globalThis.fetch = originalFetch;
	scriptLoading.mockRestore();
	restoreDom();
	if (originalLoadPyodide) {
		Object.defineProperty(globalThis, "loadPyodide", originalLoadPyodide);
	} else {
		Reflect.deleteProperty(globalThis, "loadPyodide");
	}
});

test("failed Python loading can retry and waits for safe data files at their documented paths", async () => {
	const firstLoad = loadPyodideRuntime();
	const firstScript = document.head.querySelector<HTMLScriptElement>("script");
	firstScript?.onerror?.(new Event("error"));
	await expect(firstLoad).rejects.toThrow("Failed to load Pyodide");

	const manifest = document.createElement("script");
	manifest.id = "readrun-files";
	manifest.textContent = JSON.stringify({
		files: [{ name: "student.json" }, { name: "nested/café.json" }, { name: "../escape" }, null],
	});
	const config = document.createElement("script");
	config.id = "readrun-runtime-config";
	config.textContent = JSON.stringify({ ...DEFAULT_RUNTIME_CONFIG, clientScriptUrl: "/project/_readrun/client.js" });
	document.body.append(manifest, config);
	const fileResponse = Promise.withResolvers<Response>();
	const fileRequested = Promise.withResolvers<void>();
	const urls: string[] = [];
	globalThis.fetch = Object.assign(async (url: RequestInfo | URL) => {
		urls.push(String(url));
		fileRequested.resolve();
		return (await fileResponse.promise).clone();
	}, { preconnect: originalFetch.preconnect });
	const retry = loadPyodideRuntime();
	const scripts = document.head.querySelectorAll<HTMLScriptElement>("script");
	expect(scripts).toHaveLength(2);
	scripts[1]?.onload?.(new Event("load"));
	await fileRequested.promise;
	let ready = false;
	const concurrent = loadPyodideRuntime().then(() => { ready = true; });
	await Promise.resolve();
	expect(ready).toBe(false);
	fileResponse.resolve(new Response('{"name":"Student"}'));

	expect(await retry).toBe(interpreter.runtime);
	await concurrent;
	expect(urls).toEqual([
		"https://readrun.test/project/_readrun/files/student.json",
		"https://readrun.test/project/_readrun/files/nested/caf%C3%A9.json",
	]);
	expect(interpreter.state.files).toEqual(["/home/pyodide/data/student.json", "/home/pyodide/data/nested/café.json"]);
	expect(interpreter.state.directories).toEqual(["/home/pyodide/data", "/home/pyodide/data/nested"]);
	document.body.replaceChildren();
	globalThis.fetch = originalFetch;
});

test("executable block package installs remain best-effort", async () => {
	interpreter.failedPackages.add("pillow");

	await expect(runPyodidePython("import PIL")).resolves.toEqual({
		stdout: "",
		stderr: "",
		images: [],
	});
});

test("Python errors preserve prior output and restore interpreter streams for a rerun", async () => {
	interpreter.runtime.runPython("reset-test-state");
	interpreter.state.stdout = "before failure";
	const result = await runPyodidePython("raise-test-error");
	expect(result).toEqual({
		stdout: "before failure", stderr: "", images: [], error: "example failure",
	});
	expect(interpreter.state.restored).toBe(true);
	interpreter.state.stdout = "rerun";
	expect((await runPyodidePython("pass")).stdout).toBe("rerun");
	interpreter.state.stdout = "";
});

test("matplotlib figure data is returned and rendered instead of discarded", async () => {
	interpreter.state.images = ["aW1hZ2U="];
	document.body.innerHTML = '<button class="exec-run-btn" data-block-id="figure"></button><output class="exec-output" data-output="figure"></output>';
	await runPyodideBlock("figure", "pass");
	expect(document.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,aW1hZ2U=");
	expect(interpreter.state.images).toEqual([]);
	expect(document.querySelector("button")?.disabled).toBe(false);
	document.body.replaceChildren();
});

function createFakePyodide() {
	const failedPackages = new Set<string>();
	const state = {
		stdout: "", images: [] as string[], restored: false,
		files: [] as string[], directories: [] as string[],
	};
	const runtime = {
		FS: {
			cwd: () => "/home/pyodide",
			writeFile(path: string) {
				const absolutePath = path.startsWith("/") ? path : `/home/pyodide/${path}`;
				const parent = absolutePath.slice(0, absolutePath.lastIndexOf("/"));
				if (!state.directories.includes(parent)) throw new Error(`Missing directory: ${parent}`);
				state.files.push(absolutePath);
			},
			mkdirTree(path: string) {
				state.directories.push(`/${path.split("/").filter(Boolean).join("/")}`);
			},
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
			if (code === "reset-test-state") state.restored = false;
			if (code === "raise-test-error") throw new Error("example failure");
			if (code.includes("_readrun_stdout.getvalue()")) return state.stdout;
			if (code.includes("_readrun_stderr.getvalue()")) return "";
			if (code.includes("_rr_json.dumps")) return JSON.stringify(state.images);
			if (code.includes("_readrun_figures.clear()")) state.images = [];
			if (code.includes("sys.stdout = sys.__stdout__")) state.restored = true;
			return undefined;
		},
	};

	return { failedPackages, runtime, state };
}
