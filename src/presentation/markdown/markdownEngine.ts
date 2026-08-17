import markdownItKatex from "@vscode/markdown-it-katex";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { OutboundWikilink } from "../../domain/pages/page.ts";
import type { ResolvedWikilink } from "../../domain/pages/wikilinks.ts";
import { escapeHtml } from "../../shared/html.ts";
import { CodeBlock } from "./components/CodeBlock.tsx";
import { markdownItLatexDelimiters } from "./latexDelimiters.ts";
import {
	processTableTokens,
	resetReadrunTableCounter,
} from "./table.ts";

export interface MarkdownRenderEnvironment {
	toc: Array<{ id: string; label: string; level: number }>;
	wikilinks: ResolvedWikilink[];
	collectHeadings: boolean;
}

export interface MarkdownFragmentOptions {
	mode: "inline" | "block";
	collectHeadings?: boolean;
}

const markdown = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
});

markdown.use(markdownItKatex);
markdown.use(markdownItLatexDelimiters);

markdown.renderer.rules.fence = (tokens, index) => {
	const token = tokens[index]!;
	const language = token.info.trim().split(/\s+/)[0] ?? "";
	const highlightedHtml =
		language && hljs.getLanguage(language)
			? hljs.highlight(token.content, { language }).value
			: undefined;

	return renderToStaticMarkup(
		React.createElement(CodeBlock, {
			code: token.content,
			language: language || undefined,
			highlightedHtml,
		}),
	);
};

markdown.core.ruler.push("readrun_tables", (state: any) => {
	processTableTokens(state.tokens, (token: any) =>
		state.md.renderer.renderInline(
			token?.children ?? [],
			state.md.options,
			state.env,
		),
	);
});

const defaultHeadingOpen =
	markdown.renderer.rules.heading_open ??
	((tokens, index, options, _env, self) =>
		self.renderToken(tokens, index, options));

markdown.renderer.rules.heading_open = (tokens, index, options, env, self) => {
	const renderEnvironment = env as MarkdownRenderEnvironment;
	if (!renderEnvironment.collectHeadings) {
		return defaultHeadingOpen(tokens, index, options, env, self);
	}

	const token = tokens[index]!;
	const inline = tokens[index + 1];
	const text =
		inline?.children
			?.filter((child) => child.type === "text" || child.type === "code_inline")
			.map((child) => child.content)
			.join("")
			.trim() ?? "";
	const level = Number.parseInt(token.tag.slice(1), 10);
	const id = uniqueHeadingId(slugifyHeading(text), renderEnvironment.toc);
	token.attrSet("id", id);
	if (text) renderEnvironment.toc.push({ id, label: text, level });
	return defaultHeadingOpen(tokens, index, options, env, self);
};

const defaultLinkOpen =
	markdown.renderer.rules.link_open ??
	((tokens, index, options, _env, self) =>
		self.renderToken(tokens, index, options));

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
	const hrefIndex = tokens[index]!.attrIndex("href");
	if (hrefIndex >= 0) {
		const href = tokens[index]!.attrs?.[hrefIndex]?.[1];
		if (
			href &&
			href.endsWith(".md") &&
			!href.startsWith("http://") &&
			!href.startsWith("https://")
		) {
			tokens[index]!.attrs![hrefIndex]![1] = href.replace(/\.md$/, "");
		}
	}
	return defaultLinkOpen(tokens, index, options, env, self);
};

markdown.inline.ruler.before("emphasis", "readrun_wikilinks", (state, silent) => {
	if (
		state.src.charCodeAt(state.pos) !== 0x5b ||
		state.src.charCodeAt(state.pos + 1) !== 0x5b
	) {
		return false;
	}
	const end = state.src.indexOf("]]", state.pos + 2);
	if (end < 0) return false;
	if (!silent) {
		const token = state.push("readrun_wikilink", "", 0);
		token.content = state.src.slice(state.pos, end + 2);
	}
	state.pos = end + 2;
	return true;
});

markdown.renderer.rules.readrun_wikilink = (tokens, index, _options, env) => {
	const raw = tokens[index]?.content ?? "";
	const inner = raw.slice(2, -2);
	const match = findWikilinkMatch(
		inner,
		(env as MarkdownRenderEnvironment).wikilinks,
	);
	const label = match?.label ?? inner;
	if (!match?.url) return escapeHtml(raw);
	return `<a href="${escapeHtml(match.url)}">${escapeHtml(label)}</a>`;
};

export function renderMarkdownFragment(
	source: string,
	env: MarkdownRenderEnvironment,
	options: MarkdownFragmentOptions,
): string {
	const renderEnvironment: MarkdownRenderEnvironment = {
		...env,
		collectHeadings: options.collectHeadings ?? env.collectHeadings,
	};
	return options.mode === "inline"
		? markdown.renderInline(source, renderEnvironment)
		: markdown.render(source, renderEnvironment);
}

export function resetMarkdownEngineState(): void {
	resetReadrunTableCounter();
}

function findWikilinkMatch(
	rawTarget: string,
	wikilinks: readonly ResolvedWikilink[],
): (Pick<OutboundWikilink, "label"> & { url?: string }) | null {
	const separator = rawTarget.indexOf("|");
	const targetText = separator >= 0 ? rawTarget.slice(0, separator) : rawTarget;
	const explicitLabel =
		separator >= 0 ? rawTarget.slice(separator + 1).trim() : undefined;
	const target = targetText.trim().toLowerCase();
	for (const link of wikilinks) {
		if (
			link.raw.toLowerCase() === `[[${rawTarget.toLowerCase()}]]` ||
			link.target.toLowerCase() === target
		) {
			return {
				label: explicitLabel || link.label || targetText.trim(),
				url: link.page?.url,
			};
		}
	}
	return null;
}

function slugifyHeading(label: string): string {
	return (
		label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "section"
	);
}

function uniqueHeadingId(
	base: string,
	existing: readonly { id: string }[],
): string {
	const used = new Set(existing.map((entry) => entry.id));
	if (!used.has(base)) return base;
	let index = 2;
	while (used.has(`${base}-${index}`)) index += 1;
	return `${base}-${index}`;
}
