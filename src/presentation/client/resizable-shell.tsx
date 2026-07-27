import type React from "react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";

import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../components/ui/Resizable.tsx";
import {
	Sidebar,
	SidebarInset,
	SidebarProvider,
} from "../components/ui/Sidebar.tsx";
import { MobileSidebarTrigger } from "../shell/LeftSidebar.tsx";
import {
	commitSettings,
	loadSettings,
	subscribeSettings,
	type Settings,
} from "./settings.ts";

const SIDEBAR_KEY = "readrun:sidebar-width";
const TOC_KEY = "readrun:toc-width";
const SIDEBAR_DEFAULT = 256;
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 500;
const TOC_DEFAULT = 256;
const TOC_MIN = 150;
const TOC_MAX = 400;
const MOBILE_QUERY = "(max-width: 767px)";
const COMPACT_QUERY = "(max-width: 960px)";

interface ShellNodes {
	sidebarChildren: Node[];
	content: HTMLElement;
	toc: HTMLElement | null;
}

export function mountResizableShell(
	root: ParentNode = document,
): () => void {
	const host = root.querySelector<HTMLElement>("[data-island='resizable-shell']");
	const sidebarContainer = root.querySelector<HTMLElement>("#readrun-sidebar");
	const sidebarRoot = sidebarContainer?.closest<HTMLElement>(
		"[data-slot='sidebar']",
	);
	const sidebarInner = sidebarContainer?.querySelector<HTMLElement>(
		"[data-slot='sidebar-inner']",
	);
	const content = root.querySelector<HTMLElement>(".readrun-content");
	const toc = root.querySelector<HTMLElement>("#toc-sidebar-slot");
	if (!host || !sidebarRoot || !sidebarInner || !content) return () => {};

	const nodes: ShellNodes = {
		sidebarChildren: Array.from(sidebarInner.childNodes),
		content,
		toc,
	};
	for (const node of nodes.sidebarChildren) node.parentNode?.removeChild(node);
	sidebarRoot.remove();
	content.remove();
	toc?.remove();
	host.replaceChildren();
	host.dataset.resizableShellMounted = "true";

	const reactRoot = createRoot(host);
	reactRoot.render(<ResizableShell nodes={nodes} />);

	return () => teardownResizableShell(reactRoot, host, nodes);
}

function ResizableShell(props: { nodes: ShellNodes }): React.JSX.Element {
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const [sidebarOpen, setSidebarOpen] = useState(
		() => settings.showSidebar && !settings.focusMode,
	);
	const [sidebarWidth] = useState(() =>
		readSavedSize(SIDEBAR_KEY, SIDEBAR_DEFAULT, SIDEBAR_MIN, SIDEBAR_MAX),
	);
	const [toc, setToc] = useState<HTMLElement | null>(props.nodes.toc);
	const [isMobile, setIsMobile] = useMediaQuery(MOBILE_QUERY);
	const [isCompact] = useMediaQuery(COMPACT_QUERY);
	const sidebarRef = useRef<PanelImperativeHandle | null>(null);
	const sidebarPanelRef = useRef<HTMLDivElement | null>(null);
	const sidebarWidthRef = useRef(sidebarWidth);
	const tocRef = useRef<PanelImperativeHandle | null>(null);
	const sidebarVisible = settings.showSidebar && !settings.focusMode;
	const tocVisible = Boolean(toc) && !settings.focusMode && !isCompact;

	useEffect(() => subscribeSettings(setSettings), []);

	useEffect(() => {
		setSidebarOpen(sidebarVisible);
	}, [sidebarVisible]);

	useEffect(() => {
		const syncToc = (): void => {
			setToc(document.querySelector<HTMLElement>("#toc-sidebar-slot"));
		};
		document.addEventListener("readrun:remount", syncToc);
		return () => document.removeEventListener("readrun:remount", syncToc);
	}, []);

	useEffect(() => {
		if (isMobile) return;
		syncPanelVisibility(
			sidebarRef.current,
			sidebarOpen,
			sidebarWidthRef.current,
		);
	}, [isMobile, sidebarOpen]);

	useEffect(() => {
		if (isMobile) return;
		if (tocVisible) tocRef.current?.expand();
		else tocRef.current?.collapse();
	}, [isMobile, tocVisible]);

	const handleSidebarOpenChange = useCallback(
		(open: boolean) => {
			setSidebarOpen(open);
			if (!isMobile && open !== settings.showSidebar) {
				commitSettings({ showSidebar: open });
			}
		},
		[isMobile, settings.showSidebar],
	);

	const providerStyle = {
		"--sidebar-width": `${sidebarWidth}px`,
	} as React.CSSProperties;

	if (isMobile) {
		return (
			<SidebarProvider
				open={sidebarOpen}
				onOpenChange={handleSidebarOpenChange}
				style={providerStyle}
			>
				<AppSidebar nodes={props.nodes.sidebarChildren} />
				<MainPane content={props.nodes.content} />
			</SidebarProvider>
		);
	}

	return (
		<SidebarProvider
			open={sidebarOpen}
			onOpenChange={handleSidebarOpenChange}
			style={providerStyle}
		>
			<ResizablePanelGroup orientation="horizontal">
				<ResizablePanel
					id="readrun-sidebar-panel"
					panelRef={sidebarRef}
					defaultSize={sidebarVisible ? sidebarWidth : 0}
					minSize={SIDEBAR_MIN}
					maxSize={SIDEBAR_MAX}
					collapsedSize={0}
					collapsible
					groupResizeBehavior="preserve-pixel-size"
					onResize={(size) => {
						const nextWidth = syncSidebarPanelWidth(
							sidebarPanelRef.current,
							size,
							SIDEBAR_MIN,
						);
						if (nextWidth === null) return;
						sidebarWidthRef.current = nextWidth;
						savePanelSize(SIDEBAR_KEY, size, SIDEBAR_MIN);
					}}
				>
					<div ref={sidebarPanelRef} className="h-full">
						<AppSidebar nodes={props.nodes.sidebarChildren} fillPanel />
					</div>
				</ResizablePanel>
				<ResizableHandle
					disabled={!sidebarOpen}
					hidden={!sidebarOpen}
				/>

				<ResizablePanel id="readrun-content-panel" minSize={320}>
					<MainPane content={props.nodes.content} />
				</ResizablePanel>

				<ResizableHandle disabled={!tocVisible} hidden={!tocVisible} />
				<ResizablePanel
					id="readrun-toc-panel"
					panelRef={tocRef}
					defaultSize={
						tocVisible
							? readSavedSize(TOC_KEY, TOC_DEFAULT, TOC_MIN, TOC_MAX)
							: 0
					}
					minSize={TOC_MIN}
					maxSize={TOC_MAX}
					collapsedSize={0}
					collapsible
					groupResizeBehavior="preserve-pixel-size"
					onResize={(size) => savePanelSize(TOC_KEY, size, TOC_MIN)}
				>
					<DomNodeMount node={toc} tocDock />
				</ResizablePanel>
			</ResizablePanelGroup>
		</SidebarProvider>
	);
}

function AppSidebar(props: {
	nodes: readonly Node[];
	fillPanel?: boolean;
}): React.JSX.Element {
	return (
		<Sidebar
			id="readrun-sidebar"
			collapsible={props.fillPanel ? "none" : undefined}
			className={
				props.fillPanel
					? "readrun-sidebar w-full overflow-hidden rounded-r-xl"
					: "readrun-sidebar"
			}
			aria-label="Site navigation"
		>
			<DomChildrenMount nodes={props.nodes} />
		</Sidebar>
	);
}

function MainPane(props: { content: HTMLElement }): React.JSX.Element {
	return (
		<SidebarInset>
			<MobileSidebarTrigger />
			<DomNodeMount node={props.content} />
		</SidebarInset>
	);
}

function DomChildrenMount(props: {
	nodes: readonly Node[];
}): React.JSX.Element {
	const markerRef = useRef<HTMLSpanElement>(null);
	useLayoutEffect(() => {
		const marker = markerRef.current;
		const parent = marker?.parentNode;
		if (!marker || !parent) return;
		for (const node of props.nodes) parent.insertBefore(node, marker);
	}, [props.nodes]);
	return <span ref={markerRef} hidden data-sidebar-source-marker="true" />;
}

function DomNodeMount(props: {
	node: HTMLElement | null;
	tocDock?: boolean;
}): React.JSX.Element {
	const markerRef = useRef<HTMLSpanElement>(null);
	useLayoutEffect(() => {
		const marker = markerRef.current;
		const parent = marker?.parentNode;
		if (!marker || !parent) return;
		if (props.node && props.node.nextSibling !== marker) {
			parent.insertBefore(props.node, marker);
		}
	}, [props.node]);
	return (
		<span
			ref={markerRef}
			hidden
			data-resizable-toc-slot={props.tocDock ? "true" : undefined}
		/>
	);
}

function useMediaQuery(query: string): [boolean, (value: boolean) => void] {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
	useEffect(() => {
		const media = window.matchMedia(query);
		const sync = (): void => setMatches(media.matches);
		media.addEventListener("change", sync);
		return () => media.removeEventListener("change", sync);
	}, [query]);
	return [matches, setMatches];
}

function readSavedSize(
	key: string,
	fallback: number,
	min: number,
	max: number,
): number {
	try {
		const value = Number(localStorage.getItem(key));
		return Number.isFinite(value) && value > 0
			? Math.max(min, Math.min(max, value))
			: fallback;
	} catch {
		return fallback;
	}
}

function savePanelSize(key: string, size: PanelSize, min: number): void {
	if (size.inPixels < min) return;
	try {
		localStorage.setItem(key, String(Math.round(size.inPixels)));
	} catch {
		// Storage can be unavailable in privacy-restricted contexts.
	}
}

export function syncSidebarPanelWidth(
	panel: { style: Pick<CSSStyleDeclaration, "setProperty"> } | null,
	size: Pick<PanelSize, "inPixels">,
	min: number,
): number | null {
	if (!panel || size.inPixels < min) return null;
	const nextWidth = Math.round(size.inPixels);
	panel.style.setProperty("--sidebar-width", `${nextWidth}px`);
	return nextWidth;
}

export function syncPanelVisibility(
	panel: Pick<PanelImperativeHandle, "expand" | "resize"> | null,
	open: boolean,
	expandedSize?: number,
): void {
	if (!panel) return;
	if (!open) {
		panel.resize(0);
		return;
	}
	if (expandedSize !== undefined) {
		panel.resize(expandedSize);
		return;
	}
	panel.expand();
}

function teardownResizableShell(
	root: Root,
	host: HTMLElement,
	nodes: ShellNodes,
): void {
	for (const node of nodes.sidebarChildren) node.parentNode?.removeChild(node);
	nodes.content.remove();
	nodes.toc?.remove();
	root.unmount();
	host.replaceChildren(...nodes.sidebarChildren, nodes.content);
	if (nodes.toc) host.append(nodes.toc);
	delete host.dataset.resizableShellMounted;
}
