import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SearchPalette } from "../../components/reusable/SearchPalette.tsx";
import { CodeModalIsland } from "./CodeModalIsland.tsx";
import { ContextMenuIsland } from "./ContextMenuIsland.tsx";
import { LightboxIsland } from "./LightboxIsland.tsx";
import { SettingsIsland } from "./SettingsIsland.tsx";
import { ShortcutsIsland } from "./ShortcutsIsland.tsx";

describe("shell dialogs", () => {
	test("keeps global interaction portals client-only during server rendering", () => {
		expect(renderToStaticMarkup(<CodeModalIsland />)).toBe("");
		expect(renderToStaticMarkup(<ContextMenuIsland />)).toBe("");
		expect(renderToStaticMarkup(<LightboxIsland />)).toBe("");
	});

	test("keeps the settings portal client-only during server rendering", () => {
		const html = renderToStaticMarkup(<SettingsIsland open />);

		expect(html).toBe("");
	});

	test("keeps the shortcuts portal client-only during server rendering", () => {
		const html = renderToStaticMarkup(<ShortcutsIsland open />);

		expect(html).toBe("");
	});

	test("keeps the search palette portal client-only during server rendering", () => {
		const html = renderToStaticMarkup(
			<SearchPalette
				id="test-search"
				open
				value="intro"
				onChange={() => {}}
				onClose={() => {}}
				items={[{ id: "intro", title: "Introduction", href: "/intro" }]}
			/>,
		);

		expect(html).toBe("");
	});
});
