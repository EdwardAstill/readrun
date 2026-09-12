import { useEffect, useRef, useState } from "react";
import { type SelectionCommand } from "../../shared/selection-commands.ts";
import { DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/DropdownMenu.tsx";
import { selectionCommandsAvailable, selectionCommandsRequest } from "./selection-commands-api.ts";

export interface SelectedPassage { selection: string; relPath: string }
export function selectedPassage(doc: Document = document): SelectedPassage | null {
	const selection = doc.getSelection();
	const main = doc.querySelector("#main-content");
	if (!selection || !main || selection.isCollapsed || !selection.rangeCount ||
		!main.contains(selection.anchorNode) || !main.contains(selection.focusNode)) return null;
	const text = selection.toString();
	if (!text.trim()) return null;
	try {
		const data = JSON.parse(doc.querySelector("#readrun-files")?.textContent || "{}");
		return typeof data.page?.relPath === "string" ? { selection: text, relPath: data.page.relPath } : null;
	} catch { return null; }
}


export function useSelectionCommands(close: () => void) {
	const [passage, setPassage] = useState<SelectedPassage | null>(null);
	const [commands, setCommands] = useState<SelectionCommand[]>([]);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const generation = useRef(0);
	useEffect(() => () => { generation.current++; }, []);
	function capture() {
		const selected = selectedPassage();
		setPassage(selected);
		setCommands([]);
		setMessage("");
		const current = ++generation.current;
		const available = selected !== null && selectionCommandsAvailable();
		setLoading(available);
		if (!available) return;
		void selectionCommandsRequest().then((settings) => {
			if (current === generation.current) setCommands(settings.commands.filter((command) => command.enabled));
		}).catch((error) => { if (current === generation.current) setMessage(error.message); })
			.finally(() => { if (current === generation.current) setLoading(false); });
	}
	async function launch(commandId: string) {
		close();
		setMessage("Opening OMP…");
		try {
			await selectionCommandsRequest("/launch", { commandId, ...passage });
			setMessage("OMP opened. Review the prompt in your terminal and press Enter when ready.");
		} catch (error) { setMessage(error instanceof Error ? error.message : "Could not open OMP."); }
	}
	return {
		capture,
		items: passage && <>
			<DropdownMenuItem onClick={() => {
				close();
				void navigator.clipboard.writeText(passage.selection).catch(() => setMessage("Could not copy text. Use your keyboard copy shortcut."));
			}}>Copy</DropdownMenuItem>
			{loading && <DropdownMenuItem disabled>Loading commands…</DropdownMenuItem>}
			{commands.map((command) => <DropdownMenuItem key={command.id} onClick={() => void launch(command.id)}>{command.label}</DropdownMenuItem>)}
			<DropdownMenuSeparator />
		</>,
		status: message && <div role="status" className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md">
			{message}<button className="ml-3 underline" onClick={() => setMessage("")} aria-label="Dismiss command status">Dismiss</button>
		</div>,
	};
}
