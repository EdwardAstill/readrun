import { expect, test } from "bun:test";
import { resolve } from "node:path";

import { bundleClient } from "../../infrastructure/runtime/client-bundle.ts";

test("the shadcn CLI targets the production Tailwind entrypoint", async () => {
	const projectRoot = resolve(import.meta.dir, "../../..");
	const config = await Bun.file(resolve(projectRoot, "components.json")).json();
	const cssPath = config.tailwind?.css;

	expect(config.style).toBe("base-nova");
	expect(config.iconLibrary).toBe("lucide");
	expect(typeof cssPath).toBe("string");
	const source = await Bun.file(resolve(projectRoot, cssPath)).text();
	expect(source).toContain('@import "tailwindcss"');
	expect(source).toContain('@import "../components/quiz/styles.css"');
});

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
	expect([...bundle.style.matchAll(/@layer properties;/g)]).toHaveLength(1);
	expect(bundle.script).not.toContain("react-dom-client.development");
	expect(bundle.script).not.toContain("react.development");
	expect(bundle.style).toContain("@layer base");
	expect(bundle.style).toMatch(/list-style:\s*none/);
	expect(bundle.style).toContain(".p-2");
	expect(bundle.style).toMatch(
		/\.rounded-xl\s*\{[^}]*border-radius:\s*calc\(var\(--radius\)\s*\+\s*4px\)/,
	);
	expect(bundle.style).toMatch(
		/\.cn-questionnaire,\s*\.cn-questionnaire \*\s*\{[^}]*border-color:/,
	);
	const questionnaireBlocks =
		bundle.style.match(/\.cn-questionnaire\s*\{[^}]*\}/g) ?? [];
	for (const block of questionnaireBlocks) {
		expect(block).not.toMatch(
			/--(?:background|foreground|card|primary|radius)\s*:/,
		);
	}
});


test("navigation dialogs preserve the shadcn radius and tree components", async () => {
	const shell = await Bun.file(
		new URL("../shell/ReadrunShell.tsx", import.meta.url),
	).text();
	const tree = await Bun.file(
		new URL("../components/reusable/Tree.tsx", import.meta.url),
	).text();

	expect(shell).toContain("rounded-xl");
	expect(tree).toContain("<SidebarGroupLabel");
	expect(tree).toContain("<SidebarMenuButton");
	expect(tree).toContain("<details");
});
