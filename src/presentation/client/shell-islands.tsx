import React, { useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PageSearchIsland } from "./islands/PageSearchIsland.tsx";
import { ShellDialogsIsland } from "./islands/ShellDialogsIsland.tsx";
import {
	closeAllOverlays,
	closeOverlay,
	getActiveOverlay,
	subscribeOverlays,
} from "./overlay.ts";

export interface ShellIslandsHandle {
	teardown(): void;
}

export function mountApplicationShellIslands(
	root: ParentNode = document,
): ShellIslandsHandle {
	const mountedRoots: Root[] = [];
	const dialogsHost = root.querySelector<HTMLElement>(
		"[data-island='shell-dialogs']",
	);

	if (dialogsHost) {
		mountIsland(
			root,
			"[data-island='shell-dialogs']",
			<ShellDialogsIsland
				searchEnabled={dialogsHost.dataset.searchEnabled === "true"}
				settingsEnabled={dialogsHost.dataset.settingsEnabled === "true"}
			/>,
			mountedRoots,
		);
	}

	return {
		teardown() {
			closeAllOverlays();
			for (const mountedRoot of mountedRoots) {
				mountedRoot.unmount();
			}
		},
	};
}

export function mountPageShellIslands(
	root: ParentNode = document,
): ShellIslandsHandle {
	const mountedRoots: Root[] = [];
	mountIsland(
		root,
		"[data-island='page-search']",
		<PageSearchIslandController />,
		mountedRoots,
	);

	return {
		teardown() {
			closeOverlay("page-search-overlay");
			for (const mountedRoot of mountedRoots) mountedRoot.unmount();
		},
	};
}

function PageSearchIslandController(): React.JSX.Element {
	const activeOverlay = useSyncExternalStore(
		subscribeOverlays,
		getActiveOverlay,
		() => null,
	);
	return <PageSearchIsland open={activeOverlay === "page-search-overlay"} />;
}

function mountIsland(
	root: ParentNode,
	selector: string,
	element: React.JSX.Element,
	mountedRoots: Root[],
): void {
	const target = root.querySelector(selector);
	if (!(target instanceof HTMLElement)) {
		return;
	}
	const islandRoot = createRoot(target);
	islandRoot.render(element);
	mountedRoots.push(islandRoot);
}
