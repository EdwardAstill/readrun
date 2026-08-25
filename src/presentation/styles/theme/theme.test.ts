import { expect, test } from "bun:test";

import { themeStyles } from "../themes.ts";
import { themePalette, type ThemeName } from "../tokens.ts";
import { rootThemeStyles } from "./root.ts";

const themeNames = Object.keys(themePalette) as ThemeName[];

test("root theme exposes canonical color tokens and maps content aliases once", () => {
	expect(rootThemeStyles).toContain("--rr-sidebar-bg:");
	expect(rootThemeStyles).toContain("--rr-on-accent:");
	expect(rootThemeStyles).toContain("--rr-link:");
	expect(rootThemeStyles).not.toContain("--rr-control-height-compact:");
	expect(rootThemeStyles).not.toContain("--rr-space-sm:");
	expect(rootThemeStyles).toContain("--color-bg: var(--rr-bg)");
	expect(rootThemeStyles).toContain(
		"--color-sidebar-bg: var(--rr-sidebar-bg)",
	);
	expect(rootThemeStyles).toContain("--color-link: var(--rr-link)");
	expect(rootThemeStyles.match(/--color-bg:/g)).toHaveLength(1);
});

test("theme CSS is generated from every non-default palette entry", () => {
	for (const name of themeNames.filter((theme) => theme !== "light")) {
		const colors = themePalette[name];
		expect(themeStyles).toContain(`[data-theme="${name}"] {`);
		expect(themeStyles).toContain(`color-scheme: ${colors.colorScheme}`);
		expect(themeStyles).toContain(`--rr-bg: ${colors.background}`);
		expect(themeStyles).toContain(
			`--rr-sidebar-bg: ${colors.sidebarBackground}`,
		);
		expect(themeStyles).toContain(`--rr-accent: ${colors.accent}`);
		expect(themeStyles).toContain(
			`--rr-on-accent: ${colors.accentForeground}`,
		);
		expect(themeStyles).toContain(`--rr-link: ${colors.link}`);
	}

	expect(themeStyles).not.toContain("--color-bg:");
});

test("theme CSS omits server-side syntax highlighter selectors", () => {
	expect(themeStyles).not.toContain(".hljs");
});
