import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { vizStyles } from "../../../widgets/primitives/styles.ts";
import { decodeSource } from "./source.ts";

interface BabelStandalone {
	transform(code: string, options: object): { code: string };
}

interface JsxRuntime {
	Babel: BabelStandalone;
}

let runtime: JsxRuntime | null = null;
let runtimeLoading: Promise<JsxRuntime> | null = null;
const mountedRoots = new Map<HTMLElement, Root>();
const loadingTargets = new WeakSet<HTMLElement>();
let mountGeneration = 0;

class ExecutionErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ error: string | null }
> {
	override state = { error: null as string | null };

	static getDerivedStateFromError(error: unknown) {
		return { error: error instanceof Error ? error.message : String(error) };
	}

	override render() {
		return this.state.error !== null
			? React.createElement("pre", { className: "error" }, this.state.error)
			: this.props.children;
	}
}

export async function runJsxBlock(blockId: string, code: string, signal?: AbortSignal): Promise<void> {
	const outputEl = document.querySelector<HTMLElement>(
		`.exec-output[data-output="${CSS.escape(blockId)}"]`,
	);
	const runBtn = document.querySelector<HTMLButtonElement>(
		`.exec-run-btn[data-block-id="${CSS.escape(blockId)}"]`,
	);

	if (!outputEl || loadingTargets.has(outputEl)) {
		return;
	}

	loadingTargets.add(outputEl);
	if (runBtn) setRunButtonState(runBtn, true, "Loading React...");
	if (!mountedRoots.has(outputEl)) {
		const status = document.createElement("div");
		status.className = "loading";
		status.textContent = "Loading React...";
		outputEl.replaceChildren(status);
	}

	try {
		await mountJsxSource(code, outputEl, signal);
	} catch (err) {
		renderError(outputEl, err instanceof Error ? err.message : String(err));
	} finally {
		loadingTargets.delete(outputEl);
		if (runBtn) {
			setRunButtonState(runBtn, false, "Run");
		}
	}
}

function setRunButtonState(
	button: HTMLButtonElement,
	disabled: boolean,
	label: string,
): void {
	button.disabled = disabled;
	button.setAttribute("aria-busy", String(disabled));
	button.setAttribute("aria-label", label);
	button.title = label;
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

		const source = root.querySelector<HTMLScriptElement>(
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

		const source = block.querySelector<HTMLScriptElement>(
			`script[data-source="${CSS.escape(blockId)}"]`,
		);
		if (!source?.textContent) {
			renderError(outputEl, `Source not found for block ${blockId}`);
			continue;
		}

		try {
			const code = decodeSource(source.textContent);
			await runJsxBlock(blockId, code, signal);
		} catch (err) {
			renderError(outputEl, err instanceof Error ? err.message : String(err));
		}
	}
}

export function teardownJsxMounts(): void {
	mountGeneration++;
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
	const generation = mountGeneration;
	const { Babel } = await loadJsxRuntime();
	if (signal?.aborted || !target.isConnected || generation !== mountGeneration) return;
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

	const render = (element: React.ReactNode) =>
		root.render(React.createElement(ExecutionErrorBoundary, null, element));
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

export const widgetTokenCompatibilityStyles = `
.jsx-output__mount {
  --bg: var(--color-bg);
  --text: var(--color-text);
  --border: var(--color-border);
  --muted: var(--color-text-muted);
  --text-muted: var(--color-text-muted);
  --accent: var(--rr-accent);
  --card-bg: var(--color-bg-alt);
  --input-bg: var(--color-code-bg);
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
	})().catch((error) => {
		runtimeLoading = null;
		throw error;
	});

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

	const { promise, resolve, reject } = Promise.withResolvers<void>();
	const script = existing ?? document.createElement("script");
	script.src = src;
	script.onload = () => {
		script.dataset.loaded = "true";
		resolve();
	};
	script.onerror = () => {
		script.remove();
		reject(new Error(`Failed to load ${src}`));
	};
	if (!existing) document.head.appendChild(script);
	return promise;
}

async function loadTailwind(): Promise<void> {
	if (!document.querySelector("style[data-readrun-tailwind]")) {
		const style = document.createElement("style");
		style.type = "text/tailwindcss";
		style.dataset.readrunTailwind = "true";
		// Match the app's Tailwind major and leave its existing base styles intact.
		style.textContent = `
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
`;
		document.head.appendChild(style);
	}
	await loadScript("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4");
}


function clearElement(el: HTMLElement): void {
	while (el.firstChild) {
		el.firstChild.remove();
	}
}

function renderError(el: HTMLElement, message: string): void {
	const mounted = mountedRoots.get(el);
	if (mounted) {
		mounted.unmount();
		mountedRoots.delete(el);
	}
	clearElement(el);
	const pre = document.createElement("pre");
	pre.className = "error";
	pre.textContent = message;
	el.appendChild(pre);
}
