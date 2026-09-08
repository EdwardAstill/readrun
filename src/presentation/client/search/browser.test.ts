import { expect, test } from "bun:test";
import { currentSearchDocument, folderSearchItems, wikiSearchItems } from "./browser.ts";
import { indexItems, projectSearch } from "../../components/reusable/search/search.ts";
import type { SiteSearchDocument } from "./site.ts";

const documents: SiteSearchDocument[] = [
	{ url: "/project/", relPath: "index.md", title: "Home", linkedRelPaths: ["research/ecology/field.md", "research/ecology/field.md", "missing.md"] },
	{ url: "/project/field/", relPath: "research/ecology/field.md", title: "Field observations", text: "Swans by the reeds.", linkedRelPaths: ["index.md"] },
	{ url: "/project/unlinked/", relPath: "unlinked.md", title: "Unlinked" },
];

test("nested file search finds collapsed descendants by filename and full path", () => {
	const entries = indexItems(folderSearchItems(documents));
	expect(projectSearch(entries, "", new Set()).visible.map((entry) => entry.item.label)).toEqual(["research", "index.md", "unlinked.md"]);
	const found = projectSearch(entries, "research/ecology/field", new Set());
	expect(found.visible.map((entry) => entry.item.label)).toEqual(["research", "ecology", "field.md"]);
	expect(found.visible.at(-1)?.item.data?.text).toBe("Swans by the reeds.");
});

test("WikiLink search is a flat outgoing list even with folders, cycles, duplicates, and a deployment prefix", () => {
	const current = currentSearchDocument(documents, "/project/index.html");
	expect(current?.title).toBe("Home");
	const items = wikiSearchItems(documents, current);
	expect(items.map((item) => item.label)).toEqual(["Field observations"]);
	expect(items[0]?.children).toBeUndefined();
	expect(items[0]?.data?.url).toBe("/project/field/");
	expect(wikiSearchItems(documents, documents[1]).map((item) => item.label)).toEqual(["Home"]);
	expect(wikiSearchItems(documents, documents[2])).toEqual([]);
});
