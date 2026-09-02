import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	SearchPalette,
	type SearchPaletteItem,
} from "../../components/reusable/SearchPalette.tsx";
import { closeOverlay, openOverlay } from "../overlay.ts";
import type { ToolkitId } from "../toolkits/types.ts";

type SearchOverlayId = "site-search-overlay" | "page-search-overlay";

export type CommandPaletteCommand = SearchPaletteItem &
	(
		| { toolkitId: ToolkitId; overlayId?: never }
		| { toolkitId?: never; overlayId: SearchOverlayId }
	);

export const COMMAND_PALETTE_COMMANDS = [
	{
		id: "open-scientific-calculator",
		title: "Open Scientific Calculator",
		subtitle: "Open the scientific calculator.",
		toolkitId: "scientific-calculator",
	},
	{
		id: "search-site",
		title: "Search Site",
		subtitle: "Search across every page.",
		overlayId: "site-search-overlay",
	},
	{
		id: "search-page",
		title: "Search Page",
		subtitle: "Search within the current page.",
		overlayId: "page-search-overlay",
	},
] as const satisfies readonly CommandPaletteCommand[];

export function filterCommandPaletteCommands(
	query: string,
): readonly CommandPaletteCommand[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return COMMAND_PALETTE_COMMANDS;

	return COMMAND_PALETTE_COMMANDS.filter((command) =>
		`${command.title} ${command.subtitle}`.toLowerCase().includes(normalized),
	);
}

export interface CommandPaletteIslandProps {
	open: boolean;
	onOpenToolkit: (id: ToolkitId) => void;
}

export function CommandPaletteIsland({
	open,
	onOpenToolkit,
}: CommandPaletteIslandProps): React.JSX.Element {
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (!open) setQuery("");
	}, [open]);

	const commands = useMemo(
		() => filterCommandPaletteCommands(query),
		[query],
	);
	const selectCommand = useCallback(
		(item: SearchPaletteItem) => {
			const command = COMMAND_PALETTE_COMMANDS.find(
				(candidate) => candidate.id === item.id,
			);
			if (!command) return;

			if ("toolkitId" in command) {
				onOpenToolkit(command.toolkitId);
			} else {
				openOverlay(command.overlayId);
			}
		},
		[onOpenToolkit],
	);

	return (
		<SearchPalette
			id="command-palette-overlay"
			open={open}
			value={query}
			onChange={setQuery}
			onClose={() => closeOverlay("command-palette-overlay")}
			items={commands}
			onSelect={selectCommand}
			placeholder="Type a command..."
			ariaLabel="Command palette"
			emptyLabel="No matching commands"
		/>
	);
}
