import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/Button.tsx";
import { Card, CardContent } from "../../components/ui/Card.tsx";
import {
	DialogHeader,
	DialogTitle,
} from "../../components/ui/Dialog.tsx";
import { Modal } from "../../components/reusable/Modal.tsx";
import { decodeSource } from "../execution/source.ts";

export function CodeModalIsland(): React.JSX.Element {
	const [block, setBlock] = useState<HTMLElement | null>(null);
	const [runState, setRunState] = useState({ disabled: false, label: "Run" });
	const [outputElement, setOutputElement] = useState<HTMLDivElement | null>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const close = useCallback(() => setBlock(null), []);

	useEffect(() => {
		const handleClick = (event: MouseEvent): void => {
			const target = event.target;
			if (!(target instanceof Element)) return;

			const enlargeButton = target.closest<HTMLElement>(".exec-enlarge-btn");
			if (enlargeButton) {
				const sourceBlock = enlargeButton.closest<HTMLElement>(
					".code-panel, .exec-block, .block-exec",
				);
				if (sourceBlock) {
					event.preventDefault();
					returnFocusRef.current = enlargeButton;
					setBlock(sourceBlock);
				}
				return;
			}

			const copyButton = target.closest<HTMLButtonElement>(".code-copy-btn");
			if (copyButton) {
				event.preventDefault();
				void copyCodeFromButton(copyButton);
			}
		};

		document.addEventListener("click", handleClick);
		document.addEventListener("readrun:remount", close);
		return () => {
			document.removeEventListener("click", handleClick);
			document.removeEventListener("readrun:remount", close);
		};
	}, [close]);

	useEffect(() => {
		if (!block || !outputElement) return;
		const source = findOutput(block);
		const placeholder = document.createComment("code-modal-output");
		if (source) {
			source.before(placeholder);
			outputElement.replaceChildren(source);
		}

		const runButton = block.querySelector<HTMLButtonElement>(".exec-run-btn");
		const syncRunState = () => setRunState({
			disabled: runButton?.disabled ?? false,
			label: runButton?.getAttribute("aria-label") ?? "Run",
		});
		syncRunState();
		const observer = new MutationObserver(syncRunState);
		if (runButton) observer.observe(runButton, {
			attributes: true,
			attributeFilter: ["disabled", "aria-label"],
		});
		return () => {
			observer.disconnect();
			if (source) placeholder.replaceWith(source);
		};
	}, [block, outputElement]);

	const language =
		block?.dataset.language ?? block?.getAttribute("data-language") ?? "text";
	const canRun = Boolean(block?.querySelector(".exec-run-btn"));

	return (
		<Modal
			id="code-modal"
			open={block !== null}
			onClose={close}
			contentClassName="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"
			ariaLabelledBy="code-modal-title"
			finalFocusRef={returnFocusRef}
		>
			<DialogHeader>
				<DialogTitle id="code-modal-title">
					{language}
				</DialogTitle>
			</DialogHeader>
			{canRun ? (
				<Button
					className="justify-self-start"
					id="code-modal-run"
					size="sm"
					disabled={runState.disabled}
					aria-busy={runState.disabled}
					onClick={() =>
						block?.querySelector<HTMLElement>(".exec-run-btn")?.click()
					}
				>
					{runState.label}
				</Button>
			) : null}
			<Card className="gap-0 overflow-hidden py-0">
				<CardContent className="p-0" id="code-modal-code">
					<pre className="m-0 w-full overflow-x-auto bg-muted p-4">
						<code>{block ? readCodeText(block) : ""}</code>
					</pre>
				</CardContent>
				<CardContent
					className="exec-block p-0"
					data-language={language}
					id="code-modal-output"
					ref={setOutputElement}
				/>
			</Card>
		</Modal>
	);
}

function findOutput(block: HTMLElement): HTMLElement | null {
	return block.querySelector<HTMLElement>("output.exec-output, .exec-output");
}

export function readCodeText(block: HTMLElement): string {
	const editable = block.querySelector<HTMLTextAreaElement>(".exec-editable");
	if (editable) return editable.value;

	const source = block.querySelector<HTMLScriptElement>("script[data-source]");
	if (source?.textContent) {
		try {
			return decodeSource(source.textContent);
		} catch {
			// Fall back to the visible code if the source payload is malformed.
		}
	}

	return block.querySelector<HTMLElement>("pre code")?.textContent ?? "";
}

async function copyCodeFromButton(button: HTMLButtonElement): Promise<void> {
	const block = button.closest<HTMLElement>(
		".code-panel, .exec-block, .block-exec",
	);
	if (!block) return;

	const originalLabel = button.getAttribute("aria-label") ?? "Copy";
	try {
		await writeClipboard(readCodeText(block));
		setButtonLabel(button, "Copied");
	} catch {
		setButtonLabel(button, "Copy failed");
	} finally {
		window.setTimeout(() => {
			setButtonLabel(button, originalLabel);
		}, 1200);
	}
}

function setButtonLabel(button: HTMLButtonElement, label: string): void {
	button.setAttribute("aria-label", label);
	button.title = label;
}

async function writeClipboard(text: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.readOnly = true;
	textarea.style.position = "fixed";
	textarea.style.top = "-9999px";
	document.body.append(textarea);
	textarea.select();
	const copied = document.execCommand("copy");
	textarea.remove();
	if (!copied) throw new Error("Clipboard copy failed");
}
