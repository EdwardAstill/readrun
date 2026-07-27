import MarkdownIt from "markdown-it";
import markdownItKatex from "@vscode/markdown-it-katex";
import hljs from "highlight.js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { Block, BlockNode } from "../../domain/blocks/model.ts";
import { parseBlockTree } from "../../domain/blocks/parser.ts";
import { assetUrlFromRelPath } from "../../domain/assets/model.ts";
import type {
	MarkdownPage,
	OutboundWikilink,
} from "../../domain/pages/page.ts";
import {
	resolvePageWikilinks,
	type ResolvedWikilink,
} from "../../domain/pages/wikilinks.ts";
import { parseQuiz } from "../../domain/quiz/parser.ts";
import { escapeHtml, joinHtml } from "../../shared/html.ts";
import { buttonVariants } from "../components/ui/Button.tsx";
import { CodeBlock } from "./components/CodeBlock.tsx";
import { ExecBlock } from "./components/ExecBlock.tsx";
import { QueryBlock } from "./components/QueryBlock.tsx";
import { QuizBlock } from "./components/QuizBlock.tsx";
import { ViewerBlock } from "./components/ViewerBlock.tsx";
import {
	processTableTokens,
	resetReadrunTableCounter,
} from "./table.ts";

export interface RenderMarkdownInput {
	page: MarkdownPage;
	wikilinks?: ResolvedWikilink[];
}

export interface RenderMarkdownResult {
	html: string;
	toc: Array<{ id: string; label: string; level: number }>;
	plainText: string;
}

interface MarkdownEnv {
	toc: RenderMarkdownResult["toc"];
	wikilinks: ResolvedWikilink[];
}

const markdown = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
});

markdown.use(markdownItKatex);

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

// --- Heading enhancement ---

const defaultHeadingOpen =
	markdown.renderer.rules.heading_open ??
	((tokens, index, options, _env, self) =>
		self.renderToken(tokens, index, options));

markdown.renderer.rules.heading_open = (tokens, index, options, env, self) => {
	const token = tokens[index]!;
	const inline = tokens[index + 1];
	const text =
		inline?.children
			?.filter((child) => child.type === "text" || child.type === "code_inline")
			.map((child) => child.content)
			.join("")
			.trim() ?? "";
	const level = Number.parseInt(token.tag.slice(1), 10);
	const toc = (env as MarkdownEnv).toc;
	const id = uniqueHeadingId(slugifyHeading(text), toc);
	token.attrSet("id", id);
	if (text) {
		toc.push({ id, label: text, level });
	}
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

markdown.inline.ruler.before(
	"emphasis",
	"readrun_wikilinks",
	(state, silent) => {
		if (
			state.src.charCodeAt(state.pos) !== 0x5b ||
			state.src.charCodeAt(state.pos + 1) !== 0x5b
		) {
			return false;
		}

		const end = state.src.indexOf("]]", state.pos + 2);
		if (end < 0) {
			return false;
		}

		if (!silent) {
			const raw = state.src.slice(state.pos, end + 2);
			const token = state.push("readrun_wikilink", "", 0);
			token.content = raw;
		}

		state.pos = end + 2;
		return true;
	},
);

markdown.renderer.rules.readrun_wikilink = (tokens, index, _options, env) => {
	const raw = tokens[index]?.content ?? "";
	const inner = raw.slice(2, -2);
	const match = findWikilinkMatch(inner, (env as MarkdownEnv).wikilinks);
	const label = match?.label ?? inner;
	if (!match?.url) {
		return escapeHtml(raw);
	}

	return `<a href="${escapeHtml(match.url)}">${escapeHtml(label)}</a>`;
};

let execBlockCounter = 0;

export function renderMarkdown(
	input: RenderMarkdownInput,
): RenderMarkdownResult {
	const wikilinks =
		input.wikilinks ??
		resolvePageWikilinks(input.page, {
			all: [],
			byExactTarget: new Map(),
			byKey: new Map(),
		});
	const parsed = parseBlockTree(input.page.body);
	const toc: RenderMarkdownResult["toc"] = [];
	const pageSlug = slugifyPageUrl(input.page.url);
	execBlockCounter = 0;
	resetReadrunTableCounter();
	const env: MarkdownEnv = { toc, wikilinks };
	const html = renderNodes(parsed.tree, env, pageSlug);

	return {
		html,
		toc,
		plainText: input.page.body.replace(/\s+/g, " ").trim(),
	};
}

function renderNodes(
	nodes: readonly BlockNode[],
	env: MarkdownEnv,
	pageSlug?: string,
): string {
	return joinHtml(
		nodes.map((node) => {
			if (node.type === "block") {
				return renderBlock(node, env, pageSlug);
			}
			return markdown.render(node.text, env);
		}),
	);
}

function renderBlock(
	block: Block,
	env: MarkdownEnv,
	pageSlug?: string,
): string {
	const attrs = attrsToMap(block.attrs);
	const name = block.name.toLowerCase();

	switch (name) {
		case "run":
		case "exec":
		case "python":
		case "py":
		case "jsx": {
			const execId = `${pageSlug ?? "page"}-exec-${execBlockCounter++}`;
			return renderToStaticMarkup(
				React.createElement(ExecBlock, {
					blockId: execId,
					language: name === "py" ? "python" : name,
					source: block.body || stringAttr(attrs, "src") || "",
					collapsed: booleanAttr(attrs, "collapsed") || booleanAttr(attrs, "hidden"),
					editable: booleanAttr(attrs, "editable"),
				}),
			);
		}
		case "query":
			return renderToStaticMarkup(
				React.createElement(QueryBlock, {
					query: queryFromAttrs(attrs) || block.body,
					source: block.body,
				}),
			);
		case "quiz":
			return renderToStaticMarkup(
				React.createElement(QuizBlock, { quiz: parseQuiz(block) }),
			);
		case "raw":
			return `<pre class="block block-raw"><code>${escapeHtml(block.body)}</code></pre>`;
		case "include":
			return `<p class="block block-include" data-src="${escapeHtml(
				stringAttr(attrs, "src") ?? "",
			)}">${escapeHtml(`[include=${stringAttr(attrs, "src") ?? ""}]`)}</p>`;
		case "viewer":
		case "csv":
		case "image":
		case "audio":
		case "video":
		case "file":
		case "stl":
		case "model":
		case "pdf":
			return renderToStaticMarkup(
				React.createElement(ViewerBlock, {
					kind: viewerKindFromName(name),
					src: assetUrlFromRelPath(
						stringAttr(attrs, "src") ?? stringAttr(attrs, "path") ?? "",
					),
					source: block.body,
					title: stringAttr(attrs, "title"),
				}),
			);
		case "upload": {
			const uploadId = `upload-${Math.random().toString(36).slice(2, 9)}`;
			const label = stringAttr(attrs, "label") ?? "Upload";
			const accept = stringAttr(attrs, "accept");
			const multiple = attrs.has("multiple");
			const uploadButtonClass = escapeHtml(buttonVariants());
			return `<div class="upload-block" data-upload-id="${escapeHtml(uploadId)}">
  <div class="upload-block-header">${escapeHtml(label)}</div>
  <div class="upload-block-body">
    <label class="${uploadButtonClass}">Choose Files
      <input type="file" class="upload-input" data-upload-id="${escapeHtml(uploadId)}"${accept ? ` accept="${escapeHtml(accept)}"` : ""}${multiple ? " multiple" : ""} style="display:none">
    </label>
    <span class="upload-block-status" data-upload-status="${escapeHtml(uploadId)}"></span>
  </div>
  <div class="upload-file-list" data-upload-files="${escapeHtml(uploadId)}"></div>
</div>`;
		}
		default:
			return `<div class="block block-unknown" data-block-name="${escapeHtml(block.name)}">${renderNodes(
				block.children ?? [],
				env,
				pageSlug,
			)}</div>`;
	}
}

function viewerKindFromName(
	name: string,
): "csv" | "image" | "audio" | "video" | "file" | "model" | "pdf" {
	if (
		name === "csv" ||
		name === "image" ||
		name === "audio" ||
		name === "video" ||
		name === "file" ||
		name === "pdf"
	) {
		return name;
	}

	if (name === "stl" || name === "model") {
		return "model";
	}

	return "file";
}

function queryFromAttrs(attrs: Map<string, string | true>): string {
	return [...attrs.entries()]
		.map(([key, value]) => (value === true ? key : `${key}=${value}`))
		.join(" ");
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

function slugifyPageUrl(url: string): string {
	return (
		url
			.toLowerCase()
			.replace(/[^a-z0-9/]+/g, "-")
			.replace(/\/+/g, "-")
			.replace(/^-+|-+$/g, "") || "page"
	);
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
	if (!used.has(base)) {
		return base;
	}

	let index = 2;
	while (used.has(`${base}-${index}`)) {
		index += 1;
	}
	return `${base}-${index}`;
}

function attrsToMap(
	attrs: ReadonlyArray<{ name: string; value: string | true }>,
): Map<string, string | true> {
	return new Map(attrs.map((attr) => [attr.name, attr.value]));
}

function stringAttr(
	attrs: Map<string, string | true>,
	key: string,
): string | undefined {
	const value = attrs.get(key);
	return typeof value === "string" ? value : undefined;
}

function booleanAttr(attrs: Map<string, string | true>, key: string): boolean {
	const value = attrs.get(key);
	return value === true || value === "true";
}
