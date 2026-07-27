import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { vizStyles } from "../../../widgets/primitives/styles.ts";

interface BabelStandalone {
	transform(code: string, options: object): { code: string };
}

interface JsxRuntime {
	Babel: BabelStandalone;
}

let runtime: JsxRuntime | null = null;
let runtimeLoading: Promise<JsxRuntime> | null = null;
const mountedRoots = new Map<HTMLElement, Root>();

export async function runJsxBlock(blockId: string, code: string): Promise<void> {
	const outputEl = document.querySelector<HTMLElement>(
		`.exec-output[data-output="${CSS.escape(blockId)}"]`,
	);
	const runBtn = document.querySelector<HTMLButtonElement>(
		`.exec-run-btn[data-block-id="${CSS.escape(blockId)}"]`,
	);

	if (!outputEl) {
		return;
	}

	if (runBtn) {
		runBtn.disabled = true;
		runBtn.textContent = "Loading React...";
	}

	clearElement(outputEl);

	try {
		await mountJsxSource(code, outputEl);
	} catch (err) {
		renderError(outputEl, err instanceof Error ? err.message : String(err));
	} finally {
		if (runBtn) {
			runBtn.disabled = false;
			runBtn.textContent = "Run";
		}
	}
}

export async function mountJsxPages(
	root: ParentNode = document,
	signal?: AbortSignal,
): Promise<void> {
	const pages = root.querySelectorAll<HTMLElement>("[data-jsx-page]");

	for (const target of pages) {
		if (signal?.aborted) return;
		if (target.children.length > 0) {
			continue;
		}

		const relPath = target.dataset.jsxPage;
		if (!relPath) {
			continue;
		}

		const source = document.querySelector<HTMLScriptElement>(
			`script[data-jsx-source="${CSS.escape(relPath)}"]`,
		);
		if (!source?.textContent) {
			renderError(target, `Source not found for JSX page ${relPath}`);
			continue;
		}

		try {
			await mountJsxSource(source.textContent, target, signal);
		} catch (err) {
			renderError(target, err instanceof Error ? err.message : String(err));
		}
	}
}

export async function mountAutoJsxBlocks(
	root: ParentNode = document,
	signal?: AbortSignal,
): Promise<void> {
	const blocks = root.querySelectorAll<HTMLElement>(
		".block-exec[data-language='jsx'], .exec-block[data-language='jsx']",
	);

	for (const block of blocks) {
		if (signal?.aborted) return;
		const blockId = block.dataset.blockId;
		if (!blockId) {
			continue;
		}

		const outputEl = block.querySelector<HTMLElement>(
			`.exec-output[data-output="${CSS.escape(blockId)}"]`,
		);
		if (!outputEl || outputEl.children.length > 0) {
			continue;
		}

		const source = document.querySelector<HTMLScriptElement>(
			`script[data-source="${CSS.escape(blockId)}"]`,
		);
		if (!source?.textContent) {
			renderError(outputEl, `Source not found for block ${blockId}`);
			continue;
		}

		try {
			const code = decodeSource(source.textContent);
			await mountJsxSource(code, outputEl, signal);
		} catch (err) {
			renderError(outputEl, err instanceof Error ? err.message : String(err));
		}
	}
}

export function teardownJsxMounts(): void {
	for (const mountedRoot of mountedRoots.values()) {
		mountedRoot.unmount();
	}
	mountedRoots.clear();
}

async function mountJsxSource(
	code: string,
	target: HTMLElement,
	signal?: AbortSignal,
): Promise<void> {
	const { Babel } = await loadJsxRuntime();
	if (signal?.aborted || !target.isConnected) return;
	ensureWidgetStyles();
	const transformed = Babel.transform(code, {
		presets: ["react"],
	}).code;

	const existing = mountedRoots.get(target);
	if (existing) {
		existing.unmount();
		mountedRoots.delete(target);
	}

	clearElement(target);
	const mountEl = document.createElement("div");
	mountEl.className = "jsx-output__mount";
	target.appendChild(mountEl);
	const root = createRoot(mountEl);
	mountedRoots.set(target, root);

	const render = (element: React.ReactNode) => root.render(element);
	const ReactDOM = { createRoot };
	Object.assign(globalThis, { React, ReactDOM });
	const fn = new Function("React", "ReactDOM", "render", transformed);
	fn(React, ReactDOM, render);
}

function ensureWidgetStyles(): void {
	if (document.querySelector("style[data-readrun-widget-styles]")) {
		return;
	}

	const style = document.createElement("style");
	style.dataset.readrunWidgetStyles = "true";
	style.textContent = `${widgetTokenCompatibilityStyles}\n${vizStyles}`;
	document.head.appendChild(style);
}

const widgetTokenCompatibilityStyles = `
:root {
  --bg: var(--color-bg);
  --text: var(--color-text);
  --border: var(--color-border);
  --muted: var(--color-text-muted);
  --text-muted: var(--color-text-muted);
  --accent: var(--rr-accent);
  --card-bg: var(--color-bg-alt);
  --input-bg: var(--color-code-bg);
  --radius: 0;
}
`;

async function loadJsxRuntime(): Promise<JsxRuntime> {
	if (runtime) {
		return runtime;
	}

	if (runtimeLoading) {
		return runtimeLoading;
	}

	runtimeLoading = (async () => {
		await loadScript("https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js");
		await loadTailwind();

		const Babel = (globalThis as { Babel?: BabelStandalone }).Babel;
		if (!Babel) {
			throw new Error("Babel failed to load.");
		}

		runtime = { Babel };
		return runtime;
	})();

	return runtimeLoading;
}

function loadScript(src: string): Promise<void> {
	const absoluteSrc = new URL(src, document.baseURI).href;
	const existing = Array.from(document.scripts).find(
		(script) =>
			script.getAttribute("src") === src || script.src === absoluteSrc,
	);
	if (existing?.dataset.loaded === "true") {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const script = existing ?? document.createElement("script");
		script.src = src;
		script.onload = () => {
			script.dataset.loaded = "true";
			resolve();
		};
		script.onerror = () => reject(new Error(`Failed to load ${src}`));
		if (!existing) {
			document.head.appendChild(script);
		}
	});
}

async function loadTailwind(): Promise<void> {
	if (document.querySelector("script[data-readrun-tailwind-config]")) {
		return;
	}

	await initialiseTailwind(
		() => loadScript("https://cdn.tailwindcss.com"),
		() => {
			const config = document.createElement("script");
			config.dataset.readrunTailwindConfig = "true";
			config.textContent =
				"globalThis.tailwind.config = { corePlugins: { preflight: false } }";
			document.head.appendChild(config);
		},
	);
}

export async function initialiseTailwind(
	loadRuntime: () => Promise<void>,
	applyConfig: () => void,
): Promise<void> {
	await loadRuntime();
	applyConfig();
}

function decodeSource(encoded: string): string {
	return atob(encoded.trim());
}

function clearElement(el: HTMLElement): void {
	while (el.firstChild) {
		el.firstChild.remove();
	}
}

function renderError(el: HTMLElement, message: string): void {
	clearElement(el);
	const pre = document.createElement("pre");
	pre.className = "error";
	pre.textContent = message;
	el.appendChild(pre);
}
