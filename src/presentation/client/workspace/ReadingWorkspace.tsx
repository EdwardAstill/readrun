import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createRoot } from "react-dom/client";
import { Columns2, Rows2, PictureInPicture2, PanelTop, FolderOpen } from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { WorkspaceProvider, useWorkspaceState, useWorkspaceStore, type WorkspaceViewProps } from "../../components/workspace/hooks/use-workspace.ts";
import { useWorkspaceDrag } from "../../components/workspace/hooks/use-workspace-drag.ts";
import { WorkspaceTiled } from "../../components/workspace/components/workspace-tiled.tsx";
import { WorkspaceFloating } from "../../components/workspace/components/workspace-floating.tsx";
import { defaultKeymap, eventMatchesCombo, type WorkspaceCommand } from "../../components/workspace/lib/keymap.ts";
import { activeView, createReadingWorkspace, documentUrl, type ReadingWorkspaceController } from "./controller.ts";
import { WORKSPACE_FOCUS, WORKSPACE_KEY, WORKSPACE_OPEN, WORKSPACE_OVERLAY, WORKSPACE_REMOUNT } from "./frame-bridge.ts";
import { closeOverlay, getActiveOverlay, subscribeOverlays } from "../overlay.ts";
import { readRuntimeConfig } from "../runtime-config.ts";

export interface ReadingWorkspaceHandle {
	controller: ReadingWorkspaceController;
	navigate(url: string, reason: "navigation" | "popstate"): Promise<boolean>;
	teardown(): void;
}

export function mountReadingWorkspace(): ReadingWorkspaceHandle | null {
	if (window.self !== window.top) return null;
	const content = document.querySelector<HTMLElement>(".readrun-content");
	if (!content) return null;
	const initialUrl = window.location.pathname + window.location.search + window.location.hash;
	const initialTitle = document.querySelector("#main-content h1")?.textContent ?? document.title;
	const controller = createReadingWorkspace(initialUrl, initialTitle);
	let navigatingHistory = false;
	let disposed = false;
	let navigationVersion = 0;
	let selectedId = activeView(controller.store.getState())?.id;
	const requests = new Set<AbortController>();
	const errors = new EventTarget();
	const runtime = readRuntimeConfig();
	// SSE uses a persistent HTTP connection. Share one stream across every tab
	// so many open files cannot exhaust the browser's per-origin connection pool.
	const live = runtime?.enableLiveReload ? new EventSource(runtime.liveEventsUrl) : null;
	const forwardLive = (event: MessageEvent<string>) => {
		for (const frame of content.querySelectorAll("iframe[data-workspace-view]")) {
			frame.dispatchEvent(new MessageEvent(event.type, { data: event.data }));
		}
	};
	live?.addEventListener("snapshot", forwardLive);
	live?.addEventListener("reload", forwardLive);
	const syncSelection = () => {
		const view = activeView(controller.store.getState());
		if (view?.id !== selectedId) { navigationVersion += 1; selectedId = view?.id; }
		if (!view) return;
		document.title = view.title;
		for (const link of document.querySelectorAll<HTMLAnchorElement>(".sidebar-nav a[href]")) {
			const current = new URL(link.href).pathname.replace(/\/$/, "") === view.type.split(/[?#]/)[0]?.replace(/\/$/, "");
			if (current) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		}
		if (!navigatingHistory && window.location.pathname + window.location.search !== view.type.split("#")[0]) {
			window.history.pushState({}, "", view.type);
		}
	};
	const unsubscribe = controller.store.subscribe(syncSelection);
	let navigationContentVersion = -1;
	const syncLiveNavigation = (event: Event) => {
		const frame = event.target as HTMLIFrameElement;
		const version = (event as CustomEvent<number>).detail;
		if (!frame.matches("iframe[data-workspace-view]")) return;
		const viewId = frame.dataset.workspaceView!;
		const state = controller.store.getState();
		const view = state.views[viewId];
		const title = frame.contentDocument?.querySelector("#main-content h1")?.textContent;
		if (view && title && title !== view.title) {
			controller.store.hydrate({ ...state, views: { ...state.views, [viewId]: { ...view, title } } });
		}
		if (typeof version !== "number" || version <= navigationContentVersion) return;
		const nav = frame.contentDocument?.querySelector(".sidebar-nav");
		if (!nav) return;
		navigationContentVersion = version;
		document.querySelector(".sidebar-nav")?.replaceWith(nav.cloneNode(true));
		syncSelection();
		document.dispatchEvent(new CustomEvent("readrun:remount"));
	};
	content.addEventListener(WORKSPACE_REMOUNT, syncLiveNavigation, true);

	async function navigate(value: string, reason: "navigation" | "popstate", stackId?: string): Promise<boolean> {
		const url = documentUrl(value, window.location.href);
		if (!url || disposed) return false;
		const version = ++navigationVersion;
		const request = new AbortController();
		requests.add(request);
		try {
			const existing = Object.values(controller.store.getState().views).find((view) => view.type.split("#")[0] === url.split("#")[0]);
			let title = existing?.title;
			if (!title) {
				const response = await fetch(url, { signal: request.signal, headers: { Accept: "text/html" } });
				if (!response.ok) throw new Error(`Could not open this file (${response.status}).`);
				const page = new DOMParser().parseFromString(await response.text(), "text/html");
				if (!page.querySelector("#main-content")) throw new Error("This link is not a readrun page.");
				title = page.querySelector("#main-content h1")?.textContent ?? page.title;
			}
			if (disposed || version !== navigationVersion) return true;
			navigatingHistory = reason === "popstate";
			const id = controller.open(url, title, stackId);
			navigatingHistory = false;
			if (url.includes("#")) {
				window.history.replaceState({}, "", url);
				requestAnimationFrame(() => {
					const frame = content!.querySelector<HTMLIFrameElement>(`iframe[data-workspace-view="${CSS.escape(id)}"]`);
					try { frame?.contentDocument?.getElementById(decodeURIComponent(url.slice(url.indexOf("#") + 1)))?.scrollIntoView(); } catch { /* Invalid fragment. */ }
				});
			}
			errors.dispatchEvent(new CustomEvent("error", { detail: "" }));
		} catch (error) {
			if (!disposed && version === navigationVersion) errors.dispatchEvent(new CustomEvent("error", { detail: error instanceof Error ? error.message : "Could not open this file. Try again." }));
		} finally {
			requests.delete(request);
		}
		// A failed file request leaves the current workspace intact.
		return true;
	}

	const openFromFrame = (event: Event) => {
		const frame = event.target as HTMLIFrameElement;
		if (!frame.matches("iframe[data-workspace-view]")) return;
		const value = (event as CustomEvent<{ url: string }>).detail?.url;
		if (typeof value !== "string" || !documentUrl(value, window.location.href)) return;
		event.preventDefault();
		const stackId = Object.values(controller.store.getState().stacks).find((stack) => stack.viewIds.includes(frame.dataset.workspaceView!))?.id;
		void navigate(value, "navigation", stackId);
	};
	// Frame events don't bubble by default, so listen in the capture phase.
	content.addEventListener(WORKSPACE_OPEN, openFromFrame, true);
	const unsubscribeOverlays = subscribeOverlays(() => {
		const overlay = getActiveOverlay();
		if (!overlay || !["outline-overlay", "resources-overlay", "page-search-overlay"].includes(overlay)) return;
		const view = activeView(controller.store.getState());
		const frame = view ? content.querySelector<HTMLIFrameElement>(`iframe[data-workspace-view="${CSS.escape(view.id)}"]`) : null;
		if (frame?.contentDocument) {
			closeOverlay(overlay);
			frame.contentDocument.dispatchEvent(new CustomEvent(WORKSPACE_OVERLAY, { detail: overlay }));
		}
	});
	content.className = "readrun-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";
	const root = createRoot(content);
	root.render(<ReadingWorkspace controller={controller} errors={errors} />);
	return {
		controller,
		navigate,
		teardown() {
			disposed = true;
			live?.close();
			for (const request of requests) request.abort();
			unsubscribe();
			content.removeEventListener(WORKSPACE_OPEN, openFromFrame, true);
			content.removeEventListener(WORKSPACE_REMOUNT, syncLiveNavigation, true);
			unsubscribeOverlays();
			root.unmount();
		},
	};
}

function DocumentSlot({ view }: WorkspaceViewProps) {
	return <div data-document-slot={view.id} className="h-full min-h-0 w-full" />;
}

function ReadingWorkspace({ controller, errors }: { controller: ReadingWorkspaceController; errors: EventTarget }) {
	const [error, setError] = useState("");
	const state = useWorkspaceSnapshot(controller);
	useEffect(() => {
		const listener = (event: Event) => setError((event as CustomEvent<string>).detail);
		errors.addEventListener("error", listener);
		return () => errors.removeEventListener("error", listener);
	}, [errors]);
	const views = Object.fromEntries(Object.values(state.views).map((view) => [view.type, DocumentSlot]));
	return (
		<WorkspaceProvider store={controller.store} views={views}>
			<WorkspaceToolbar controller={controller} />
			{error && <p role="alert" className="px-3 py-2 text-sm text-destructive">{error}</p>}
			<WorkspaceSurface />
		</WorkspaceProvider>
	);
}

function useWorkspaceSnapshot(controller: ReadingWorkspaceController) {
	return useSyncExternalStore(controller.store.subscribe, controller.store.getState, controller.store.getState);
}

function WorkspaceToolbar({ controller }: { controller: ReadingWorkspaceController }) {
	const state = useWorkspaceState();
	const view = activeView(state);
	const floating = Object.values(state.floating).some((surface) => surface.stackId === state.activeStackId);
	return (
		<div aria-label="Workspace tools" className="flex shrink-0 flex-wrap items-center gap-1 border-b px-3 py-1">
			<Button variant="ghost" size="sm" disabled={!view || floating} onClick={() => controller.split("horizontal")}><Columns2 />Split right</Button>
			<Button variant="ghost" size="sm" disabled={!view || floating} onClick={() => controller.split("vertical")}><Rows2 />Split down</Button>
			<Button variant="ghost" size="sm" disabled={!view} onClick={() => controller.store.applyCommand(floating ? "view/dock" : "view/float")}>
				{floating ? <PanelTop /> : <PictureInPicture2 />}{floating ? "Dock" : "Float"}
			</Button>
			<span className="ml-auto text-xs text-muted-foreground">Drag tabs to arrange files</span>
		</div>
	);
}

function WorkspaceSurface() {
	const surface = useRef<HTMLDivElement>(null);
	const store = useWorkspaceStore();
	const state = useWorkspaceState();
	useEffect(() => {
		const key = (event: KeyboardEvent) => runWorkspaceKey(event, store);
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	}, [store]);
	return (
		<div ref={surface} data-reading-workspace className="relative isolate min-h-0 min-w-0 flex-1 overflow-hidden">
			<WorkspaceTiled />
			<WorkspaceFloating />
			<DocumentFrames surface={surface} />
			{Object.keys(state.views).length === 0 && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
				<p className="text-sm text-muted-foreground">No files open</p>
				<Button variant="outline" data-open-overlay="files-overlay"><FolderOpen />Open a file</Button>
			</div>}
		</div>
	);
}

function runWorkspaceKey(event: KeyboardEvent, store: ReadingWorkspaceController["store"]) {
	if (event.defaultPrevented) return false;
	for (const [command, combo] of Object.entries(defaultKeymap)) {
		// Popouts have their own document lifecycle and are not mounted here.
		if (command === "view/popout") continue;
		if ((Array.isArray(combo) ? combo : [combo]).some((binding) => eventMatchesCombo(binding, event))) {
			event.preventDefault();
			store.applyCommand(command as WorkspaceCommand);
			return true;
		}
	}
	return false;
}

/**
 * Frames are siblings with stable keys, never children of the split tree.
 * Moving an iframe in the DOM reloads its browsing context. Instead, position
 * each frame over its current edcn view slot and hide inactive tabs.
 */
function DocumentFrames({ surface }: { surface: RefObject<HTMLDivElement | null> }) {
	const state = useWorkspaceState();
	const drag = useWorkspaceDrag();
	useEffect(() => {
		const root = surface.current;
		if (!root) return;
		const position = () => {
			const slots = [...root.querySelectorAll<HTMLElement>("[data-document-slot]")];
			const bounds = root.getBoundingClientRect();
			for (const host of root.querySelectorAll<HTMLElement>("[data-document-frame-host]")) {
				const id = host.dataset.documentFrameHost;
				const slot = slots.find((element) => element.dataset.documentSlot === id);
				host.hidden = !slot;
				if (!slot) continue;
				const rect = slot.getBoundingClientRect();
				const stackId = slot.closest<HTMLElement>("[data-stack-id]")?.dataset.stackId;
				const floating = Object.values(state.floating).find((entry) => entry.stackId === stackId);
				Object.assign(host.style, {
					left: `${rect.left - bounds.left}px`, top: `${rect.top - bounds.top}px`,
					width: `${rect.width}px`, height: `${rect.height}px`, zIndex: String(floating?.zIndex ?? 0),
					pointerEvents: drag?.drag ? "none" : "auto",
				});
			}
		};
		position();
		const observer = new ResizeObserver(position);
		observer.observe(root);
		for (const slot of root.querySelectorAll("[data-document-slot]")) observer.observe(slot);
		// Base UI mounts its active panel after the initial layout effects.
		const mounts = new MutationObserver(position);
		mounts.observe(root, { childList: true, subtree: true });
		return () => { observer.disconnect(); mounts.disconnect(); };
	}, [state, drag?.drag, surface]);
	return Object.values(state.views).map((view) => <DocumentFrame key={view.id} view={view} active={activeView(state)?.id === view.id} />);
}

function DocumentFrame({ view, active }: WorkspaceViewProps & { active: boolean }) {
	const store = useWorkspaceStore();
	const frame = useRef<HTMLIFrameElement>(null);
	const [failed, setFailed] = useState(false);
	useLayoutEffect(() => {
		const element = frame.current!;
		const focus = () => {
			const state = store.getState();
			const stack = Object.values(state.stacks).find((entry) => entry.viewIds.includes(view.id));
			// Browser/React focus restoration can fire after a tab was hidden.
			// Only a pane's visible document may take workspace focus.
			if (stack?.activeViewId !== view.id) return;
			if (activeView(state)?.id === view.id) return;
			const floating = Object.values(state.floating).find((surface) => state.stacks[surface.stackId]?.viewIds.includes(view.id));
			if (floating) store.dispatch({ type: "floating/focus", surfaceId: floating.id });
			else store.dispatch({ type: "view/activate", viewId: view.id });
		};
		const key = (event: Event) => {
			focus();
			if (runWorkspaceKey((event as CustomEvent<KeyboardEvent>).detail, store)) event.preventDefault();
		};
		element.addEventListener(WORKSPACE_FOCUS, focus);
		element.addEventListener(WORKSPACE_KEY, key);
		return () => {
			element.removeEventListener(WORKSPACE_FOCUS, focus);
			element.removeEventListener(WORKSPACE_KEY, key);
		};
	}, [store, view.id]);
	return (
		<div data-document-frame-host={view.id} className="absolute overflow-hidden rounded-b-md bg-background" hidden>
			<iframe ref={frame} data-workspace-view={view.id} data-workspace-active={active || undefined} src={view.type} title={view.title} className="h-full w-full border-0"
				onLoad={() => setFailed(!frame.current?.contentDocument?.querySelector("#main-content"))} />
			{failed && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background p-4 text-sm">
				<p>Could not load {view.title}.</p>
				<Button variant="outline" onClick={() => frame.current?.contentWindow?.location.reload()}>Retry</Button>
			</div>}
		</div>
	);
}
