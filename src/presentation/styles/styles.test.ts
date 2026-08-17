import { test, expect } from "bun:test";
import { execBlockStyles } from "./exec-blocks";
import { presentationStyles } from "./index";
import { uiStyles } from "./ui";
import { viewerStyles } from "./viewers";

test("execBlockStyles includes key selectors", () => {
	expect(execBlockStyles).toContain(".exec-block");
	expect(execBlockStyles).toContain(".exec-output");
	expect(execBlockStyles).toContain(".exec-editable");
	expect(execBlockStyles).toContain(".upload-block");
	expect(execBlockStyles).toContain(".upload-file-tag");
	expect(execBlockStyles).toContain(".upload-error");
	expect(execBlockStyles).not.toContain(".code-panel {");
	expect(execBlockStyles).not.toContain(".code-panel__header");
	expect(execBlockStyles).not.toContain(".code-panel__actions");
	expect(execBlockStyles).not.toContain(".exec-block-header");
	expect(execBlockStyles).not.toContain(".code-modal__code");
	expect(execBlockStyles).not.toContain(".code-modal__output");
	expect(execBlockStyles).not.toContain(".code-modal__card");
	expect(execBlockStyles).not.toContain(".code-modal__header");
	expect(execBlockStyles).not.toContain(".code-copy-btn");
	expect(execBlockStyles).not.toContain(".exec-run-btn");
});

test("viewerStyles includes key viewer selectors", () => {
	expect(viewerStyles).toContain(".pdf-viewer-wrap");
	expect(viewerStyles).toContain(".pdf-viewer");
	expect(viewerStyles).toContain(".audio-viewer-wrap");
	expect(viewerStyles).toContain(".audio-viewer");
	expect(viewerStyles).toContain(".video-viewer-wrap");
	expect(viewerStyles).toContain(".video-viewer");
	expect(viewerStyles).toContain(".csv-viewer");
	expect(viewerStyles).toContain(".csv-toolbar");
	expect(viewerStyles).toContain(".csv-table-wrap");
	expect(viewerStyles).toContain(".csv-table");
	expect(viewerStyles).toContain(".csv-table th");
	expect(viewerStyles).toContain(".csv-table td");
	expect(viewerStyles).toContain(".csv-pagination");
	expect(viewerStyles).toContain(".model-viewer");
	expect(viewerStyles).toContain(".model-canvas");
	expect(viewerStyles).toContain(".model-error");
	expect(viewerStyles).toContain(".viewer-error");
});

test("legacy CSS does not restyle shadcn controls", () => {
	expect(viewerStyles).not.toContain(".csv-filter");
	for (const selector of [
		".settings__",
		".site-search-palette__",
		".context-menu__",
		".shortcuts-grid",
		".theme-card",
		".sidebar-panel-",
		".overlay__close-hint",
	]) {
		expect(presentationStyles).not.toContain(selector);
	}
});

test("all exports are non-empty strings", () => {
	expect(typeof presentationStyles).toBe("string");
	expect(presentationStyles.length).toBeGreaterThan(0);
	expect(typeof execBlockStyles).toBe("string");
	expect(execBlockStyles.length).toBeGreaterThan(0);
	expect(typeof viewerStyles).toBe("string");
	expect(viewerStyles.length).toBeGreaterThan(0);
});

test("presentation styles do not inline KaTeX font URLs", () => {
	expect(presentationStyles).not.toContain("fonts/KaTeX");
	expect(presentationStyles).not.toContain("font-family:KaTeX_Main");
});
