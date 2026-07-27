import type React from "react";
import { useEffect, useSyncExternalStore } from "react";

import {
	getActiveOverlay,
	isOverlayId,
	openOverlay,
	subscribeOverlays,
} from "../overlay.ts";
import { CodeModalIsland } from "./CodeModalIsland.tsx";
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
}

export function ShellDialogsIsland(
	props: ShellDialogsIslandProps,
): React.JSX.Element {
	const activeOverlay = useSyncExternalStore(
		subscribeOverlays,
		getActiveOverlay,
		() => null,
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
				props.searchEnabled &&
				(event.ctrlKey || event.metaKey) &&
				event.key.toLowerCase() === "k"
			) {
				event.preventDefault();
				openSiteSearch();
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
	}, [props.searchEnabled]);

	return (
		<>
			<CodeModalIsland />
			<ContextMenuIsland />
			<LightboxIsland />
			{props.settingsEnabled ? (
				<SettingsIsland open={activeOverlay === "settings-overlay"} />
			) : null}
			<ShortcutsIsland open={activeOverlay === "shortcuts-overlay"} />
			{props.searchEnabled ? (
				<SiteSearchIsland open={activeOverlay === "site-search-overlay"} />
			) : null}
		</>
	);
}
