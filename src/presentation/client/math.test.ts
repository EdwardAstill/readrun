import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";

import { installHappyDom } from "../../test/happy-dom.ts";
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
