import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ReadrunShell } from "./ReadrunShell.tsx";

test("renders the shadcn sidebar shell and client dialog islands", () => {
	const html = renderToStaticMarkup(
		<ReadrunShell
			navigation={{ mode: "tree", source: "filesystem", tree: [] }}
			page={{ url: "/", relPath: "README.md", title: "Home", kind: "markdown" }}
			searchEnabled
			settingsEnabled
			mainContent={<main id="main-content">Content</main>}
		/>,
	);

	expect(html).toContain('data-slot="sidebar-wrapper"');
	expect(html).toContain('data-slot="sidebar"');
	expect(html).toContain('data-slot="sidebar-inset"');
	expect(html).toContain('data-slot="sidebar-trigger"');
	expect(html).toContain("md:hidden");
	expect(html).toContain("<header");
	expect(html).toContain("h-12 shrink-0 items-center border-b");
	expect(html).not.toContain('data-slot="separator"');
	expect(html).not.toContain('data-slot="breadcrumb"');
	expect(html).toContain('data-island="resizable-shell"');
	expect(html).not.toContain('id="mobile-menu-btn"');
	expect(html).not.toContain('id="desktop-search-btn"');
	expect(html).not.toContain('id="desktop-settings-btn"');
	expect(html).not.toContain('class="shell-toolbar"');
	expect(html).toContain('data-island="shell-dialogs"');
	expect(html).toContain("<svg");
	expect(html).not.toContain("🔍");
	expect(html).not.toContain("☰");
});

test("keeps the article and sidebars in independent scroll regions", () => {
	const html = renderToStaticMarkup(
		<ReadrunShell
			navigation={{ mode: "tree", source: "filesystem", tree: [] }}
			page={{ url: "/", relPath: "README.md", title: "Home", kind: "markdown" }}
			mainContent={<main id="main-content">Content</main>}
			tocItems={[{ id: "content", label: "Content", level: 1 }]}
			resources={[
				{
					id: "asset",
					label: "diagram.png",
					href: "/assets/diagram.png",
					kind: "image",
				},
			]}
		/>,
	);

	expect(html.match(/data-slot="sidebar-content"/g)).toHaveLength(2);
	expect(html).not.toContain('data-slot="sidebar-footer"');
	expect(html).toContain("h-svh min-h-0 overflow-hidden readrun-shell");
	expect(html).toContain(
		"readrun-content flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4",
	);
});
