import { runJsxBlock } from "./jsx.ts";
import { readRuntimeConfig } from "../runtime-config.ts";
import { loadSettings } from "../settings.ts";
import { decodeSource } from "./source.ts";
import { runPyodideBlock } from "./pyodide.ts";

// --- Types ---

export interface ServerExecResult {
	ok: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	timedOut: boolean;
	files: Array<{
		name: string;
		data: string;
		encoding: "base64";
		extension: string;
		isImage: boolean;
	}>;
	errorMessage?: string;
}

// --- Python execution ---

export async function runPythonBlock(
	blockId: string,
	code: string,
): Promise<void> {
	const elements = findExecElements(blockId);
	if (!elements || elements.runBtn.disabled) return;
	const { outputEl, runBtn } = elements;
	setRunButtonState(runBtn, true, "Loading Python...");

	try {
		const runtime = readRuntimeConfig();
		const settings = loadSettings();
		const useLocalPython =
			settings.useLocalPython && (runtime?.enableLocalPython ?? true);

		if (useLocalPython) {
			await runLocalPythonBlock(blockId, code);
		} else if (runtime?.enableBrowserPython === true) {
			if (outputEl.isConnected) await runPyodideBlock(blockId, code);
		} else {
			clearElement(outputEl);
			appendText(
				outputEl,
				"Python execution is unavailable. Enable local Python with uv or browser Python in the runtime config.",
				"error",
			);
		}
	} catch (error) {
		clearElement(outputEl);
		appendText(outputEl, error instanceof Error ? error.message : String(error), "error");
	} finally {
		setRunButtonState(runBtn, false, "Run");
	}
}

async function runLocalPythonBlock(
	blockId: string,
	code: string,
): Promise<void> {
	const elements = findExecElements(blockId);
	if (!elements) {
		return;
	}

	const { outputEl, runBtn } = elements;

	setRunButtonState(runBtn, true, "Running locally...");
	clearElement(outputEl);
	appendStatus(outputEl, "Running locally...", "loading");

	try {
		const response = await fetch(readRuntimeConfig()?.pythonExecutionUrl ?? "/api/exec/python", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code }),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			clearElement(outputEl);
			appendText(
				outputEl,
				`Server error (${response.status}): ${errorText}`,
				"error",
			);
			return;
		}

		const result = (await response.json()) as ServerExecResult;
		clearElement(outputEl);
		renderExecResult(outputEl, result);
	} catch (err) {
		clearElement(outputEl);
		const message = err instanceof Error ? err.message : String(err);
		appendText(outputEl, `Connection error: ${message}`, "error");
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

function findExecElements(blockId: string):
	| { outputEl: HTMLElement; runBtn: HTMLButtonElement }
	| null {
	const outputEl = document.querySelector<HTMLElement>(
		`.exec-output[data-output="${CSS.escape(blockId)}"]`,
	);
	const runBtn = document.querySelector<HTMLButtonElement>(
		`.exec-run-btn[data-block-id="${CSS.escape(blockId)}"]`,
	);

	if (!outputEl || !runBtn) {
		return null;
	}
	return { outputEl, runBtn };
}

function renderExecResult(
	outputEl: HTMLElement,
	result: ServerExecResult,
): void {
	if (result.stdout) {
		appendText(outputEl, result.stdout, "stdout");
	}

	if (result.stderr) {
		appendText(outputEl, result.stderr, "stderr");
	}

	if (result.files && result.files.length > 0) {
		for (const file of result.files) {
			if (file.isImage) {
				const dataUrl = `data:image/${file.extension};base64,${file.data}`;
				const img = document.createElement("img");
				img.src = dataUrl;
				img.alt = file.name;
				outputEl.appendChild(img);
			} else {
				const dataUrl = `data:application/octet-stream;base64,${file.data}`;
				const link = document.createElement("a");
				link.className = "exec-file-link";
				link.href = dataUrl;
				link.download = file.name;
				link.textContent = `\u2b07 ${file.name}`;
				outputEl.appendChild(link);
			}
		}
	}

	if (!result.ok) {
		const message = result.timedOut
			? (result.errorMessage ?? "Execution timed out")
			: `Exit code ${result.exitCode}: ${result.errorMessage ?? "Execution failed"}`;
		appendText(outputEl, message, "error");
	}
}

// --- DOM helpers ---

function clearElement(el: HTMLElement): void {
	while (el.firstChild) {
		el.firstChild.remove();
	}
}

function appendText(el: HTMLElement, text: string, className?: string): void {
	const pre = document.createElement("pre");
	if (className) {
		pre.className = className;
	}
	pre.textContent = text;
	el.appendChild(pre);
}

function appendStatus(el: HTMLElement, text: string, className: string): void {
	const div = document.createElement("div");
	div.className = className;
	div.textContent = text;
	el.appendChild(div);
}

// --- Initialization ---

export function initExecBlocks(root?: ParentNode): () => void {
	const scope = root ?? (typeof document !== "undefined" ? document : null);
	if (!scope) {
		return () => {};
	}

	const handler = (event: Event): void => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const button = target.closest<HTMLButtonElement>(".exec-run-btn");
		if (!button || button.disabled) return;

		event.preventDefault();

		const blockId = button.dataset.blockId;
		if (!blockId) {
			return;
		}

		const block = button.closest<HTMLElement>(".block-exec, .exec-block");
		const language = block?.dataset.language ?? "python";

		const editableEl = scope.querySelector<HTMLTextAreaElement>(
			`textarea[data-editable-source="${CSS.escape(blockId)}"]`,
		);
		const sourceEl = scope.querySelector<HTMLScriptElement>(
			`script[data-source="${CSS.escape(blockId)}"]`,
		);
		if (!sourceEl?.textContent && !editableEl) {
			const outputEl = scope.querySelector<HTMLElement>(
				`.exec-output[data-output="${CSS.escape(blockId)}"]`,
			);
			if (outputEl) {
				clearElement(outputEl);
				appendText(outputEl, `Source not found for block ${blockId}`, "error");
			}
			return;
		}

		let code: string;
		if (editableEl) {
			code = editableEl.value;
		} else {
			try {
				code = decodeSource(sourceEl!.textContent!);
			} catch {
				const outputEl = scope.querySelector<HTMLElement>(
					`.exec-output[data-output="${CSS.escape(blockId)}"]`,
				);
				if (outputEl) {
					clearElement(outputEl);
					appendText(
						outputEl,
						`Failed to decode source for block ${blockId}`,
						"error",
					);
				}
				return;
			}
		}

		if (language === "jsx") {
			void runJsxBlock(blockId, code);
			return;
		}

		void runPythonBlock(blockId, code);
	};

	scope.addEventListener("click", handler);

	return () => {
		scope.removeEventListener("click", handler);
	};
}
