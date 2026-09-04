import type { ReactNode } from "react";
import type { Navigation } from "../domain/navigation/model.ts";
import type { ReadrunRuntimeConfig } from "../shared/runtime-config.ts";

export interface ShellPage {
	url: string;
	relPath: string;
	title: string;
	kind: "markdown" | "jsx" | "pdf";
}

export interface TocItem {
	id: string;
	label: string;
	level: number;
}

export interface PageMetaEntry {
	label: string;
	value: string;
	href?: string;
}

export interface ResourceBrowserEntry {
	id: string;
	label: string;
	href: string;
	kind?: string;
}

export interface ShellRenderData {
	page: ShellPage;
	navigation: Navigation;
	contentHtml: string;
	toc?: TocItem[];
	meta?: PageMetaEntry[];
	siteTitle?: string;
	searchEnabled?: boolean;
	settingsEnabled?: boolean;
	resources?: readonly ResourceBrowserEntry[];
}

export interface DocumentProps {
	shell: ShellRenderData;
	runtime: ReadrunRuntimeConfig;
	bodyClassName?: string;
	head?: ReactNode;
	inlineCss?: string;
	pageData?: Record<string, unknown>;
	basePath?: string;
}
