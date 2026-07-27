import { rootThemeStyles } from "./theme/index.ts";

export const baseStyles = `
${rootThemeStyles}

/* ── Page navigation filtering state ── */
.sidebar-nav li.rr-page-nav-hidden { display: none; }
.sidebar-nav li.rr-page-nav-match > a,
.sidebar-nav li.rr-page-nav-match > details > summary {
  background: var(--color-active-bg);
}

/* ── TOC filtering and active-heading colours ── */
.toc-tree li.rr-toc-hidden { display: none; }

.toc-tree li.rr-toc-match > a,
.toc-tree li.rr-toc-match > details > summary {
  background: var(--color-active-bg);
}

.toc-link--active {
  color: var(--color-text) !important;
  background: var(--color-active-bg);
}

.toc-tree details > summary:has(> .toc-link--active) {
  background: var(--color-active-bg);
}

.toc-tree details > summary > .toc-link--active {
  background: transparent;
}

`;
