import {
	themeCatalog,
	themeNames,
	type HljsColors,
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

const highlightRule = (
	name: ThemeName,
	selectors: string,
	declarations: string,
): string => {
	const prefix = name === "light" ? "" : `[data-theme="${name}"] `;
	return selectors
		.split(", ")
		.map((selector) => `${prefix}${selector}`)
		.join(", ")
		.concat(` { ${declarations} }`);
};

const highlightThemeRules = (name: ThemeName, colors: HljsColors): string =>
	[
		highlightRule(
			name,
			".hljs-comment, .hljs-quote",
			`color: ${colors.comment};`,
		),
		highlightRule(
			name,
			".hljs-keyword, .hljs-selector-tag, .hljs-type",
			`color: ${colors.keyword};`,
		),
		highlightRule(
			name,
			".hljs-string, .hljs-addition",
			`color: ${colors.string};`,
		),
		highlightRule(
			name,
			".hljs-number, .hljs-literal",
			`color: ${colors.number};`,
		),
		highlightRule(name, ".hljs-built_in", `color: ${colors.builtIn};`),
		highlightRule(
			name,
			".hljs-title, .hljs-section",
			`color: ${colors.title};`,
		),
		highlightRule(
			name,
			".hljs-attr, .hljs-attribute",
			`color: ${colors.attr};`,
		),
		highlightRule(
			name,
			".hljs-name, .hljs-tag",
			`color: ${colors.name};`,
		),
		highlightRule(
			name,
			".hljs-deletion",
			`color: ${colors.deletion}; background: ${colors.deletionBg};`,
		),
	].join("\n");

const nonDefaultThemeRules = themeNames
	.filter((name) => name !== "light")
	.map(themeRule)
	.join("\n\n");

const syntaxThemeRules = themeNames
	.map((name) => highlightThemeRules(name, themeCatalog[name].syntax))
	.join("\n\n");

export const themeStyles = `
/* ── Themes: generated from the canonical TypeScript palettes ── */
${nonDefaultThemeRules}

/* highlight.js — base colors follow the active semantic theme. */
.hljs { background: var(--rr-code-bg); color: var(--rr-text); }
${syntaxThemeRules}
`;
