export const shellStyles = `
/* Focus mode: hide items outside scope, collapse focused folder */
.nav-tree li.rr-hidden { display: none; }
.nav-tree li.rr-focus-self > details > summary { display: none; }
.nav-tree li.rr-focus-self > details > ul { padding-left: 0; }
.nav-tree li.rr-focus-self { padding-left: 0; }

/* Search-reorder visual states */
.nav-tree .rr-match { color: var(--color-text); }
.nav-tree .rr-match-strong { color: var(--color-link); font-weight: 600; }
.nav-tree .rr-dim { opacity: 0.45; }
.nav-tree mark {
  background: var(--color-highlight-bg);
  color: inherit;
}

/* ── Current-page search state colours ── */
.page-search-highlight {
  background: rgba(255, 200, 0, 0.32);
  color: inherit;
  padding: 0;
}

.page-search-highlight--active {
  background: rgba(255, 200, 0, 0.72);
}

`;
