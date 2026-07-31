import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/Button.tsx";
import { Card, CardContent } from "../../components/ui/Card.tsx";
import {
	DialogHeader,
	DialogTitle,
} from "../../components/ui/Dialog.tsx";
import { Modal } from "../../components/reusable/Modal.tsx";

export function CodeModalIsland(): React.JSX.Element {
	const [block, setBlock] = useState<HTMLElement | null>(null);
	const outputRef = useRef<HTMLDivElement>(null);
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
		return () => document.removeEventListener("click", handleClick);
	}, []);

	useEffect(() => {
		if (!block || !outputRef.current) return;
		const output = outputRef.current;
		syncOutput(block, output);
		const source = findOutput(block);
		if (!source) return;

		const observer = new MutationObserver(() => syncOutput(block, output));
		observer.observe(source, {
			childList: true,
			subtree: true,
			characterData: true,
		});
		return () => observer.disconnect();
	}, [block]);

	const language =
		block?.dataset.language ?? block?.getAttribute("data-language") ?? "text";
	const canRun = Boolean(block?.querySelector(".exec-run-btn"));

	return (
		<Modal
			id="code-modal"
			open={block !== null}
			onClose={close}
			contentClassName="sm:max-w-2xl"
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
					onClick={() =>
						block?.querySelector<HTMLElement>(".exec-run-btn")?.click()
					}
				>
					Run
				</Button>
			) : null}
			<Card className="gap-0 overflow-hidden py-0">
				<CardContent className="p-0" id="code-modal-code">
					<pre className="m-0 w-full overflow-x-auto bg-muted p-4">
						<code>{block ? readCodeText(block) : ""}</code>
					</pre>
				</CardContent>
				<CardContent
					className="p-0"
					id="code-modal-output"
					ref={outputRef}
				/>
			</Card>
		</Modal>
	);
}

function findOutput(block: HTMLElement): HTMLElement | null {
	return block.querySelector<HTMLElement>("output.exec-output, .exec-output");
}

/** Replace output contents with a safe clone of the source output element. */
export function syncOutput(block: HTMLElement, target: HTMLElement): void {
	const source = findOutput(block);
	target.replaceChildren(
		...(source
			? Array.from(source.childNodes, (child) => child.cloneNode(true))
			: []),
	);
}

export function readCodeText(block: HTMLElement): string {
	const editable = block.querySelector<HTMLTextAreaElement>(".exec-editable");
	if (editable) return editable.value;

	const source = block.querySelector<HTMLScriptElement>("script[data-source]");
	if (source?.textContent) {
		try {
			return atob(source.textContent.trim());
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

	const originalText = button.textContent ?? "Copy";
	try {
		await writeClipboard(readCodeText(block));
		button.textContent = "Copied";
	} catch {
		button.textContent = "Failed";
	} finally {
		window.setTimeout(() => {
			button.textContent = originalText;
		}, 1200);
	}
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
