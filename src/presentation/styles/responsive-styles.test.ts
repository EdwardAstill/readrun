import { describe, expect, test } from "bun:test";

import { baseStyles } from "./base.ts";
import { markdownStyles } from "./markdown.ts";
import { shellStyles } from "./shell.ts";
import { uiStyles } from "./ui.ts";

describe("shadcn shell style ownership", () => {
	test("leaves sidebar and resize presentation to shadcn components", () => {
		expect(baseStyles).not.toContain(".resize-handle");
		expect(baseStyles).not.toContain("#resize-sidebar");
		expect(baseStyles).not.toContain("grid-template-columns: var(--sidebar-width)");
	});

	test("does not ship a legacy mobile override sheet", async () => {
		const mobileFile = Bun.file(new URL("./mobile.ts", import.meta.url));
		expect(await mobileFile.exists()).toBe(false);
	});

	test("does not reintroduce legacy control styling", () => {
		expect(uiStyles).not.toContain(".settings__switch");
		expect(uiStyles).not.toContain(".settings__select");
		expect(uiStyles).not.toContain(".overlay__close-hint");
	});

	test("hides shell scrollbars without disabling scrolling", () => {
		expect(shellStyles).toContain("scrollbar-width: none");
		expect(shellStyles).toContain("::-webkit-scrollbar");
		expect(shellStyles).not.toContain("overflow: hidden");
	});
});

describe("markdown style ownership", () => {
	test("keeps legacy markdown selectors out of shell styles", () => {
		expect(baseStyles).not.toContain(".markdown-body");
	});

	test("scopes readrun block presentation away from shadcn utilities", () => {
		expect(markdownStyles).not.toContain("\n.block {");
		expect(markdownStyles).not.toContain(".readrun-main .block {");
		expect(markdownStyles).toContain(
			'.readrun-main .block[class*="block-"] {',
		);
	});

	test("lets native Markdown tables scroll without client wrapper markup", () => {
		expect(markdownStyles).toContain(".readrun-main table {");
		expect(markdownStyles).toContain("display: block;");
		expect(markdownStyles).toContain("overflow-x: auto");
		expect(markdownStyles).not.toContain("rr-table-wrap");
		expect(markdownStyles).not.toContain("rr-table-slider");
		expect(markdownStyles).not.toContain("@media (max-width: 768px)");
		expect(markdownStyles).not.toContain(".readrun-main .rr-table td::before");
		expect(markdownStyles).not.toContain(".markdown-body");
	});
});
