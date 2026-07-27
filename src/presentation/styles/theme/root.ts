import { themePalette } from "../tokens.ts";
import { fontTokens } from "./tokens.ts";

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
  --rr-destructive: #dc2626;
  --rr-destructive-foreground: #ffffff;
  --rr-success: #2f9e44;
  --rr-warning: #d97706;
}

/* shadcn-compatible semantic aliases stay linked to readrun's live themes. */
:root {
  --background: var(--rr-bg);
  --foreground: var(--rr-text);
  --card: var(--rr-bg);
  --card-foreground: var(--rr-text);
  --popover: var(--rr-bg);
  --popover-foreground: var(--rr-text);
  --primary: var(--rr-accent);
  --primary-foreground: var(--rr-on-accent);
  --secondary: var(--rr-surface);
  --secondary-foreground: var(--rr-text);
  --muted: var(--rr-surface);
  --muted-foreground: var(--rr-muted);
  --accent: var(--rr-active-bg);
  --accent-foreground: var(--rr-text);
  --destructive: var(--rr-destructive);
  --destructive-foreground: var(--rr-destructive-foreground);
  --border: var(--rr-border);
  --input: var(--rr-border);
  --ring: var(--rr-focus);
  --radius: 0.625rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --sidebar: var(--rr-sidebar-bg);
  --sidebar-foreground: var(--rr-text);
  --sidebar-primary: var(--rr-accent);
  --sidebar-primary-foreground: var(--rr-on-accent);
  --sidebar-accent: var(--rr-active-bg);
  --sidebar-accent-foreground: var(--rr-text);
  --sidebar-border: var(--rr-border);
  --sidebar-ring: var(--rr-focus);
}

/* Content color aliases remain linked to the same live theme source. */
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
  --readrun-content-width: 880px;
  --font-body: ${fontTokens.body};
  --font-mono: ${fontTokens.mono};
}
`;
