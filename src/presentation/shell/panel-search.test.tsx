import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { Navigation, Page } from "../../domain/navigation/model.ts";
import { PageNavPanel } from "./PageNavPanel.tsx";
import { ResourcePanel } from "./ResourcePanel.tsx";
import { TocPanel } from "./TocPanel.tsx";

function page(overrides: Partial<Page> = {}): Page {
	return {
		url: "/intro",
		filePath: "/docs/intro.md",
		relPath: "intro.md",
		title: "Intro",
		filename: "intro.md",
		mtimeMs: 0,
		kind: "markdown",
		ext: ".md",
		tags: [],
		...overrides,
	};
}

describe("sidebar panel search controls", () => {
	test("renders page navigation search and fold controls with stable IDs", () => {
		const navigation: Navigation = {
			mode: "tree",
			source: "filesystem",
			tree: [
				{
					kind: "branch",
					id: "start",
					label: "Start",
					children: [
						{
							kind: "leaf",
							id: "intro",
							label: "Intro",
							page: page(),
						},
					],
				},
			],
		};

		const html = renderToStaticMarkup(
			<PageNavPanel navigation={navigation} currentUrl="/intro" />,
		);

		expect(html).toContain('id="page-nav-search"');
		expect(html).toContain('id="page-nav-fold-all-btn"');
		expect(html).toContain('data-nav-path="/start"');
	});

	test("renders TOC search and fold controls with stable IDs", () => {
		const html = renderToStaticMarkup(
			<TocPanel
				items={[
					{ id: "intro", label: "Intro", level: 1 },
					{ id: "details", label: "Details", level: 2 },
				]}
			/>,
		);

		expect(html).toContain('id="toc-search"');
		expect(html).toContain('id="toc-fold-all-btn"');
		expect(html).toContain('data-toc-heading="intro"');
	});

	test("renders resource browser controls and data hooks", () => {
		const html = renderToStaticMarkup(
			<ResourcePanel
				resources={[
					{
						id: "asset",
						label: "diagram.png",
						href: "/assets/diagram.png",
						kind: "image",
					},
				]}
			/>,
		);

		expect(html).toContain('id="resource-browser-search"');
		expect(html).toContain('id="resource-browser-fold-all-btn"');
		expect(html).toContain('id="resource-browser-count"');
		expect(html).toContain('data-resource-browser-group="image"');
		expect(html).toContain('data-resource-browser-item="true"');
	});
});
