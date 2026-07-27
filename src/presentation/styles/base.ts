import { rootThemeStyles } from "./theme/index.ts";

export const baseStyles = `
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

${rootThemeStyles}

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  min-height: 100vh;
}

a { color: var(--color-link); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ── Shell layout ── */
.readrun-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
}

.readrun-shell--with-toc {
  grid-template-columns:
    var(--sidebar-width)
    minmax(0, 1fr)
    max-content;
}

.readrun-sidebar {
  grid-column: 1;
  grid-row: 1;
  padding: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-sidebar-bg);
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: var(--font-mono);
}

.sidebar-panel-header,
.sidebar-header {
  flex: 0 0 auto;
  padding: var(--rr-space-sm);
  border-bottom: 1px solid var(--color-border);
  display: grid;
  gap: var(--rr-space-sm);
}

.sidebar-panel-action-row,
.sidebar-action-row {
  display: flex;
  align-items: stretch;
  gap: var(--rr-space-sm);
  min-width: 0;
}

.sidebar-panel-icon-button,
.sidebar-icon-button {
  width: 28px;
  min-width: 28px;
  height: var(--rr-control-height-compact);
  min-height: var(--rr-control-height-compact);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: 700 11px var(--font-mono);
  line-height: 1;
}

.sidebar-panel-icon-button:hover,
.sidebar-panel-icon-button:focus-visible,
.sidebar-icon-button:hover,
.sidebar-icon-button:focus-visible {
  border-color: var(--color-link);
  color: var(--color-link);
  outline: none;
}

.sidebar-panel-icon-button:disabled,
.sidebar-icon-button:disabled {
  cursor: default;
  opacity: 0.45;
}

.sidebar-panel-search {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font: 12.5px var(--font-body);
}

.sidebar-panel-search__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.sidebar-panel-search--unlabeled {
  grid-template-columns: minmax(0, 1fr);
}

.sidebar-panel-search input {
  min-width: 0;
  width: 100%;
  height: var(--rr-control-height-compact);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  padding: 0 var(--rr-space-sm);
  font: 12.5px var(--font-body);
  outline: none;
}

.sidebar-panel-search input:focus {
  border-color: var(--color-link);
}

.sidebar-panel-count {
  align-self: center;
  color: var(--color-text-muted);
  font: 11px var(--font-mono);
  line-height: 1;
  white-space: nowrap;
}

.sidebar-panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--rr-space-sm);
}

.sidebar-navigation {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--rr-space-sm);
}

.sidebar-footer {
  flex: 0 0 auto;
  min-height: 0;
  border-top: 1px solid var(--color-border);
}

.readrun-content {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

#resize-sidebar {
  grid-column: 1;
  grid-row: 1;
  justify-self: end;
  align-self: stretch;
}

.readrun-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  width: 100%;
  max-width: var(--readrun-content-width);
  min-height: 100vh;
  margin: 0 auto;
  padding: 0 1.25rem 1.25rem;
}

.readrun-article {
  grid-column: 1;
  min-width: 0;
  padding-top: 1.25rem;
}

.readrun-main {
  min-width: 0;
  width: 100%;
  max-width: var(--readrun-content-width);
}

/* ── Shared nav-tree baseline (ul / li / a / details) ── */
.nav-tree ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.nav-tree ul ul {
  padding-left: 12px;
}

.nav-tree li {
  margin: 0;
  padding: 0;
}

.nav-tree :is(li > a, details > summary) {
  min-height: var(--rr-control-height-compact);
  padding: 0 var(--rr-space-sm);
  align-items: center;
  font-family: var(--font-mono);
  font-size: 12px;
}

.nav-tree a {
  display: flex;
  min-width: 0;
  box-sizing: border-box;
  color: var(--color-text-muted);
  text-decoration: none;
}

.nav-tree a:hover {
  background: var(--color-border);
  text-decoration: none;
}
.nav-tree details > summary {
  display: flex;
  color: var(--color-text);
  cursor: pointer;
  list-style: none;
  font-weight: 500;
}

.nav-tree details > summary:hover { background: var(--color-border); }

.nav-tree details > summary::-webkit-details-marker {
  display: none;
}

.nav-tree details > summary::before {
  content: "\\203A";
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  margin-right: 5px;
  color: var(--color-text-muted);
}

.nav-tree details[open] > summary::before {
  content: "\\2039";
  transform: rotate(-90deg);
}

.nav-tree details > summary > a {
  padding: 0;
  display: inline;
  color: inherit;
  font-weight: inherit;
}

.nav-tree details > summary > a:hover {
  background: transparent;
}

.nav-tree details > summary > span {
  display: inline;
  color: inherit;
  font-weight: inherit;
}

/* ── Page navigation specifics ── */
.sidebar-nav [aria-current="page"] > a,
.sidebar-nav a[aria-current="page"] {
  background: var(--color-active-bg);
  color: var(--color-text);
}

.sidebar-nav details > summary:has(> a[aria-current="page"]) {
  background: var(--color-active-bg);
  color: var(--color-text);
}

.sidebar-nav details > summary > a[aria-current="page"] {
  background: transparent;
}

.sidebar-nav li.rr-page-nav-hidden { display: none; }
.sidebar-nav li.rr-page-nav-match > a,
.sidebar-nav li.rr-page-nav-match > details > summary {
  background: var(--color-active-bg);
}

/* ── TOC sidebar ── */
.toc-sidebar-slot {
  grid-column: 3;
  grid-row: 1;
  align-self: start;
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: var(--readrun-toc-width);
  width: var(--readrun-toc-width);
  height: 100vh;
  height: 100dvh;
  background: var(--color-sidebar-bg);
  overflow: hidden;
}

.toc-sidebar {
  grid-column: 1;
  grid-row: 1;
  width: var(--readrun-toc-width);
  height: 100%;
  overflow: hidden;
  background: var(--color-sidebar-bg);
  border-left: 1px solid var(--color-border);
  font-family: var(--font-mono);
  padding: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.toc-sidebar__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--rr-space-sm) 0;
}

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

/* ── Page meta ── */
.page-meta { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }

/* ── Tag pills ── */
.tag-pills { margin: 0 0 1.5em 0; display: flex; flex-wrap: wrap; gap: 6px; }

.tag-pill {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-fg-muted);
  text-decoration: none;
  background: var(--color-bg-alt);
}

.tag-pill:hover { color: var(--color-link); border-color: var(--color-link); }

/* ── Backlinks ── */
.backlinks {
  margin-top: 4em;
  padding-top: 1.5em;
  border-top: 1px solid var(--color-border);
  font-size: 0.95em;
}

.backlinks h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-fg-muted);
  margin: 0 0 0.6em 0;
  font-weight: 600;
}

.backlinks ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.backlinks a { color: var(--color-link); text-decoration: none; }
.backlinks a:hover { text-decoration: underline; }

/* ── Resize handles ── */
.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.resize-handle:hover,
.resize-handle--active { background: var(--color-border); }

.resize-handle--toc {
  grid-column: 1;
  grid-row: 1;
  width: var(--readrun-toc-handle-width);
  justify-self: start;
  align-self: stretch;
  min-height: 0;
}

/* ── Focus mode ── */
[data-focus="true"] .readrun-shell { grid-template-columns: minmax(0, 1fr); }
[data-focus="true"] .readrun-content { grid-column: 1; }
[data-focus="true"] .readrun-sidebar { display: none !important; }
[data-focus="true"] #resize-sidebar { display: none !important; }
[data-focus="true"] .toc-sidebar-slot { display: none !important; }

.readrun-img { display: block; margin: 16px 0; max-width: 100%; cursor: zoom-in; }

/* ── Block base ── */
.block { margin: 1rem 0; padding: 0.75rem; border: 1px solid var(--color-border); background: var(--color-surface, var(--rr-surface)); }

/* ── Viewer base ── */
.viewer iframe { width: 100%; min-height: 24rem; border: 1px solid var(--color-border); }
.viewer img, .viewer video { max-width: 100%; display: block; }

/* ── Responsive: below 960px, hide the secondary TOC ── */
@media (max-width: 960px) {
  .readrun-shell--with-toc {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  }

  .toc-sidebar-slot { display: none; }
}
`;
