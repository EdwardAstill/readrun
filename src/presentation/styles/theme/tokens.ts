import { themePalette } from "../tokens.ts";

export const colorTokens = {
	background: themePalette.light.background,
	surface: themePalette.light.surface,
	border: themePalette.light.border,
	text: themePalette.light.text,
	muted: themePalette.light.muted,
	accent: themePalette.light.accent,
	link: themePalette.light.link,
	activeBackground: themePalette.light.activeBackground,
	codeBackground: themePalette.light.codeBackground,
	highlightBackground: themePalette.light.highlightBackground,
} as const;

export const fontTokens = {
	body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
	mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

export const spacingTokens = {
	xs: "0.25rem",
	sm: "0.5rem",
	md: "1rem",
	lg: "1.5rem",
	xl: "2rem",
} as const;
