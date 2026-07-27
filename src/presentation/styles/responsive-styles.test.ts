import { describe, expect, test } from "bun:test";

import { baseStyles } from "./base.ts";
import { markdownStyles } from "./markdown.ts";
import { mobileStyles } from "./mobile.ts";
import { uiStyles } from "./ui.ts";

describe("responsive shell styles", () => {
	test("lets resource and TOC summary rows span their panels", () => {
		expect(baseStyles).toMatch(
			/\.toc-sidebar__body\s*\{[^}]*padding: var\(--rr-space-sm\) 0;/,
		);
		expect(uiStyles).toMatch(
			/\.resource-browser__list\s*\{[^}]*padding: var\(--rr-space-sm\) 0;/,
		);
	});

	test("makes leaf targets and active branches full-width rows", () => {
		expect(baseStyles).toMatch(/\.nav-tree a\s*\{[^}]*display: flex;/);
		expect(baseStyles).toContain(
			'.sidebar-nav details > summary:has(> a[aria-current="page"])',
		);
		expect(baseStyles).toContain(
			".toc-tree details > summary:has(> .toc-link--active)",
		);
		expect(uiStyles).toContain(
			".resource-browser__item:hover { background: var(--color-border); }",
		);
	});

	test("uses one row-height contract for links and folders", () => {
		expect(baseStyles).toMatch(
			/\.nav-tree :is\(li > a, details > summary\)\s*\{[^}]*min-height: var\(--rr-control-height-compact\);/,
		);
		expect(mobileStyles).toMatch(
			/\.nav-tree :is\(li > a, details > summary\)\s*\{[^}]*min-height: 40px;/,
		);
		expect(mobileStyles).not.toContain("padding: 10px 14px;");
	});

	test("overlays the TOC resize handle instead of reserving a spacer column", () => {
		expect(baseStyles).toContain(
			"grid-template-columns: var(--readrun-toc-width);",
		);
		expect(baseStyles).toContain("width: var(--readrun-toc-width);");
		expect(baseStyles).toContain("justify-self: start;");
		expect(baseStyles).not.toContain(
			"calc(var(--readrun-toc-handle-width) + var(--readrun-toc-width))",
		);
	});

	test("collapses the sidebar grid track in focus mode", () => {
		expect(baseStyles).toMatch(
			/\[data-focus="true"\] \.readrun-shell\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/,
		);
		expect(baseStyles).toMatch(
			/\[data-focus="true"\] \.readrun-content\s*\{[^}]*grid-column: 1;/,
		);
		expect(baseStyles).toContain(
			'[data-focus="true"] #resize-sidebar { display: none !important; }',
		);
	});

	test("keeps the primary sidebar lateral until the mobile breakpoint", () => {
		expect(baseStyles).toContain("@media (max-width: 960px)");
		expect(baseStyles).toContain(
			"grid-template-columns: var(--sidebar-width) minmax(0, 1fr);",
		);
		expect(baseStyles).toContain(".toc-sidebar-slot { display: none; }");
		expect(baseStyles).not.toContain(
			".readrun-sidebar { border-right: 0; border-bottom:",
		);
	});

	test("reserves the fixed mobile topbar exactly once", () => {
		expect(mobileStyles).toContain("--readrun-mobile-topbar-height: 44px;");
		expect(mobileStyles).toContain(
			"padding-top: var(--readrun-mobile-topbar-height);",
		);
		expect(
			mobileStyles.match(
				/padding-top: var\(--readrun-mobile-topbar-height\);/g,
			),
		).toHaveLength(1);
		expect(mobileStyles).not.toContain("padding-top: 56px;");
		expect(mobileStyles).toContain(
			".readrun-shell--with-toc {\n    grid-template-columns: 1fr;",
		);
	});

	test("disables drawer motion when reduced motion is requested", () => {
		expect(mobileStyles).toContain(
			"@media (max-width: 768px) and (prefers-reduced-motion: reduce)",
		);
		expect(mobileStyles).toContain(
			".readrun-sidebar { transition: none; }",
		);
	});
});

describe("markdown style ownership", () => {
	test("keeps legacy markdown selectors out of shell and mobile styles", () => {
		expect(baseStyles).not.toContain(".markdown-body");
		expect(mobileStyles).not.toContain(".markdown-body");
	});

	test("keeps desktop and mobile table rules with readrun-main", () => {
		expect(markdownStyles).toContain(".readrun-main .rr-table-wrap");
		expect(markdownStyles).toContain("@media (max-width: 768px)");
		expect(markdownStyles).toContain(".readrun-main .rr-table td::before");
		expect(markdownStyles).not.toContain(".markdown-body");
	});
});
