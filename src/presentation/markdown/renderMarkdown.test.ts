import { expect, test } from "bun:test";

import type { MarkdownPage } from "../../domain/pages/page.ts";
import { renderMarkdown } from "./renderMarkdown.ts";

function page(body: string): MarkdownPage {
	return {
		kind: "markdown",
		ext: ".md",
		url: "/index",
		filePath: "index.md",
		relPath: "index.md",
		filename: "index.md",
		title: "Index",
		mtimeMs: 0,
		body,
		tags: [],
		outboundLinks: [],
	};
}

test("renderMarkdown renders headings, tables, wikilinks, and TOC", () => {
	const result = renderMarkdown({
		page: page(
			"# Intro\n\nSee [[Other]].\n\n| A | B |\n| - | - |\n| 1 | 2 |\n",
		),
		wikilinks: [
			{
				key: "other",
				raw: "[[Other]]",
				target: "Other",
				status: "resolved",
				page: {
					...page("# Other"),
					url: "/other",
					relPath: "other.md",
					title: "Other",
				},
			},
		],
	});

	expect(result.html).toContain('<h1 id="intro">Intro</h1>');
	expect(result.html).toContain('<a href="/other">Other</a>');
	expect(result.html).toContain('<div class="rr-table-wrap"');
	expect(result.html).toContain('<span class="rr-table-language">table</span>');
	expect(result.html).toContain(
		'data-rr-slider-input="rr-1" data-rr-slider-min="10" data-rr-slider-max="100" data-rr-slider-value="28"',
	);
	expect(result.html).not.toContain('type="range"');
	expect(result.html).toContain(
		'<div class="rr-table-scroll" data-rr-scroll="rr-1" tabindex="0" aria-label="Scrollable table"><table class="rr-table"',
	);
	expect(result.html).toContain(
		'aria-label="Keep first column visible while scrolling" aria-pressed="true">Sticky on</button>',
	);
	expect(result.html).toContain('<table class="rr-table"');
	expect(result.html).toContain("<colgroup>");
	expect(result.html).toContain('data-label="A"');
	expect(result.toc).toEqual([{ id: "intro", label: "Intro", level: 1 }]);
});

test("renderMarkdown keeps inline markup in table cells", () => {
	const result = renderMarkdown({
		page: page(
			"| Symbol | Meaning | Reference |\n| --- | --- | --- |\n| $L$ | `Span length` | [source](https://example.com) |\n",
		),
	});

	expect(result.html).toContain('class="katex"');
	expect(result.html).toContain("<code>Span length</code>");
	expect(result.html).toContain('<a href="https://example.com">source</a>');
});

test("renderMarkdown renders readrun blocks and leaves code fences display-only", () => {
	const result = renderMarkdown({
		page: page(
			"```python\nprint('show')\n```\n\n[python]\nprint('run')\n[/python]\n",
		),
	});

	expect(result.html).toContain("language-python");
	expect(result.html).toContain('data-slot="card"');
	expect(result.html).toContain('data-slot="card-header"');
	expect(result.html).toContain('data-slot="card-content"');
	expect(result.html).toContain("code-panel markdown-code-block");
	expect(result.html).toContain("code-panel block-exec exec-block");
	expect(result.html).not.toContain("code-panel block block-exec");
	expect(result.html.indexOf("exec-run-btn")).toBeGreaterThan(
		result.html.indexOf("block-exec"),
	);
	expect(result.html).toContain("code-copy-btn");
	expect(result.html).toContain("print(&#x27;run&#x27;)");
});

test("renderMarkdown applies collapsed and editable executable attrs", () => {
	const result = renderMarkdown({
		page: page("[jsx=demo.jsx collapsed editable]\n"),
	});

	expect(result.html).toContain("exec-block--collapsed");
	expect(result.html).toContain("exec-editable");
	expect(result.html).toContain('data-language="jsx"');
});

test("renderMarkdown renders inline KaTeX math", () => {
	const result = renderMarkdown({
		page: page("The formula $x^2 + y^2 = z^2$ is Pythagorean."),
	});

	expect(result.html).toContain('class="katex"');
	expect(result.html).toContain("Pythagorean");
});

test("renderMarkdown renders parenthesized inline KaTeX math", () => {
	const result = renderMarkdown({
		page: page(String.raw`The formula \(x^2 + y^2 = z^2\) is Pythagorean.`),
	});

	expect(result.html).toContain('class="katex"');
	expect(result.html).not.toContain(String.raw`\(x^2`);
	expect(result.html).toContain("Pythagorean");
});

test("renderMarkdown renders display KaTeX math", () => {
	const result = renderMarkdown({
		page: page("$$\\int_0^1 x\\,dx = \\frac{1}{2}$$"),
	});

	expect(result.html).toContain('class="katex"');
	expect(result.html).toContain('class="katex-display"');
});

test("renderMarkdown renders bracketed display KaTeX math", () => {
	const result = renderMarkdown({
		page: page(String.raw`\[
\sum_{i=1}^n i = \frac{n(n+1)}{2}
\]`),
	});

	expect(result.html).toContain('class="katex"');
	expect(result.html).toContain('class="katex-display"');
	expect(result.html).not.toContain(String.raw`\[`);
});

test("renderMarkdown leaves LaTeX delimiters inside code untouched", () => {
	const result = renderMarkdown({
		page: page(
			"Inline code: `\\(x + y\\)`.\n\n```latex\n\\[\nx + y\n\\]\n```",
		),
	});

	expect(result.html).not.toContain('class="katex"');
	expect(result.html).toContain(String.raw`\(x + y\)`);
	expect(result.html).toContain(String.raw`\[`);
});

test("renderMarkdown renders mixed math and text", () => {
	const result = renderMarkdown({
		page: page(
			"# Intro\n\nThis is $E = mc^2$ in a paragraph.\n\nAnd display:\n\n$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$\n\nMore text.",
		),
	});

	expect(result.html).toContain('<h1 id="intro">Intro</h1>');
	expect(result.html).toContain('class="katex"');
	expect(result.html).toContain('class="katex-display"');
	expect(result.html).toContain("More text.");
});

test("renderMarkdown places rich quiz islands inline without polluting the TOC", () => {
	const result = renderMarkdown({
		page: page(String.raw`# Before

Introductory prose.

[quiz id=math title="Math check"]
[info]
## Internal heading

Remember \(x + x = 2x\).
[/info]
[question type=single]
Which expression equals \(2x\)?
- [x] \(x + x\)
- [ ] \(x^2\)
[explain]
\[
x + x = 2x
\]
[/explain]
[/question]
[/quiz]

Middle prose.

[quiz id=words]
[question type=freetext]
Type **yes**.
= yes
[/question]
[/quiz]

Closing prose.`),
	});

	expect(result.html.match(/data-island="quiz"/g)?.length).toBe(2);
	expect(result.html).toContain('data-quiz-instance="index-math-1"');
	expect(result.html).toContain('data-quiz-instance="index-words-2"');
	expect(result.html).toContain("Introductory prose.");
	expect(result.html).toContain("Middle prose.");
	expect(result.html).toContain("Closing prose.");
	expect(result.html).toContain("katex");
	expect(result.html).toContain("katex-display");
	expect(result.toc).toEqual([{ id: "before", label: "Before", level: 1 }]);
});

test("renderMarkdown shows a safe fallback for an invalid canonical quiz", () => {
	const result = renderMarkdown({
		page: page(`[quiz]
[question]
Missing type
[/question]
[/quiz]`),
	});

	expect(result.html).toContain('data-quiz-invalid="true"');
	expect(result.html).toContain("requires type=single");
	expect(result.html).not.toContain('data-island="quiz"');
});
