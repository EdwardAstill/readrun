import { createLiveClient } from "./live.ts";
import { mountPresentationClient } from "./lifecycle.ts";
import { createShellNavigation } from "./navigation.ts";
import { initShortcuts } from "./shortcuts.ts";
import { applySettings, loadSettings } from "./settings.ts";
import { initModelViewers } from "./model-viewer.ts";
import { initUploadBlocks } from "./upload.ts";
import { mountQuizIslands } from "../quiz/mount.tsx";
import { initExecBlocks } from "./execution/python.ts";
import { mountNavigationDialogs } from "./navigation-dialogs.ts";
import { initNavCollapse, initNavFocus } from "./nav-focus.ts";
import { initPageNavTreeChrome } from "./page-nav-tree.ts";
import { initResourceBrowserChrome } from "./resource-browser.ts";
import { initTocSidebar } from "./toc.ts";
import { initFlowcharts } from "./flowchart.tsx";
import { initCsvViewers } from "./csv-viewer.ts";
import { renderPageMath } from "./math.ts";
import {
	mountAutoJsxBlocks,
	mountJsxPages,
	teardownJsxMounts,
} from "./execution/jsx.ts";
import {
	mountApplicationShellIslands,
	mountPageShellIslands,
} from "./shell-islands.tsx";
import { readRuntimeConfig } from "./runtime-config.ts";
import type { ClientFeature } from "./features.ts";
import { mountReadingWorkspace, type ReadingWorkspaceHandle } from "./workspace/ReadingWorkspace.tsx";
import { mountWorkspaceFrameBridge, requestWorkspaceDocument, workspaceFrame } from "./workspace/frame-bridge.ts";
import "../styles/shadcn.css";

const runtime = readRuntimeConfig();

if (typeof document !== "undefined") {
	const workspace = mountReadingWorkspace();
	const lifecycle = mountPresentationClient(clientFeatures(workspace));
	void lifecycle;
}

function clientFeatures(workspace: ReadingWorkspaceHandle | null): ClientFeature[] {
	const features = [
		applicationFeature("workspace-frame", mountWorkspaceFrameBridge),
		applicationFeature("navigation-dialogs", mountNavigationDialogs),
		applicationFeature("shell-navigation", () => {
			const navigation = createShellNavigation({
				onNavigate: workspace?.navigate ?? (workspaceFrame() ? requestWorkspaceDocument : undefined),
			});
			const live = runtime && !workspace ? createLiveClient({
				runtime, navigation, eventTarget: workspaceFrame() ?? undefined,
			}) : null;
			const handlePopstate = (): void => {
				void navigation.handlePopstate();
			};
			window.addEventListener("popstate", handlePopstate);
			return () => {
				window.removeEventListener("popstate", handlePopstate);
				live?.disconnect();
				navigation.teardown();
				workspace?.teardown();
			};
		}),
		applicationFeature("settings", () => {
			applySettings(loadSettings());
			const sync = (event: StorageEvent) => {
				if (event.key === "readrun:settings") applySettings(loadSettings());
			};
			window.addEventListener("storage", sync);
			return () => window.removeEventListener("storage", sync);
		}),
		applicationFeature("shell-islands", () => {
			const handle = mountApplicationShellIslands();
			return () => handle.teardown();
		}),
		applicationFeature("shortcuts", initShortcuts),
		applicationFeature("uploads", initUploadBlocks),
		pageFeature("quizzes", mountQuizIslands),
		pageFeature("page-islands", () => {
			const handle = mountPageShellIslands();
			return () => handle.teardown();
		}),
		pageFeature("math", renderPageMath),
		pageFeature("execution", initExecBlocks),
		pageFeature("jsx", mountPageJsx),
		pageFeature("model-viewers", initModelViewers),
		pageFeature("page-nav-tree", initPageNavTreeChrome),
		pageFeature("resource-browser", initResourceBrowserChrome),
		pageFeature("toc", initTocSidebar),
		pageFeature("csv-viewers", initCsvViewers),
		pageFeature("flowcharts", initFlowcharts),
		pageFeature("nav-focus", initNavFocus),
		pageFeature("nav-collapse", initNavCollapse),
	];
	// Each document frame owns its interactive page lifecycle. The host keeps
	// only the shared shell controls and file tree mounted.
	return workspace ? features.filter((feature) => feature.scope === "application" ||
		["page-nav-tree", "nav-focus", "nav-collapse"].includes(feature.name)) : features;
}

function applicationFeature(
	name: string,
	mount: ClientFeature["mount"],
): ClientFeature {
	return { name, scope: "application", mount };
}

function pageFeature(
	name: string,
	mount: ClientFeature["mount"],
): ClientFeature {
	return { name, scope: "page", mount };
}

function mountPageJsx(): () => void {
	const controller = new AbortController();
	void mountJsxPages(document, controller.signal);
	void mountAutoJsxBlocks(document, controller.signal);

	return () => {
		controller.abort();
		teardownJsxMounts();
	};
}
