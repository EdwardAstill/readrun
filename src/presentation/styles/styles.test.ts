import { test, expect } from "bun:test";
import { execBlockStyles } from "./exec-blocks";
import { presentationStyles } from "./index";
import { quizStyles } from "./quiz";
import { uiStyles } from "./ui";
import { viewerStyles } from "./viewers";

test("execBlockStyles includes key selectors", () => {
	expect(execBlockStyles).toContain(".exec-block");
	expect(execBlockStyles).toContain(".code-panel");
	expect(execBlockStyles).toContain(".code-panel__header");
	expect(execBlockStyles).toContain(".code-panel__actions");
	expect(execBlockStyles).toContain(".code-copy-btn");
	expect(execBlockStyles).toContain(".exec-block-header");
	expect(execBlockStyles).toContain(".exec-run-btn");
	expect(execBlockStyles).toContain(".exec-output");
	expect(execBlockStyles).toContain(".exec-editable");
	expect(execBlockStyles).toContain(".exec-toggle-btn");
	expect(execBlockStyles).toContain(".exec-enlarge-btn");
	expect(execBlockStyles).toContain(".upload-block");
	expect(execBlockStyles).toContain(".code-modal");
	expect(execBlockStyles).toContain(".code-modal.open");
	expect(execBlockStyles).toContain(".lightbox");
	expect(execBlockStyles).toContain(".lightbox.open");
	expect(execBlockStyles).toContain(".upload-file-tag");
	expect(execBlockStyles).toContain(".upload-error");
	expect(execBlockStyles).toContain(".code-modal__card");
	expect(execBlockStyles).toContain(".code-modal__header");
	expect(execBlockStyles).toContain(".code-modal__close");
	expect(execBlockStyles).toContain(".code-modal__code");
	expect(execBlockStyles).toContain(".code-modal__output");
});

test("quizStyles includes all quiz component selectors", () => {
	expect(quizStyles).toContain(".quiz");
	expect(quizStyles).toContain(".quiz__header");
	expect(quizStyles).toContain(".quiz__title");
	expect(quizStyles).toContain(".quiz__section");
	expect(quizStyles).toContain(".quiz__progress");
	expect(quizStyles).toContain(".quiz__question");
	expect(quizStyles).toContain(".quiz__question-text");
	expect(quizStyles).toContain(".quiz__options");
	expect(quizStyles).toContain(".quiz__option");
	expect(quizStyles).toContain(".quiz__option--selected");
	expect(quizStyles).toContain(".quiz__option--correct");
	expect(quizStyles).toContain(".quiz__option--wrong");
	expect(quizStyles).toContain(".quiz__option-marker");
	expect(quizStyles).toContain(".quiz__option-check");
	expect(quizStyles).toContain(".quiz__option-text");
	expect(quizStyles).toContain(".quiz__tf-options");
	expect(quizStyles).toContain(".quiz__tf-btn");
	expect(quizStyles).toContain(".quiz__tf-btn--correct");
	expect(quizStyles).toContain(".quiz__tf-btn--wrong");
	expect(quizStyles).toContain(".quiz__freetext");
	expect(quizStyles).toContain(".quiz__freetext-input");
	expect(quizStyles).toContain(".quiz__freetext-answer");
	expect(quizStyles).toContain(".quiz__submit-btn");
	expect(quizStyles).toContain(".quiz__hint");
	expect(quizStyles).toContain(".quiz__hint-btn");
	expect(quizStyles).toContain(".quiz__hint-text");
	expect(quizStyles).toContain(".quiz__feedback");
	expect(quizStyles).toContain(".quiz__feedback-result");
	expect(quizStyles).toContain(".quiz__feedback-result--correct");
	expect(quizStyles).toContain(".quiz__correct-answer");
	expect(quizStyles).toContain(".quiz__explanation");
	expect(quizStyles).toContain(".quiz__nav");
	expect(quizStyles).toContain(".quiz__nav-btn");
	expect(quizStyles).toContain(".quiz__nav-btn--finish");
	expect(quizStyles).toContain(".quiz__group-prompt");
	expect(quizStyles).toContain(".quiz__group-part");
	expect(quizStyles).toContain(".quiz__group-part-label");
	expect(quizStyles).toContain(".quiz__info-label");
	expect(quizStyles).toContain(".quiz__info");
	expect(quizStyles).toContain(".quiz__results-header");
	expect(quizStyles).toContain(".quiz__results-score");
	expect(quizStyles).toContain(".quiz__results-detail");
	expect(quizStyles).toContain(".quiz__results-list");
	expect(quizStyles).toContain(".quiz__result-item");
	expect(quizStyles).toContain(".quiz__result-item--correct");
	expect(quizStyles).toContain(".quiz__result-item--wrong");
	expect(quizStyles).toContain(".quiz__result-marker");
	expect(quizStyles).toContain(".quiz__result-num");
	expect(quizStyles).toContain(".quiz__result-text");
	expect(quizStyles).toContain(".quiz__results-actions");
	// Internal markdown styles within quiz__info
	expect(quizStyles).toContain(".quiz__info p");
	expect(quizStyles).toContain(".quiz__info h2");
	expect(quizStyles).toContain(".quiz__info h3");
	expect(quizStyles).toContain(".quiz__info ul");
	expect(quizStyles).toContain(".quiz__info table");
	expect(quizStyles).toContain(".quiz__info code");
	expect(quizStyles).toContain(".quiz__info pre");
	expect(quizStyles).toContain(".quiz__info blockquote");
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
	expect(viewerStyles).toContain(".csv-filter");
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

test("uiStyles includes local Python settings controls", () => {
	expect(uiStyles).toContain(".settings__switch");
	expect(uiStyles).toContain(".settings__switch--locked");
});

test("shared modal popup does not reposition dialog contents", () => {
	const popupRule = uiStyles.match(/\.rr-modal-popup\s*\{([^}]*)\}/)?.[1];

	expect(popupRule).toBeDefined();
	expect(popupRule).not.toContain("position:");
});

test("all exports are non-empty strings", () => {
	expect(typeof presentationStyles).toBe("string");
	expect(presentationStyles.length).toBeGreaterThan(0);
	expect(typeof execBlockStyles).toBe("string");
	expect(execBlockStyles.length).toBeGreaterThan(0);
	expect(typeof quizStyles).toBe("string");
	expect(quizStyles.length).toBeGreaterThan(0);
	expect(typeof viewerStyles).toBe("string");
	expect(viewerStyles.length).toBeGreaterThan(0);
});

test("presentation styles do not inline KaTeX font URLs", () => {
	expect(presentationStyles).not.toContain("fonts/KaTeX");
	expect(presentationStyles).not.toContain("font-family:KaTeX_Main");
});
