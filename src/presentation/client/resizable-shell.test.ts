import { expect, test } from "bun:test";

import {
	syncPanelVisibility,
	syncSidebarPanelWidth,
} from "./resizable-shell.tsx";

function panelSpy() {
	const calls: Array<[string, number?]> = [];
	const panel = {
		expand: () => calls.push(["expand"]),
		resize: (size: number | string) =>
			calls.push(["resize", typeof size === "number" ? size : Number(size)]),
	};
	return { calls, panel };
}

test("collapses a resizable panel and restores its previous width", () => {
	const { calls, panel } = panelSpy();

	syncPanelVisibility(panel, false, 286);
	syncPanelVisibility(panel, true, 286);

	expect(calls).toEqual([["resize", 0], ["resize", 286]]);
});

test("expands panels without a remembered pixel width", () => {
	const { calls, panel } = panelSpy();

	syncPanelVisibility(panel, true);

	expect(calls).toEqual([["expand"]]);
});

test("updates the sidebar width without re-rendering during a drag", () => {
	const calls: Array<[string, string]> = [];
	const panel = {
		style: {
			setProperty: (name: string, value: string) => calls.push([name, value]),
		},
	};

	expect(syncSidebarPanelWidth(panel, { inPixels: 319.6 }, 180)).toBe(320);
	expect(calls).toEqual([["--sidebar-width", "320px"]]);
	expect(syncSidebarPanelWidth(panel, { inPixels: 0 }, 180)).toBeNull();
	expect(calls).toHaveLength(1);
});
