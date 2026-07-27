import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ReadrunShell } from "./ReadrunShell.tsx";

test("renders labelled desktop and mobile shell actions with stable hooks", () => {
	const html = renderToStaticMarkup(
		<ReadrunShell
			navigation={{ mode: "tree", source: "filesystem", tree: [] }}
			page={{ url: "/", relPath: "README.md", title: "Home", kind: "markdown" }}
			searchEnabled
			settingsEnabled
			mainContent={<main id="main-content">Content</main>}
		/>,
	);

	expect(html).toContain('id="mobile-menu-btn"');
	expect(html).toContain('aria-controls="readrun-sidebar"');
	expect(html).toContain('aria-expanded="false"');
	expect(html).toContain('id="desktop-search-btn"');
	expect(html).toContain('id="desktop-settings-btn"');
	expect(html.indexOf('class="sidebar-panel-header"')).toBeLessThan(
		html.indexOf('class="shell-toolbar"'),
	);
	expect(html.indexOf('class="shell-toolbar"')).toBeLessThan(
		html.indexOf('id="page-nav-search"'),
	);
	expect(html).toContain('data-open-overlay="settings-overlay"');
	expect(html).toContain('data-island="shell-dialogs"');
	expect(html).toContain("<svg");
	expect(html).not.toContain("🔍");
	expect(html).not.toContain("☰");
});
