import { createLiveClient } from "./live.ts";
import { mountPresentationClient } from "./lifecycle.ts";
import { createShellNavigation } from "./navigation.ts";
import { initShortcuts } from "./shortcuts.ts";
import { applySettings, loadSettings } from "./settings.ts";
import { initModelViewers } from "./model-viewer.ts";
import { initUploadBlocks } from "./upload.ts";
import { mountQuizIslands } from "../quiz/mount.tsx";
import { initExecBlocks } from "./execution/python.ts";
import { mountResizableShell } from "./resizable-shell.tsx";
import { initNavCollapse, initNavFocus } from "./nav-focus.ts";
import { initPageNavTreeChrome } from "./page-nav-tree.ts";
import { initResourceBrowserChrome } from "./resource-browser.ts";
import { initTocSidebar } from "./toc.ts";
import { initInteractiveTables } from "./table-interactive.ts";
import { initCsvViewers } from "./csv-viewer.ts";
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
import "../styles/shadcn.css";

const runtime = readRuntimeConfig();

if (typeof document !== "undefined") {
	const lifecycle = mountPresentationClient(clientFeatures());
	void lifecycle;
}

function clientFeatures(): ClientFeature[] {
	return [
		applicationFeature("resizable-shell", mountResizableShell),
		applicationFeature("shell-navigation", () => {
			const navigation = createShellNavigation();
			const live = runtime ? createLiveClient({ runtime, navigation }) : null;
			const handlePopstate = (): void => {
				void navigation.handlePopstate();
			};
			window.addEventListener("popstate", handlePopstate);
			return () => {
				window.removeEventListener("popstate", handlePopstate);
				live?.disconnect();
				navigation.teardown();
			};
		}),
		applicationFeature("settings", () => {
			applySettings(loadSettings());
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
		pageFeature("execution", initExecBlocks),
		pageFeature("jsx", mountPageJsx),
		pageFeature("model-viewers", initModelViewers),
		pageFeature("page-nav-tree", initPageNavTreeChrome),
		pageFeature("resource-browser", initResourceBrowserChrome),
		pageFeature("toc", initTocSidebar),
		pageFeature("interactive-tables", initInteractiveTables),
		pageFeature("csv-viewers", initCsvViewers),
		pageFeature("nav-focus", initNavFocus),
		pageFeature("nav-collapse", initNavCollapse),
	];
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
