import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { installHappyDom } from "../../../test/happy-dom.ts";

let restoreDom: (() => void) | undefined;
let root: Root | undefined;
let islandModule: typeof import("./ShortcutsIsland.tsx");
let shortcutsModule: typeof import("../shortcuts.ts");

beforeAll(async () => {
	restoreDom = installHappyDom("https://readrun.test/shortcuts");
	shortcutsModule = await import("../shortcuts.ts");
	islandModule = await import("./ShortcutsIsland.tsx");
});

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	document.body.replaceChildren();
});

afterAll(() => {
	restoreDom?.();
});

test("shows the display-only command palette shortcut", async () => {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	const Shortcuts = islandModule.ShortcutsIsland;
	await act(async () => root?.render(<Shortcuts open />));
	await nextAnimationFrame();

	expect(shortcutsModule.COMMAND_PALETTE_SHORTCUT).toBe("Ctrl/Cmd+K");
	expect(document.body.textContent).toContain("Command palette");
	expect(document.body.textContent).toContain("Ctrl/Cmd+K");
	expect(document.body.textContent).toContain("Search page");
	expect(document.body.textContent).toContain("Show shortcuts");
});

async function nextAnimationFrame(): Promise<void> {
	await act(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => resolve());
			}),
	);
}
