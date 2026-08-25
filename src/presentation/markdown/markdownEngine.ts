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
	const rewriter = createMarkdownRewriter(env, collectHeadings, options.mode);
	return rewriter.transform(Bun.markdown.html(source, markdownOptions));
}

function createMarkdownRewriter(
	env: MarkdownRenderEnvironment,
	collectHeadings: boolean,
	mode: MarkdownFragmentOptions["mode"],
): HTMLRewriter {
	const rewriter = new HTMLRewriter();

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
