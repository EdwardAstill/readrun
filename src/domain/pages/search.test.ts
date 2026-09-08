import { expect, test } from "bun:test";
import { buildContentIndex } from "./content-index.ts";
import { buildSearchDocuments } from "./search.ts";
import { extractOutboundWikilinks } from "./wikilinks.ts";
import type { MarkdownPage } from "./page.ts";

function page(relPath: string, title: string, body = ""): MarkdownPage {
	return { kind: "markdown", ext: ".md", url: `/${relPath.replace(/\.md$/, "")}`, filePath: `/notes/${relPath}`, relPath, filename: relPath, title, body, mtimeMs: 0, tags: [], outboundLinks: extractOutboundWikilinks(body) };
}

test("search indexes resolved outgoing notes once, excluding missing, ambiguous, and code links", () => {
	const source = page("index.md", "Home", "[[notes/target|Alias]] [[notes/target]] [[missing]] [[Same]] `[[code]]`\n```\n[[code]]\n```");
	const { index } = buildContentIndex({}, [source, page("notes/target.md", "Target", "Preview text"), page("a.md", "Same"), page("b.md", "Same"), page("code.md", "Code")]);
	const documents = buildSearchDocuments(index);
	expect(documents.find((document) => document.title === "Home")?.linkedRelPaths).toEqual(["notes/target.md"]);
	expect(documents.find((document) => document.title === "Target")?.text).toBe("Preview text");
});
