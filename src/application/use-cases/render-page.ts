import { buildSearchDocuments } from "../../domain/pages/search.ts";
import { resolvePageWikilinks } from "../../domain/pages/wikilinks.ts";
import { findRouteByUrl } from "../../domain/routes/generate.ts";
import type { SiteRoute, TagRoute } from "../../domain/routes/model.ts";
import { escapeHtml } from "../../shared/html.ts";
import { renderMarkdown } from "../../presentation/markdown/renderMarkdown.ts";
import { renderDocument } from "../../presentation/shell/renderDocument.tsx";
import { presentationStyles } from "../../presentation/styles/index.ts";
import type { ResourceBrowserEntry } from "../../presentation/contracts.ts";
import {
	DEFAULT_RUNTIME_CONFIG,
	resolveRuntimeConfig,
	type ReadrunRuntimeConfig,
} from "../../shared/runtime-config.ts";
import type { ContentProjectSnapshot } from "../read-models/project-snapshot.ts";

export interface RenderPageInput {
	snapshot: ContentProjectSnapshot;
	url: string;
	runtimeConfig?: Partial<ReadrunRuntimeConfig>;
}

export interface RenderedPage {
	route: SiteRoute | null;
	status: number;
	title: string;
	contentType: string;
	body: string | Blob | ArrayBuffer;
}

function buildResourceEntries(
	snapshot: ContentProjectSnapshot,
): ResourceBrowserEntry[] {
	return snapshot.assetIndex.assets.map((asset) => ({
		id: asset.relPath,
		label: asset.relPath.replace(/^\.readrun\/assets\//, ""),
		href: asset.publicUrl,
		kind: asset.kind,
	}));
}

function buildDataFileEntries(
	snapshot: ContentProjectSnapshot,
): Array<{ name: string }> {
	return snapshot.assetIndex.assets
		.filter((asset) => asset.kind === "data")
		.map((asset) => ({
			name: asset.relPath.replace(/^\.readrun\/assets\/data\//, ""),
		}));
}

export async function renderPage(
	input: RenderPageInput,
): Promise<RenderedPage> {
	const snapshot = input.snapshot;

	const route = findRouteByUrl(snapshot.routes, input.url);
	if (!route) {
		return textResponse(404, `Route not found: ${input.url}`);
	}

	switch (route.kind) {
		case "search-index":
			return {
				route,
				status: 200,
				title: "Search Index",
				contentType: "application/json; charset=utf-8",
				body: JSON.stringify(
					buildSearchDocuments(snapshot.contentIndex),
					null,
					2,
				),
			};
		case "asset":
			return {
				route,
				status: 200,
				title: route.asset.relPath,
				contentType: "application/octet-stream",
				body: Bun.file(route.asset.filePath),
			};
		case "tag":
			return htmlResponse(
				200,
				`${route.tag.label} | Tags`,
				renderShellDocument({
					snapshot,
					title: route.tag.label,
					url: route.url,
					contentHtml: renderTag(route),
					runtimeOverrides: input.runtimeConfig,
				}),
				route,
			);
		case "system":
			return htmlResponse(
				200,
				route.name,
				renderShellDocument({
					snapshot,
					title: route.name,
					url: route.url,
					contentHtml: `<section><h1>${escapeHtml(route.name)}</h1><p>System route: ${escapeHtml(route.url)}</p></section>`,
					runtimeOverrides: input.runtimeConfig,
				}),
				route,
			);
		case "page": {
			const page = snapshot.contentIndex.byRelPath.get(route.page.relPath);
			if (!page) {
				return textResponse(404, `Page not found for route: ${route.url}`);
			}

			const content =
				page.kind === "markdown"
					? renderMarkdown({
							page,
							wikilinks: resolvePageWikilinks(page, snapshot.contentIndex),
						})
					: {
							html: `<div class="jsx-page" data-jsx-page="${escapeHtml(page.relPath)}"></div><script type="text/plain" data-jsx-source="${escapeHtml(page.relPath)}">${escapeHtml(page.source)}</script>`,
							toc: [],
						};
			const runtime = resolveRuntimeConfig({
				...DEFAULT_RUNTIME_CONFIG,
				...input.runtimeConfig,
			});
			const shellPage = { ...page, url: route.url };
			const resources = buildResourceEntries(snapshot);
			const files = buildDataFileEntries(snapshot);

			return htmlResponse(
				200,
				page.title,
				renderDocument({
					shell: {
						page: shellPage,
						navigation: snapshot.navigation,
						contentHtml: content.html,
						toc: content.toc,
						siteTitle: "Readrun",
						searchEnabled: true,
						settingsEnabled: true,
						meta:
							page.kind === "markdown" && page.tags.length > 0
								? page.tags.map((tag) => ({
										label: "Tag",
										value: tag,
										href: `/tags/${encodeURIComponent(tag.toLowerCase())}/`,
									}))
								: [],
						resources,
					},
					runtime,
					inlineCss: presentationStyles,
					pageData: {
						page: {
							url: shellPage.url,
							relPath: shellPage.relPath,
							title: shellPage.title,
							kind: shellPage.kind,
						},
						resources,
						files,
					},
				}),
				route,
			);
		}
	}
}

interface RenderShellDocumentInput {
	snapshot: ContentProjectSnapshot;
	title: string;
	url: string;
	contentHtml: string;
	runtimeOverrides?: Partial<ReadrunRuntimeConfig>;
}

function renderShellDocument(input: RenderShellDocumentInput): string {
	const runtime = resolveRuntimeConfig({
		...DEFAULT_RUNTIME_CONFIG,
		...input.runtimeOverrides,
	});
	const resources = buildResourceEntries(input.snapshot);
	const files = buildDataFileEntries(input.snapshot);

	return renderDocument({
		shell: {
		page: {
				url: input.url,
				relPath: input.url,
				title: input.title,
				kind: "markdown",
			},
			navigation: input.snapshot.navigation,
			contentHtml: input.contentHtml,
			toc: [],
			siteTitle: "Readrun",
			searchEnabled: true,
			settingsEnabled: true,
			meta: [],
			resources,
		},
		runtime,
		inlineCss: presentationStyles,
		pageData: {
			page: {
				url: input.url,
				relPath: input.url,
				title: input.title,
				kind: "markdown",
			},
			resources,
			files,
		},
	});
}

function renderTag(route: TagRoute): string {
	const items = route.tag.pages
		.map(
			(page) =>
				`<li><a href="${escapeHtml(page.url)}">${escapeHtml(page.title)}</a></li>`,
		)
		.join("");

	return `<section><h1>${escapeHtml(route.tag.label)}</h1><ul>${items}</ul></section>`;
}

function htmlResponse(
	status: number,
	title: string,
	body: string,
	route: SiteRoute,
): RenderedPage {
	return {
		route,
		status,
		title,
		contentType: "text/html; charset=utf-8",
		body,
	};
}

function textResponse(status: number, message: string): RenderedPage {
	return {
		route: null,
		status,
		title: status === 404 ? "Not Found" : "Error",
		contentType: "text/plain; charset=utf-8",
		body: message,
	};
}
