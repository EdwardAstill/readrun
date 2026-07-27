export const shellStyles = `
/* ── Sidebar resource switcher ── */
.resource-switcher {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  padding: 8px;
  display: grid;
  gap: 2px;
}

.resource-switcher__item {
  display: block;
  min-height: 30px;
  padding: 6px 8px;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-muted);
  cursor: pointer;
  outline: none;
}

.resource-switcher__item:hover {
  background: var(--color-active-bg);
  color: var(--color-text);
}

.resource-switcher__item--active {
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: inset 0 0 0 1px var(--color-border), 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* ── Focus mode navbar ── */
.readrun-sidebar.rr-focus-active > .sidebar-panel-body { padding: 0; }

.rr-focus-search-wrap {
  padding: var(--rr-space-sm);
  display: flex;
  align-items: stretch;
  gap: 6px;
  border-bottom: 1px solid var(--color-border);
}

.rr-focus-search-wrap input {
  flex: 1;
  min-width: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 6px 9px;
  font-size: 12.5px;
  font-family: var(--font-body);
  outline: none;
}

.rr-focus-search-wrap input:focus { border-color: var(--color-link); }

.rr-focus-toggle {
  flex: 0 0 auto;
  width: 30px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 16px;
  line-height: 1;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rr-focus-toggle:hover { color: var(--color-link); border-color: var(--color-link); }
.rr-focus-toggle:active { background: var(--color-active-bg); }

.rr-focus-crumbs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px var(--rr-space-sm);
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.12s;
}

.rr-focus-crumbs.empty { display: none; }
.rr-focus-crumbs.has-focus { background: var(--color-active-bg); }

.rr-crumb {
  font-size: 11.5px;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px 6px;
  background: transparent;
  border: none;
  font-family: var(--font-body);
}

.rr-crumb:hover { color: var(--color-text); background: var(--color-border); }
.rr-crumb.current { color: var(--color-link); font-weight: 600; cursor: default; }
.rr-crumb.current:hover { background: transparent; }
.rr-crumb-sep { color: var(--color-text-muted); font-size: 11px; padding: 0 1px; opacity: 0.6; }

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
  padding: 0 1px;
}

/* ── Current-page search modal ── */
.page-search-modal { display: none; position: fixed; inset: 0; z-index: 1000; }
.page-search-modal--open { display: block; }
.page-search-modal__scrim { position: absolute; inset: 0; background: rgba(0,0,0,0.22); backdrop-filter: blur(2px); }
.page-search-modal__bar {
  position: absolute;
  left: 50%;
  bottom: 18px;
  width: min(720px, calc(100vw - 32px));
  transform: translateX(-50%);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 18px 56px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.04);
  overflow: hidden;
  display: flex;
  align-items: center;
}
.page-search-modal__input {
  min-width: 0;
  flex: 1;
  padding: 14px 16px;
  font-size: 1rem;
  border: 0;
  background: transparent;
  color: var(--color-text);
  outline: none;
}
.page-search-modal__count {
  color: var(--color-text-muted);
  font: 12px var(--font-mono);
  min-width: 48px;
  text-align: center;
}
.page-search-modal__button,
.page-search-modal__close {
  border: 0;
  border-left: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  min-height: 48px;
  padding: 0 12px;
  font: 12px var(--font-body);
}
.page-search-modal__button:hover,
.page-search-modal__close:hover,
.page-search-modal__button:focus-visible,
.page-search-modal__close:focus-visible {
  color: var(--color-text);
  outline: none;
}
.page-search-modal__button:disabled {
  cursor: default;
  opacity: 0.45;
}
.page-search-modal__close {
  font-size: 18px;
  line-height: 1;
}

.page-search-highlight {
  background: rgba(255, 200, 0, 0.32);
  color: inherit;
  padding: 0;
}

.page-search-highlight--active {
  background: rgba(255, 200, 0, 0.72);
}

/* ── Site search palette ── */
.site-search-palette {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1100;
}

.site-search-palette--open { display: block; }

.site-search-palette__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(3px);
}

.site-search-palette__card {
  position: absolute;
  top: min(12vh, 96px);
  left: 50%;
  width: min(760px, calc(100vw - 32px));
  transform: translateX(-50%);
  overflow: hidden;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.36), 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.site-search-palette__bar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.site-search-palette__input {
  min-width: 0;
  flex: 1;
  padding: 15px 18px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: 16px var(--font-body);
}

.site-search-palette__close {
  width: 48px;
  min-height: 50px;
  border: 0;
  border-left: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font: 20px/1 var(--font-body);
}

.site-search-palette__close:hover,
.site-search-palette__close:focus-visible {
  color: var(--color-text);
  background: var(--color-active-bg);
  outline: none;
}

.site-search-palette__results {
  max-height: min(62vh, 620px);
  overflow-y: auto;
  padding: 6px;
}

.site-search-palette__result {
  display: block;
  padding: 10px 12px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  outline: none;
}

.site-search-palette__result:hover,
.site-search-palette__result--active {
  background: var(--color-active-bg);
}

.site-search-palette__title {
  display: block;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}

.site-search-palette__snippet {
  display: block;
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.site-search-palette__empty {
  padding: 18px 14px;
  color: var(--color-text-muted);
  font-size: 13px;
}

/* ── Wiki nav sections ── */
.wiki-nav-section { margin-bottom: var(--rr-space-md); }
.wiki-nav-section h2 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  padding: 0 var(--rr-space-sm);
  margin: 0 0 var(--rr-space-xs);
}

`;
