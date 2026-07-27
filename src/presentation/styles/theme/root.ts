import { themePalette } from "../tokens.ts";
import { fontTokens, spacingTokens } from "./tokens.ts";

const lightTheme = themePalette.light;

export const rootThemeStyles = `
/* ── Theme foundation: color, typography, and spacing variables ── */
:root {
  color-scheme: ${lightTheme.colorScheme};
  --rr-bg: ${lightTheme.background};
  --rr-sidebar-bg: ${lightTheme.sidebarBackground};
  --rr-surface: ${lightTheme.surface};
  --rr-border: ${lightTheme.border};
  --rr-text: ${lightTheme.text};
  --rr-muted: ${lightTheme.muted};
  --rr-accent: ${lightTheme.accent};
  --rr-on-accent: ${lightTheme.accentForeground};
  --rr-link: ${lightTheme.link};
  --rr-active-bg: ${lightTheme.activeBackground};
  --rr-code-bg: ${lightTheme.codeBackground};
  --rr-highlight-bg: ${lightTheme.highlightBackground};
  --rr-focus: var(--rr-link);
  --rr-space-xs: ${spacingTokens.xs};
  --rr-space-sm: ${spacingTokens.sm};
  --rr-space-md: ${spacingTokens.md};
  --rr-space-lg: ${spacingTokens.lg};
  --rr-space-xl: ${spacingTokens.xl};
  --rr-control-height-compact: 28px;
  --rr-control-height-default: 34px;
  --rr-control-radius: 4px;
}

/* Legacy variable names are mapped here so component CSS has one theme source. */
:root {
  --color-bg: var(--rr-bg);
  --color-sidebar-bg: var(--rr-sidebar-bg);
  --color-border: var(--rr-border);
  --color-text: var(--rr-text);
  --color-text-muted: var(--rr-muted);
  --color-link: var(--rr-link);
  --color-active-bg: var(--rr-active-bg);
  --color-code-bg: var(--rr-code-bg);
  --color-highlight-bg: var(--rr-highlight-bg);
  --color-fg: var(--rr-text);
  --color-fg-muted: var(--rr-muted);
  --color-bg-alt: var(--rr-surface);
  --color-surface: var(--rr-surface);
  --sidebar-width: 260px;
  --readrun-content-width: 880px;
  --readrun-content-toc-gap: 1.5rem;
  --readrun-toc-width: 16rem;
  --readrun-toc-handle-width: 4px;
  --font-body: ${fontTokens.body};
  --font-mono: ${fontTokens.mono};
}
`;
