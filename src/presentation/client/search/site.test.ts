import { describe, expect, test } from "bun:test";

import {
	scoreSearchText,
	searchDocuments,
	type SiteSearchDocument,
} from "./site.ts";

describe("scoreSearchText", () => {
	test("scores empty queries as no match", () => {
		expect(scoreSearchText("", "anything")).toEqual({
			score: 0,
			firstHitIndex: -1,
		});
	});

	test("prioritizes prefix, substring, and token matches", () => {
		expect(scoreSearchText("loss", "loss functions").score).toBe(3);
		expect(scoreSearchText("func", "loss functions").score).toBe(2);
		expect(scoreSearchText("loss func", "loss and functions").score).toBe(1);
	});

	test("rejects labels missing a query token", () => {
		expect(scoreSearchText("loss xyz", "loss functions")).toEqual({
			score: 0,
			firstHitIndex: -1,
		});
	});
});

describe("searchDocuments", () => {
	const documents: SiteSearchDocument[] = [
		{
			id: "intro",
			url: "/start/intro/",
			relPath: "start/intro.md",
			title: "Intro",
			tags: ["start"],
			text: "Getting started with readrun.",
		},
		{
			id: "nav",
			url: "/authoring/nav/",
			relPath: "authoring/nav.md",
			title: "Navigation",
			tags: ["authoring"],
			text: "Pinned search and the Cmd K site search palette.",
		},
		{
			id: "python",
			url: "/authoring/code/",
			relPath: "authoring/code.md",
			title: "Code Blocks",
			tags: ["python"],
			text: "Run Python examples in browser or locally.",
		},
	];

	test("returns ranked matches across title, tags, path, and text", () => {
		const results = searchDocuments("python", documents);
		expect(results).toHaveLength(1);
		expect(results[0]!.document.id).toBe("python");
		expect(results[0]!.snippet).toContain("Python examples");
	});

	test("keeps title matches above body-only matches", () => {
		const results = searchDocuments("search", documents);
		expect(results[0]!.document.id).toBe("nav");
	});

	test("requires every query token to match somewhere in the document", () => {
		expect(searchDocuments("python missing", documents)).toHaveLength(0);
	});
});
