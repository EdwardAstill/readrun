import type { OutboundWikilink } from "../../domain/pages/page.ts";
import type { ResolvedWikilink } from "../../domain/pages/wikilinks.ts";

export interface MarkdownRenderEnvironment {
	toc: Array<{ id: string; label: string; level: number }>;
	wikilinks: ResolvedWikilink[];
	collectHeadings: boolean;
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
	return rewriter.transform(Bun.markdown.html(math.source, markdownOptions));
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

	if (collectHeadings) {
		for (let level = 1; level <= 6; level += 1) {
			let label = "";
			rewriter.on(`h${level}`, {
				element(element) {
					label = "";
					const id = element.getAttribute("id") ?? "";
					element.onEndTag(() => {
						const text = label.trim();
						if (id && text) env.toc.push({ id, label: text, level });
					});
				},
				text(text) {
					label += text.text;
				},
			});
		}
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
}

function protectDollarMath(source: string): ProtectedDollarMath {
	let tagName = "x-readrun-math";
	while (source.includes(`<${tagName}`)) tagName += "-x";

	const values: string[] = [];
	let protectedSource = "";
	let index = 0;
	while (index < source.length) {
		if (index === 0 || source[index - 1] === "\n") {
			const fenceEnd = findFencedCodeEnd(source, index);
			if (fenceEnd !== null) {
				protectedSource += source.slice(index, fenceEnd);
				index = fenceEnd;
				continue;
			}
		}

		if (source[index] === "`") {
			const codeEnd = findInlineCodeEnd(source, index);
			if (codeEnd !== null) {
				protectedSource += source.slice(index, codeEnd);
				index = codeEnd;
				continue;
			}
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

	return { source: protectedSource, tagName, values };
}

function findFencedCodeEnd(source: string, start: number): number | null {
	const firstLineEnd = lineEnd(source, start);
	const opening = /^ {0,3}(`{3,}|~{3,})/.exec(
		source.slice(start, firstLineEnd),
	);
	if (!opening) return null;

	const marker = opening[1]!;
	let nextLine = firstLineEnd < source.length ? firstLineEnd + 1 : source.length;
	while (nextLine < source.length) {
		const nextLineEnd = lineEnd(source, nextLine);
		const line = source.slice(nextLine, nextLineEnd);
		const trimmed = line.replace(/^ {0,3}/, "");
		const markerLength = countRun(trimmed, 0, marker[0]!);
		if (
			markerLength >= marker.length &&
			trimmed.slice(markerLength).trim().length === 0
		) {
			return nextLineEnd < source.length ? nextLineEnd + 1 : nextLineEnd;
		}
		nextLine = nextLineEnd < source.length ? nextLineEnd + 1 : source.length;
	}

	return source.length;
}

function findInlineCodeEnd(source: string, start: number): number | null {
	const length = countRun(source, start, "`");
	const marker = "`".repeat(length);
	let end = source.indexOf(marker, start + length);
	while (end >= 0) {
		if (source[end - 1] !== "`" && source[end + length] !== "`") {
			return end + length;
		}
		end = source.indexOf(marker, end + length);
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

function lineEnd(source: string, start: number): number {
	const end = source.indexOf("\n", start);
	return end >= 0 ? end : source.length;
}

function countRun(source: string, start: number, character: string): number {
	let end = start;
	while (source[end] === character) end += 1;
	return end - start;
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
