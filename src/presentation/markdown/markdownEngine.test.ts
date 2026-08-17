import { expect, test } from "bun:test";

import {
	renderMarkdownFragment,
	resetMarkdownEngineState,
	type MarkdownRenderEnvironment,
} from "./markdownEngine.ts";

function environment(): MarkdownRenderEnvironment {
	return {
		toc: [],
		collectHeadings: true,
		wikilinks: [
			{
				key: "other",
				raw: "[[Other]]",
				target: "Other",
				status: "resolved",
				page: {
					kind: "markdown",
					ext: ".md",
					url: "/other",
					filePath: "other.md",
					relPath: "other.md",
					filename: "other.md",
					title: "Other",
					mtimeMs: 0,
					body: "",
					tags: [],
					outboundLinks: [],
				},
			},
		],
	};
}

test("renderMarkdownFragment shares Markdown, links, code, wikilinks, and math", () => {
	resetMarkdownEngineState();
	const env = environment();
	const html = renderMarkdownFragment(
		"**Bold** `code` [[Other]] \\(x+1\\) and $y$.",
		env,
		{ mode: "inline", collectHeadings: false },
	);

	expect(html).toContain("<strong>Bold</strong>");
	expect(html).toContain("<code>code</code>");
	expect(html).toContain('<a href="/other">Other</a>');
	expect(html.match(/class="katex"/g)?.length).toBe(2);
});

test("quiz fragments render display math without adding headings to the page TOC", () => {
	const env = environment();
	const html = renderMarkdownFragment(
		String.raw`## Internal heading

\[
x^2
\]

$$y^2$$`,
		env,
		{ mode: "block", collectHeadings: false },
	);

	expect(html).toContain("<h2>Internal heading</h2>");
	expect(html.match(/class="katex-display"/g)?.length).toBe(2);
	expect(env.toc).toEqual([]);
});
