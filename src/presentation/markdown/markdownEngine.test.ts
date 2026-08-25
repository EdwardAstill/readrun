import { expect, test } from "bun:test";

import {
	renderMarkdownFragment,
	type MarkdownRenderEnvironment,
} from "./markdownEngine.ts";

function environment(): MarkdownRenderEnvironment {
	return {
		toc: [],
		collectHeadings: true,
		headingIds: new Set(),
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

test("renderMarkdownFragment preserves dollar math through Markdown parsing", () => {
	const html = renderMarkdownFragment(
		[
			String.raw`Inline $\left\{ x \right\}$, spacing $x\,y$, and $a*b*$.`,
			"",
			"Display:",
			"",
			"$$",
			String.raw`\sum_{i=1}^{n} i`,
			"$$",
			"",
			"Code: `$not*math*$`.",
			"",
			"```text",
			"$also_not*math*$",
			"```",
		].join("\n"),
		environment(),
		{ mode: "block" },
	);

	expect(html).toContain(String.raw`$\left\{ x \right\}$`);
	expect(html).toContain(String.raw`$x\,y$`);
	expect(html).toContain("$a*b*$");
	expect(html).toContain(String.raw`$$
\sum_{i=1}^{n} i
$$`);
	expect(html).toContain("<code>$not*math*$</code>");
	expect(html).toContain('<pre><code class="language-text">$also_not*math*$');
	expect(html).not.toContain("$a<em>b</em>$");
});

test("renderMarkdownFragment keeps math text in heading IDs and TOC labels", () => {
	const env = environment();
	const html = renderMarkdownFragment("# Formula $a*b*$", env, {
		mode: "block",
	});

	expect(html).toContain('<h1 id="formula-ab">Formula $a*b*$</h1>');
	expect(env.toc).toEqual([
		{ id: "formula-ab", label: "Formula $a*b*$", level: 1 },
	]);
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

test("renderMarkdownFragment stores decoded heading text in the TOC", () => {
	const env = environment();
	renderMarkdownFragment("# R&D &copy;", env, { mode: "block" });

	expect(env.toc).toEqual([
		{ id: "rd", label: "R&D ©", level: 1 },
	]);
});
