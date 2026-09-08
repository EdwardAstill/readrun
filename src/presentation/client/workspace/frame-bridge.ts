export const WORKSPACE_OPEN = "readrun:workspace-open";
export const WORKSPACE_FOCUS = "readrun:workspace-focus";
export const WORKSPACE_KEY = "readrun:workspace-key";
export const WORKSPACE_OVERLAY = "readrun:workspace-overlay";
export const WORKSPACE_REMOUNT = "readrun:workspace-remount";

export function workspaceFrame(): Element | null {
	try {
		return window.frameElement?.hasAttribute("data-workspace-view") ? window.frameElement : null;
	} catch {
		return null;
	}
}

export function requestWorkspaceDocument(url: string): Promise<boolean> {
	const event = new CustomEvent(WORKSPACE_OPEN, { detail: { url }, cancelable: true });
	workspaceFrame()?.dispatchEvent(event);
	return Promise.resolve(event.defaultPrevented);
}

/** Bridge only our own frames. Other sites can still embed a normal reader. */
export function mountWorkspaceFrameBridge(): () => void {
	const frame = workspaceFrame();
	if (!frame) return () => {};
	document.documentElement.setAttribute("data-workspace-frame", "");
	const focus = () => frame.dispatchEvent(new CustomEvent(WORKSPACE_FOCUS));
	const key = (event: KeyboardEvent) => {
		const forwarded = new CustomEvent(WORKSPACE_KEY, { detail: event, cancelable: true });
		frame.dispatchEvent(forwarded);
		if (forwarded.defaultPrevented) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};
	const overlay = (event: Event) => {
		const id = (event as CustomEvent<string>).detail;
		if (isOverlayId(id)) openOverlay(id);
	};
	const remount = (event: Event) => frame.dispatchEvent(new CustomEvent(WORKSPACE_REMOUNT, {
		detail: (event as CustomEvent<{ contentVersion?: number }>).detail?.contentVersion,
	}));
	document.addEventListener("pointerdown", focus, true);
	document.addEventListener("focusin", focus, true);
	document.addEventListener("keydown", key, true);
	document.addEventListener(WORKSPACE_OVERLAY, overlay);
	document.addEventListener("readrun:remount", remount);
	return () => {
		document.documentElement.removeAttribute("data-workspace-frame");
		document.removeEventListener("pointerdown", focus, true);
		document.removeEventListener("focusin", focus, true);
		document.removeEventListener("keydown", key, true);
		document.removeEventListener(WORKSPACE_OVERLAY, overlay);
		document.removeEventListener("readrun:remount", remount);
	};
}
import { isOverlayId, openOverlay } from "../overlay.ts";
