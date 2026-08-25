import { expect, test } from "bun:test";

import {
	renderMarkdownFragment,
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

test("renderMarkdownFragment renders native inline Markdown and trusted HTML", () => {
	const env = environment();
	const html = renderMarkdownFragment(
		"**Bold** `code` <mark>raw</mark> and $y$.",
		env,
		{ mode: "inline", collectHeadings: false },
	);

	expect(html).toContain("<strong>Bold</strong>");
	expect(html).toContain("<code>code</code>");
	expect(html).toContain("<mark>raw</mark>");
	expect(html).toContain("$y$");
	expect(html).not.toMatch(/^<p>|<\/p>\n?$/);
});

test("renderMarkdownFragment resolves known wiki links and neutralizes unknown ones", () => {
	const html = renderMarkdownFragment("[[Other|Label]] [[Missing]]", environment(), {
		mode: "inline",
		collectHeadings: false,
	});

	expect(html).toContain('<a href="/other">Label</a>');
	expect(html).toContain("<span>Missing</span>");
	expect(html).not.toContain("x-wikilink");
});

test("renderMarkdownFragment strips local Markdown suffixes before query strings and fragments", () => {
	const html = renderMarkdownFragment(
		"[query](guide.md?x=1#part) [fragment](other.md#part) [remote](https://example.com/file.md)",
		environment(),
		{ mode: "inline", collectHeadings: false },
	);

	expect(html).toContain('href="guide?x=1#part"');
	expect(html).toContain('href="other#part"');
	expect(html).toContain('href="https://example.com/file.md"');
});

test("renderMarkdownFragment collects Bun heading IDs without polluting nested fragment TOCs", () => {
	const env = environment();
	const html = renderMarkdownFragment(
		`# Hello, Bun!

# Hello, Bun!`,
		env,
		{ mode: "block" },
	);

	expect(html).toContain('<h1 id="hello-bun">Hello, Bun!</h1>');
	expect(html).toContain('<h1 id="hello-bun-1">Hello, Bun!</h1>');
	expect(env.toc).toEqual([
		{ id: "hello-bun", label: "Hello, Bun!", level: 1 },
		{ id: "hello-bun-1", label: "Hello, Bun!", level: 1 },
	]);

	const nestedEnv = environment();
	const nested = renderMarkdownFragment("## Internal heading\n\n$$y^2$$", nestedEnv, {
		mode: "block",
		collectHeadings: false,
	});
	expect(nested).toContain("<h2");
	expect(nested).toContain("$$y^2$$");
	expect(nestedEnv.toc).toEqual([]);
});
