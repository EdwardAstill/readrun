import type React from "react";
import {
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useSyncExternalStore,
} from "react";

import {
	getActiveOverlay,
	isOverlayId,
	openOverlay,
	subscribeOverlays,
} from "../overlay.ts";
import { ToolkitWorkspace } from "../toolkits/ToolkitWorkspace.tsx";
import { TOOLKIT_DEFINITIONS } from "../toolkits/registry.tsx";
import type {
	ToolkitDefinition,
	ToolkitId,
} from "../toolkits/types.ts";
import {
	createToolkitWorkspaceState,
	reduceToolkitWindows,
} from "../toolkits/window-state.ts";
import { CodeModalIsland } from "./CodeModalIsland.tsx";
import { CommandPaletteIsland } from "./CommandPaletteIsland.tsx";
import { ContextMenuIsland } from "./ContextMenuIsland.tsx";
import { LightboxIsland } from "./LightboxIsland.tsx";
import { SettingsIsland } from "./SettingsIsland.tsx";
import { ShortcutsIsland } from "./ShortcutsIsland.tsx";
import { SiteSearchIsland } from "./SiteSearchIsland.tsx";

declare global {
	interface Window {
		openSiteSearch?: () => void;
	}
}

export interface ShellDialogsIslandProps {
	searchEnabled: boolean;
	settingsEnabled: boolean;
	toolkitDefinitions?: readonly ToolkitDefinition[];
}

export function ShellDialogsIsland(
	props: ShellDialogsIslandProps,
): React.JSX.Element {
	const toolkitDefinitions = props.toolkitDefinitions ?? TOOLKIT_DEFINITIONS;
	const activeOverlay = useSyncExternalStore(
		subscribeOverlays,
		getActiveOverlay,
		() => null,
	);
	const [toolkitState, dispatchToolkit] = useReducer(
		reduceToolkitWindows,
		undefined,
		createToolkitWorkspaceState,
	);
	const focusFrameRef = useRef<number | null>(null);
	const reportedUnknownToolkitIdsRef = useRef(new Set<ToolkitId>());

	const openToolkit = useCallback(
		(id: ToolkitId): void => {
			const definition = toolkitDefinitions.find((item) => item.id === id);
			if (!definition) {
				if (
					process.env.NODE_ENV !== "production" &&
					!reportedUnknownToolkitIdsRef.current.has(id)
				) {
					reportedUnknownToolkitIdsRef.current.add(id);
					console.error(`Toolkit "${id}" is not registered in the application shell.`);
				}
				return;
			}

			dispatchToolkit({
				type: "open",
				definition,
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight,
				},
			});
			if (focusFrameRef.current !== null) {
				cancelAnimationFrame(focusFrameRef.current);
			}
			focusFrameRef.current = requestAnimationFrame(() => {
				focusFrameRef.current = null;
				const dialog = document.querySelector<HTMLElement>(
					`[data-toolkit-id="${id}"]`,
				);
				const target =
					dialog?.querySelector<HTMLElement>("[data-toolkit-primary-input]") ??
					dialog?.querySelector<HTMLElement>("textarea, input");
				target?.focus();
			});
		},
		[toolkitDefinitions],
	);

	useEffect(
		() => () => {
			if (focusFrameRef.current !== null) {
				cancelAnimationFrame(focusFrameRef.current);
			}
		},
		[],
	);

	useEffect(() => {
		const handleClick = (event: MouseEvent): void => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const action = target.closest<HTMLElement>("[data-open-overlay]");
			const id = action?.dataset.openOverlay;
			if (id && isOverlayId(id)) openOverlay(id);
		};
		const openPageSearch = (): void => openOverlay("page-search-overlay");
		const openSiteSearch = (): void => openOverlay("site-search-overlay");
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (
				(event.ctrlKey || event.metaKey) &&
				event.key.toLowerCase() === "k"
			) {
				event.preventDefault();
				openOverlay("command-palette-overlay");
			}
		};

		document.addEventListener("click", handleClick);
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("readrun:open-page-search", openPageSearch);
		document.addEventListener("readrun:open-site-search", openSiteSearch);
		window.openSiteSearch = openSiteSearch;
		return () => {
			document.removeEventListener("click", handleClick);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("readrun:open-page-search", openPageSearch);
			document.removeEventListener("readrun:open-site-search", openSiteSearch);
			if (window.openSiteSearch === openSiteSearch) delete window.openSiteSearch;
		};
	}, []);

	return (
		<>
			<CodeModalIsland />
			<ContextMenuIsland />
			<LightboxIsland />
			{props.settingsEnabled ? (
				<SettingsIsland open={activeOverlay === "settings-overlay"} />
			) : null}
			<ShortcutsIsland open={activeOverlay === "shortcuts-overlay"} />
			<CommandPaletteIsland
				open={activeOverlay === "command-palette-overlay"}
				onOpenToolkit={openToolkit}
			/>
			{props.searchEnabled ? (
				<SiteSearchIsland open={activeOverlay === "site-search-overlay"} />
			) : null}
			<ToolkitWorkspace
				definitions={toolkitDefinitions}
				state={toolkitState}
				dispatch={dispatchToolkit}
				escapeClosesTopmost={activeOverlay === null}
			/>
		</>
	);
}
