import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { installHappyDom } from "../../../test/happy-dom.ts";
import { clearPageSearchHighlights, highlightPageMatches, navigatePageSearch } from "./in-page.ts";

let restore: () => void;
beforeAll(() => {
	restore = installHappyDom();
	HTMLElement.prototype.scrollIntoView = () => {};
});
afterEach(() => document.body.replaceChildren());
afterAll(() => restore());

test("page search highlights readable content without rewriting scripts or editable controls", () => {
	document.body.innerHTML = `<main id="main-content"><h2>Needle</h2><p>A needle.</p>
		<script>const needle = 1;</script><style>.needle { color: red }</style>
		<textarea>needle</textarea><button>needle</button><div contenteditable="true">needle</div>
		<p hidden>needle</p><p aria-hidden="true">needle</p></main><p>needle outside the page</p>`;
	const state = highlightPageMatches("needle");
	expect(state.marks).toHaveLength(3);
	expect(state.activeIdx).toBe(0);
	navigatePageSearch(-1, state);
	expect(state.activeIdx).toBe(2);
	expect(state.marks[2]!.classList.contains("page-search-highlight--active")).toBe(true);
	expect(document.querySelector("[aria-hidden=true] mark")?.textContent).toBe("needle");
	expect(document.querySelector("[hidden] mark")).toBeNull();
	expect(document.querySelector("script")!.textContent).toBe("const needle = 1;");
	clearPageSearchHighlights();
	expect(document.querySelector("mark")).toBeNull();
	expect(document.querySelector("h2")!.textContent).toBe("Needle");
});

test("literal matching preserves text offsets when Unicode case conversion changes length", () => {
	document.body.innerHTML = '<main id="main-content">İ needle [x] NEEDLE</main>';
	const original = document.querySelector("main")!.textContent;
	const state = highlightPageMatches("needle");
	expect(state.marks.map((mark) => mark.textContent)).toEqual(["needle", "NEEDLE"]);
	expect(document.querySelector("main")!.textContent).toBe(original);
	const literal = highlightPageMatches("[x]");
	expect(literal.marks.map((mark) => mark.textContent)).toEqual(["[x]"]);
	clearPageSearchHighlights();
	expect(document.querySelector("main")!.textContent).toBe(original);
});
