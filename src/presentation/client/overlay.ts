// Centralized overlay state for React islands and imperative shell actions.

import { clearNavFocus } from "./nav-focus.ts";

export const OVERLAY_IDS = [
	"settings-overlay",
	"shortcuts-overlay",
	"page-search-overlay",
	"site-search-overlay",
] as const;

export type OverlayId = (typeof OVERLAY_IDS)[number];
type OverlayListener = () => void;

let activeOverlay: OverlayId | null = null;
let returnOverlay: OverlayId | null = null;
const listeners = new Set<OverlayListener>();

export function isOverlayId(id: string): id is OverlayId {
	return OVERLAY_IDS.includes(id as OverlayId);
}

export function getActiveOverlay(): OverlayId | null {
	return activeOverlay;
}

export function subscribeOverlays(listener: OverlayListener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function openOverlay(id: string): void {
	if (!isOverlayId(id) || activeOverlay === id) return;
	returnOverlay =
		activeOverlay === "settings-overlay" && id === "shortcuts-overlay"
			? "settings-overlay"
			: null;
	activeOverlay = id;
	notifyListeners();
}

export function closeOverlay(id: string): void {
	if (activeOverlay !== id) return;
	activeOverlay = returnOverlay;
	returnOverlay = null;
	notifyListeners();
}

export function closeAllOverlays(): void {
	if (activeOverlay === null && returnOverlay === null) return;
	activeOverlay = null;
	returnOverlay = null;
	notifyListeners();
}

export function isAnyOverlayOpen(): boolean {
	return activeOverlay !== null;
}

export function isOverlayOpen(id: string): boolean {
	return activeOverlay === id;
}

/** Dismiss transient UI, then open settings when nothing else consumes Escape. */
export function escapeSequence(): boolean {
	if (isAnyOverlayOpen()) {
		closeAllOverlays();
		return true;
	}

	if (typeof document === "undefined") return false;
	const nav = document.querySelector<HTMLElement>(".sidebar-nav.nav-tree");
	if (nav?.hasAttribute("data-focus")) {
		clearNavFocus();
		return true;
	}

	openOverlay("settings-overlay");
	return true;
}

function notifyListeners(): void {
	for (const listener of listeners) listener();
}
