import { expect, test } from "bun:test";

import { bundleClient } from "../../infrastructure/runtime/client-bundle.ts";

test("shadcn owns preflight, base, and utility presentation", async () => {
	const source = await Bun.file(
		new URL("./shadcn.css", import.meta.url),
	).text();
	const legacyBase = await Bun.file(
		new URL("./base.ts", import.meta.url),
	).text();

	expect(source).toContain('@import "tailwindcss"');
	expect(source).toContain('@import "tw-animate-css"');
	expect(source).toContain("@layer base");
	expect(source).toContain("@apply bg-background text-foreground");
	expect(source).toContain("--color-primary: var(--primary)");
	expect(source).not.toContain(".rr-button");
	expect(source).not.toContain(".rr-input");
	expect(legacyBase).not.toContain("*, *::before, *::after");
	expect(legacyBase).not.toContain("a:hover");
	expect(legacyBase).not.toContain("sidebar-panel-action-row");
});

test("the production client bundle includes preflight before shadcn utilities", async () => {
	const bundle = await bundleClient(
		new URL("../client/main.tsx", import.meta.url).pathname,
	);

	expect(bundle.warnings).toEqual([]);
	expect(bundle.style).toContain("@layer base");
	expect(bundle.style).toContain("list-style: none");
	expect(bundle.style).toContain(".p-2");
});

test("production shell follows the shadcn sidebar and resizable composition", async () => {
	const shell = await Bun.file(
		new URL("../shell/ReadrunShell.tsx", import.meta.url),
	).text();
	const sidebar = await Bun.file(
		new URL("../shell/LeftSidebar.tsx", import.meta.url),
	).text();
	const resizable = await Bun.file(
		new URL("../client/resizable-shell.tsx", import.meta.url),
	).text();
	const tree = await Bun.file(
		new URL("../components/reusable/Tree.tsx", import.meta.url),
	).text();

	expect(shell).toContain("<SidebarProvider");
	expect(shell).toContain("<LeftSidebar");
	expect(shell).toContain("<SidebarInset");
	expect(shell).toContain("<MobileSidebarTrigger");
	expect(shell).not.toContain("<header");
	expect(sidebar).toContain("export function MobileSidebarTrigger");
	expect(sidebar).toContain("<SidebarTrigger");
	expect(sidebar).toContain("md:hidden");
	expect(sidebar).not.toContain("SidebarRail");
	expect(resizable).toContain("<ResizablePanelGroup");
	expect(resizable).toContain("<ResizableHandle");
	expect(resizable).toContain("<ResizablePanel");
	expect(resizable).toContain(
		"<AppSidebar nodes={props.nodes.sidebarChildren} fillPanel />",
	);
	expect(resizable).toContain(
		'collapsible={props.fillPanel ? "none" : undefined}',
	);
	expect(
		resizable.match(/className="h-svh min-h-0 overflow-hidden"/g),
	).toHaveLength(2);
	expect(resizable).toContain(
		'<SidebarInset className="h-full min-h-0 overflow-hidden">',
	);
	expect(resizable).toContain(
		'"readrun-sidebar w-full overflow-hidden rounded-r-xl"',
	);
	expect(
		resizable.match(/groupResizeBehavior="preserve-pixel-size"/g),
	).toHaveLength(2);
	expect(resizable).not.toContain('groupResizeBehavior="preserve-relative-size"');
	expect(tree).toContain("<SidebarGroupLabel");
	expect(tree).toContain("<SidebarMenuButton");
	expect(tree).toContain("<details");
});
