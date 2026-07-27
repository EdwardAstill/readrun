import { expect, test } from "bun:test";

import { asWikiProjectDocuments } from "./docs-wiki.ts";

test("docs wiki reuses the canonical docs with a wiki entry override", () => {
	const documents = asWikiProjectDocuments({
		contentDir: "/project/docs",
		ignorePatterns: ["drafts/**"],
		navigation: {
			path: ".readrun/navigation.yaml",
			text: "index: welcome.md",
		},
	});

	expect(documents.navigation).toBeUndefined();
	expect(documents.entry).toEqual({
		path: ".readrun/entry.txt",
		text: "welcome.md\n",
	});
	expect(documents.ignorePatterns).toEqual(["drafts/**"]);
});
