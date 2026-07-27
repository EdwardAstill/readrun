import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ReadrunShell } from "./ReadrunShell.tsx";

test("renders mobile shell actions without desktop toolbar buttons", () => {
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
	expect(html).toContain('id="mobile-search-btn"');
	expect(html).toContain('id="mobile-settings-btn"');
	expect(html).toContain('aria-controls="readrun-sidebar"');
	expect(html).toContain('aria-expanded="false"');
	expect(html).not.toContain('id="desktop-search-btn"');
	expect(html).not.toContain('id="desktop-settings-btn"');
	expect(html).not.toContain('class="shell-toolbar"');
	expect(html).toContain('data-open-overlay="settings-overlay"');
	expect(html).toContain('data-island="shell-dialogs"');
	expect(html).toContain("<svg");
	expect(html).not.toContain("🔍");
	expect(html).not.toContain("☰");
});
