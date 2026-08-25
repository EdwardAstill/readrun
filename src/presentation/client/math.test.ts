import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";

import { installHappyDom } from "../../test/happy-dom.ts";
import { renderMarkdownFragment } from "../markdown/markdownEngine.ts";
import { renderPageMath } from "./math.ts";

let restoreDom: (() => void) | undefined;

beforeAll(() => {
	restoreDom = installHappyDom();
});

afterEach(() => {
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("renderPageMath renders dollar math while leaving code untouched", () => {
	document.body.innerHTML =
		'<main><p>$x^2$</p><pre><code>$y$</code></pre></main>';

	renderPageMath(document.body);

	expect(document.querySelector("p .katex")).not.toBeNull();
	expect(document.querySelector("code")?.textContent).toBe("$y$");
});

test("renderPageMath leaves escaped currency as text", () => {
	document.body.innerHTML = renderMarkdownFragment(
		String.raw`Prices are \$5 and \$10.`,
		{
			toc: [],
			collectHeadings: false,
			headingIds: new Set(),
			wikilinks: [],
		},
		{ mode: "block" },
	);

	renderPageMath(document.body);

	expect(document.querySelector(".katex")).toBeNull();
	expect(document.body.textContent).toBe("Prices are $5 and $10.\n");
});
