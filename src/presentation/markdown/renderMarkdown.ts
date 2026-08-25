import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { assetUrlFromRelPath } from "../../domain/assets/model.ts";
import type { Block, BlockNode } from "../../domain/blocks/model.ts";
import { parseBlockTree } from "../../domain/blocks/parser.ts";
import type { MarkdownPage } from "../../domain/pages/page.ts";
import {
	resolvePageWikilinks,
	type ResolvedWikilink,
} from "../../domain/pages/wikilinks.ts";
import { parseQuiz } from "../../domain/quiz/parser.ts";
import { validateQuiz } from "../../domain/quiz/validation.ts";
import { escapeHtml, joinHtml } from "../../shared/html.ts";
import { buttonVariants } from "../components/ui/Button.tsx";
import { QuizBlock } from "../quiz/QuizBlock.tsx";
import { renderQuizDefinition } from "../quiz/render.ts";
import { CodeBlock } from "./components/CodeBlock.tsx";
import { ExecBlock } from "./components/ExecBlock.tsx";
import { QueryBlock } from "./components/QueryBlock.tsx";
import { ViewerBlock } from "./components/ViewerBlock.tsx";
import {
	renderMarkdownFragment,
	type MarkdownRenderEnvironment,
} from "./markdownEngine.ts";

export interface RenderMarkdownInput {
	page: MarkdownPage;
	wikilinks?: ResolvedWikilink[];
}

export interface RenderMarkdownResult {
	html: string;
	toc: Array<{ id: string; label: string; level: number }>;
	plainText: string;
}

interface PageRenderEnvironment extends MarkdownRenderEnvironment {
	relPath: string;
}

let execBlockCounter = 0;
let quizBlockCounter = 0;

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
	quizBlockCounter = 0;
	const env: PageRenderEnvironment = {
		toc,
		wikilinks,
		collectHeadings: true,
		headingIds: new Set(),
		relPath: input.page.relPath,
	};
	const html = renderNodes(parsed.tree, env, pageSlug);

	return {
		html,
		toc,
		plainText: input.page.body.replace(/\s+/g, " ").trim(),
	};
}

function renderNodes(
	nodes: readonly BlockNode[],
	env: PageRenderEnvironment,
	pageSlug?: string,
): string {
	return joinHtml(
		nodes.map((node) => {
			if (node.type === "block") return renderBlock(node, env, pageSlug);
			return renderMarkdownFragment(node.text, env, { mode: "block" });
		}),
	);
}

function renderBlock(
	block: Block,
	env: PageRenderEnvironment,
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
					collapsed:
						booleanAttr(attrs, "collapsed") || booleanAttr(attrs, "hidden"),
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
		case "quiz": {
			const quizIndex = quizBlockCounter++;
			const parsed = parseQuiz(block, { relPath: env.relPath, quizIndex });
			const diagnostics = [
				...parsed.diagnostics,
				...(parsed.definition ? validateQuiz(parsed.definition) : []),
			];
			const hasErrors = diagnostics.some(
				(diagnostic) => diagnostic.severity === "error",
			);
			const definition =
				parsed.definition && !hasErrors
					? renderQuizDefinition(parsed.definition, {
							instanceId: `${pageSlug ?? "page"}-${parsed.definition.id}-${quizIndex + 1}`,
							richText: {
								block: (source) =>
									renderMarkdownFragment(source, env, {
										mode: "block",
										collectHeadings: false,
									}),
								inline: (source) =>
									renderMarkdownFragment(source, env, {
										mode: "inline",
										collectHeadings: false,
									}),
							},
						})
					: undefined;
			return renderToStaticMarkup(
				React.createElement(QuizBlock, { definition, diagnostics }),
			);
		}
		case "raw":
			return renderToStaticMarkup(
				React.createElement(CodeBlock, { code: block.body, language: "raw" }),
			);
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
	if (["csv", "image", "audio", "video", "file", "pdf"].includes(name)) {
		return name as "csv" | "image" | "audio" | "video" | "file" | "pdf";
	}
	if (name === "stl" || name === "model") return "model";
	return "file";
}

function queryFromAttrs(attrs: Map<string, string | true>): string {
	return [...attrs.entries()]
		.map(([key, value]) => (value === true ? key : `${key}=${value}`))
		.join(" ");
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
