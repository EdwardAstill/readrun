import {
	themeCatalog,
	themeNames,
	type ThemeColors,
	type ThemeName,
} from "./tokens.ts";

const themeVariables = (colors: ThemeColors): string => `
  color-scheme: ${colors.colorScheme};
  --rr-bg: ${colors.background};
  --rr-sidebar-bg: ${colors.sidebarBackground};
  --rr-surface: ${colors.surface};
  --rr-border: ${colors.border};
  --rr-text: ${colors.text};
  --rr-muted: ${colors.muted};
  --rr-accent: ${colors.accent};
  --rr-on-accent: ${colors.accentForeground};
  --rr-link: ${colors.link};
  --rr-active-bg: ${colors.activeBackground};
  --rr-code-bg: ${colors.codeBackground};
  --rr-highlight-bg: ${colors.highlightBackground};`;

const themeRule = (name: ThemeName): string =>
	`[data-theme="${name}"] {${themeVariables(themeCatalog[name].colors)}
}`;

const nonDefaultThemeRules = themeNames
	.filter((name) => name !== "light")
	.map(themeRule)
	.join("\n\n");

export const themeStyles = `
/* ── Themes: generated from the canonical TypeScript palettes ── */
${nonDefaultThemeRules}
`;
