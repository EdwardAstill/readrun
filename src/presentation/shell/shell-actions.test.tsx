import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ReadrunShell } from "./ReadrunShell.tsx";

test("renders centered navigation dialogs and client dialog islands", () => {
	const html = renderToStaticMarkup(
		<ReadrunShell
			navigation={{ mode: "tree", source: "filesystem", tree: [] }}
			page={{ url: "/", relPath: "README.md", title: "Home", kind: "markdown" }}
			searchEnabled
			settingsEnabled
			mainContent={<main id="main-content">Content</main>}
		/>,
	);

	expect(html).not.toContain('data-slot="sidebar"');
	expect(html).not.toContain('data-island="resizable-shell"');
	for (const id of ["files", "outline", "resources"]) {
		expect(html).toContain(`data-open-overlay="${id}-overlay"`);
		expect(html).toContain(`<dialog id="${id}-overlay"`);
		expect(html).toContain(`aria-labelledby="${id}-overlay-title"`);
	}
	expect(html).toContain("No headings on this page");
	expect(html).toContain("No resources found");
	expect(html).toContain('data-island="shell-dialogs"');
	expect(html).toContain("<svg");
	expect(html).not.toContain("🔍");
	expect(html).not.toContain("☰");
});

test("keeps the article and dialogs in independent scroll regions", () => {
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

	expect(html.match(/data-navigation-dialog="true"/g)).toHaveLength(3);
	expect(html).toContain("max-h-[80svh]");
	expect(html).not.toContain('data-slot="sidebar-footer"');
	expect(html).toContain("h-svh min-h-0 overflow-hidden readrun-shell");
	expect(html).toContain(
		"readrun-content flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4",
	);
});
