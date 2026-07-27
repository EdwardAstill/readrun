import { expect, test } from "bun:test";
import { THEMES, THEME_LABELS } from "../client/settings.ts";
import { rootThemeStyles } from "./theme/root.ts";
import { themeStyles } from "./themes.ts";
import { themeCatalog, themeNames } from "./tokens.ts";
import { uiStyles } from "./ui.ts";

test("settings exposes theme ids and labels from the canonical catalog", () => {
	expect(THEMES).toEqual(themeNames);
	for (const name of themeNames) {
		expect(THEME_LABELS[name]).toBe(themeCatalog[name].label);
	}
});

test("theme CSS is generated from every catalog entry", () => {
	const light = themeCatalog.light.colors;
	expect(rootThemeStyles).toContain(`--rr-bg: ${light.background};`);
	expect(rootThemeStyles).toContain(`--rr-accent: ${light.accent};`);

	for (const name of themeNames) {
		const { colors, syntax } = themeCatalog[name];

		if (name !== "light") {
			expect(themeStyles).toContain(`[data-theme="${name}"] {`);
			expect(themeStyles).toContain(`--rr-bg: ${colors.background};`);
			expect(themeStyles).toContain(`--rr-accent: ${colors.accent};`);
		}

		expect(themeStyles).toContain(`color: ${syntax.keyword};`);
	}
});

test("theme picker presentation is not generated in static CSS", () => {
	expect(uiStyles).not.toContain("data-theme-choice=");
	expect(themeStyles).not.toContain("theme-card");
});
