import type { OutboundWikilink } from "../../domain/pages/page.ts";
import type { ResolvedWikilink } from "../../domain/pages/wikilinks.ts";
import { escapeHtml } from "../../shared/html.ts";

export interface MarkdownRenderEnvironment {
	toc: Array<{ id: string; label: string; level: number }>;
	wikilinks: ResolvedWikilink[];
	collectHeadings: boolean;
	headingIds: Set<string>;
}

export interface MarkdownFragmentOptions {
	mode: "inline" | "block";
	collectHeadings?: boolean;
}

const markdownOptions = {
	tables: true,
	strikethrough: true,
	tasklists: true,
	autolinks: { url: true, www: true, email: true },
	headings: { ids: true, autolink: false },
	wikiLinks: true,
} satisfies Bun.markdown.Options;

export function renderMarkdownFragment(
	source: string,
	env: MarkdownRenderEnvironment,
	options: MarkdownFragmentOptions,
): string {
	const collectHeadings = options.collectHeadings ?? env.collectHeadings;
	const math = protectDollarMath(source);
	const rewriter = createMarkdownRewriter(
		env,
		collectHeadings,
		options.mode,
		math,
	);
	const html = rewriter.transform(Bun.markdown.html(math.source, markdownOptions));
	return restoreEscapedMathMarkers(html, math);
}

function createMarkdownRewriter(
	env: MarkdownRenderEnvironment,
	collectHeadings: boolean,
	mode: MarkdownFragmentOptions["mode"],
	math: ProtectedDollarMath,
): HTMLRewriter {
	const rewriter = new HTMLRewriter();

	if (math.values.length > 0) {
		rewriter.on(math.tagName, {
			element(element) {
				const index = Number(element.getAttribute("data-index"));
				const source = math.values[index];
				if (source !== undefined) element.replace(source, { html: false });
			},
		});
	}

	if (math.escapedDollarTag) {
		rewriter.on(math.escapedDollarTag, {
			element(element) {
				element.tagName = "span";
			},
		});
	}

	for (let level = 1; level <= 6; level += 1) {
		let label = "";
		rewriter.on(`h${level}`, {
			element(element) {
				label = "";
				const originalId = element.getAttribute("id") ?? "";
				const id = uniqueHeadingId(originalId, env.headingIds);
				if (id !== originalId) element.setAttribute("id", id);
				element.onEndTag(() => {
					const text = decodeRenderedText(label.trim());
					if (collectHeadings && id && text) {
						env.toc.push({ id, label: text, level });
					}
				});
			},
			text(text) {
				label += text.text;
			},
		});
	}

	rewriter.on("x-wikilink", {
		element(element) {
			const target = element.getAttribute("data-target") ?? "";
			const match = findWikilinkMatch(target, env.wikilinks);
			element.removeAttribute("data-target");
			if (match?.url) {
				element.tagName = "a";
				element.setAttribute("href", match.url);
				return;
			}
			element.tagName = "span";
		},
	});

	rewriter.on("a[href]", {
		element(element) {
			const href = element.getAttribute("href");
			if (!href || !isLocalHref(href)) return;
			element.setAttribute("href", href.replace(/\.md(?=$|[?#])/, ""));
		},
	});

	if (mode === "inline") {
		rewriter.on("p", {
			element(element) {
				element.removeAndKeepContent();
			},
		});
	}

	return rewriter;
}

interface ProtectedDollarMath {
	source: string;
	tagName: string;
	values: string[];
	escapedDollarTag?: string;
}

function protectDollarMath(source: string): ProtectedDollarMath {
	let tagName = "x-readrun-math";
	while (source.includes(`<${tagName}`)) tagName += "-x";
	let escapedDollarTag = "x-readrun-escaped-dollar";
	while (source.includes(`<${escapedDollarTag}`)) escapedDollarTag += "-x";

	const values: string[] = [];
	let hasEscapedDollar = false;
	let protectedSource = "";
	let index = 0;
	while (index < source.length) {
		if (source[index] === "<") {
			const htmlEnd = findHtmlTagEnd(source, index);
			if (htmlEnd !== null) {
				protectedSource += source.slice(index, htmlEnd);
				index = htmlEnd;
				continue;
			}
		}

		if (source[index] === "]" && source[index + 1] === "(") {
			const destinationEnd = findLinkDestinationEnd(source, index);
			if (destinationEnd !== null) {
				protectedSource += source.slice(index, destinationEnd);
				index = destinationEnd;
				continue;
			}
		}

		if (
			source[index] === "\\" &&
			source[index + 1] === "$" &&
			!isEscaped(source, index)
		) {
			protectedSource += `<${escapedDollarTag}>&#36;</${escapedDollarTag}>`;
			hasEscapedDollar = true;
			index += 2;
			continue;
		}

		if (source[index] === "$" && !isEscaped(source, index)) {
			const delimiter = source[index + 1] === "$" ? "$$" : "$";
			const mathEnd = findMathEnd(source, index + delimiter.length, delimiter);
			if (mathEnd >= 0) {
				const end = mathEnd + delimiter.length;
				const value = source.slice(index, end);
				const valueIndex = values.push(value) - 1;
				protectedSource += `<${tagName} data-index="${valueIndex}">${encodeHtmlText(value)}</${tagName}>`;
				index = end;
				continue;
			}
		}

		protectedSource += source[index];
		index += 1;
	}

	return {
		source: protectedSource,
		tagName,
		values,
		escapedDollarTag: hasEscapedDollar ? escapedDollarTag : undefined,
	};
}

function restoreEscapedMathMarkers(
	html: string,
	math: ProtectedDollarMath,
): string {
	for (const [index, value] of math.values.entries()) {
		const marker = `<${math.tagName} data-index="${index}">${encodeHtmlText(value)}</${math.tagName}>`;
		html = html.replaceAll(escapeHtml(marker), escapeHtml(value));
	}
	if (math.escapedDollarTag) {
		const marker = `<${math.escapedDollarTag}>&#36;</${math.escapedDollarTag}>`;
		html = html.replaceAll(escapeHtml(marker), "\\$");
	}
	return html;
}

function findHtmlTagEnd(source: string, start: number): number | null {
	if (source.startsWith("<!--", start)) {
		const end = source.indexOf("-->", start + 4);
		return end >= 0 ? end + 3 : source.length;
	}
	if (!/^<\/?[a-z]|^<![a-z]|^<\?/i.test(source.slice(start))) return null;

	let quote = "";
	for (let index = start + 1; index < source.length; index += 1) {
		const character = source[index]!;
		if (quote) {
			if (character === quote) quote = "";
		} else if (character === '"' || character === "'") {
			quote = character;
		} else if (character === ">") {
			return index + 1;
		}
	}
	return null;
}

function findLinkDestinationEnd(source: string, start: number): number | null {
	let depth = 0;
	for (let index = start + 1; index < source.length; index += 1) {
		if (source[index] === "\\") {
			index += 1;
		} else if (source[index] === "(") {
			depth += 1;
		} else if (source[index] === ")") {
			depth -= 1;
			if (depth === 0) return index + 1;
		}
	}
	return null;
}

function findMathEnd(
	source: string,
	start: number,
	delimiter: "$" | "$$",
): number {
	let braceLevel = 0;
	let index = start;
	while (index < source.length) {
		if (braceLevel <= 0 && source.startsWith(delimiter, index)) return index;
		if (source[index] === "\\") index += 1;
		else if (source[index] === "{") braceLevel += 1;
		else if (source[index] === "}") braceLevel -= 1;
		index += 1;
	}
	return -1;
}

function isEscaped(source: string, index: number): boolean {
	let slashCount = 0;
	while (index > 0 && source[index - 1] === "\\") {
		slashCount += 1;
		index -= 1;
	}
	return slashCount % 2 === 1;
}

function encodeHtmlText(value: string): string {
	return Array.from(value, (character) => `&#${character.codePointAt(0)};`).join("");
}

function uniqueHeadingId(id: string, used: Set<string>): string {
	if (!id || !used.has(id)) {
		if (id) used.add(id);
		return id;
	}

	let base = id;
	let match = /^(.*)-\d+$/.exec(base);
	while (match && used.has(match[1]!)) {
		base = match[1]!;
		match = /^(.*)-\d+$/.exec(base);
	}

	let suffix = 1;
	while (used.has(`${base}-${suffix}`)) suffix += 1;
	const unique = `${base}-${suffix}`;
	used.add(unique);
	return unique;
}

function decodeRenderedText(value: string): string {
	let encoded = "";
	let cursor = 0;
	for (const match of value.matchAll(/&(?:#x[\da-f]+|#\d+|[a-z][a-z\d]+);/gi)) {
		encoded += encodeHtmlText(value.slice(cursor, match.index));
		encoded += match[0];
		cursor = match.index + match[0].length;
	}
	encoded += encodeHtmlText(value.slice(cursor));
	return Bun.markdown.render(encoded, { text: (text) => text });
}

function isLocalHref(href: string): boolean {
	return !/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith("//");
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
