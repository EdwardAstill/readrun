import { expect, test } from "bun:test";
import { installHappyDom } from "../../test/happy-dom.ts";
import { selectedPassage } from "./selection-commands.tsx";

test("selection captures the source path of its own document and preserves multiline text", () => {
	const restore = installHappyDom();
	try {
		document.body.innerHTML = '<aside>Sidebar</aside><main id="main-content"><p>First line\nSecond line</p></main><script id="readrun-files" type="application/json">{"page":{"relPath":"notes/a b.md"}}</script>';
		const range = document.createRange();
		range.selectNodeContents(document.querySelector("p")!);
		document.getSelection()!.addRange(range);
		expect(selectedPassage()).toEqual({ selection: "First line\nSecond line", relPath: "notes/a b.md" });
		document.querySelector("#readrun-files")!.textContent = '{"page":{"relPath":"another.md"}}';
		expect(selectedPassage()?.relPath).toBe("another.md");
	} finally { restore(); }
});

test("selection crossing outside content, empty selection, and missing metadata have no command context", () => {
	const restore = installHappyDom();
	try {
		document.body.innerHTML = '<aside>Sidebar</aside><main id="main-content"><p>Text</p></main>';
		expect(selectedPassage()).toBeNull();
		const range = document.createRange();
		range.setStart(document.querySelector("aside")!.firstChild!, 0);
		range.setEnd(document.querySelector("p")!.firstChild!, 4);
		document.getSelection()!.addRange(range);
		expect(selectedPassage()).toBeNull();
		document.getSelection()!.removeAllRanges();
		range.selectNodeContents(document.querySelector("p")!);
		document.getSelection()!.addRange(range);
		expect(selectedPassage()).toBeNull();
	} finally { restore(); }
});
