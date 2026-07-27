export const uiStyles = `
.rr-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rr-modal-popup {
  z-index: 1;
}

/* ── Print ── */
@media print {
  .readrun-sidebar, .toc-sidebar, .resize-handle, .mobile-topbar, .drawer-scrim,
  .settings, .resource-switcher, .page-search-modal, .site-search-palette,
  .context-menu, .lightbox, .code-modal, .exec-block-actions, .tag-pills,
  .backlinks { display: none !important; }
  .readrun-article { width: 100% !important; max-width: none !important; padding: 0 !important; }
  body { background: white !important; color: black !important; }
  .markdown-body { color: black !important; }
  a { color: black !important; text-decoration: underline; }
  pre, code { background: #f4f4f4 !important; color: black !important; }
  .exec-block { border: 1px solid #ccc !important; page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
}

/* ── Resource browser ── */
.resource-browser {
  font-family: var(--font-body);
  font-size: 12px;
}

.resource-browser__heading {
  margin-bottom: 8px;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.resource-browser__search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.resource-browser__search input {
  min-width: 0;
  flex: 1;
  padding: 5px 7px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.resource-browser__category-header {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-muted);
}

.resource-browser__category-label { flex: 1; }

.resource-browser__item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.resource-browser__item:hover { background: var(--color-border); }

.resource-browser__thumbnail {
  width: 20px;
  height: 20px;
  object-fit: cover;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}

.resource-browser__file-icon { width: 20px; text-align: center; }
.resource-browser__link {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.resource-browser__item > a:hover { background: transparent; }
.resource-browser li.rr-resource-hidden { display: none; }
.resource-browser__empty { color: var(--color-text-muted); font-size: 11px; }

/* ── Context menu ── */
.context-menu {
  min-width: 190px;
  padding: 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.context-menu__positioner { z-index: 300; }

.context-menu__item {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 7px 9px;
  border-radius: 6px;
  color: var(--color-text);
  cursor: pointer;
  outline: none;
  user-select: none;
}

.context-menu__item:hover,
.context-menu__item:focus,
.context-menu__item[data-highlighted] {
  background: var(--color-active-bg);
  outline: none;
}

.context-menu__sep {
  height: 1px;
  background: var(--color-border);
  margin: 4px -4px;
}

/* ── Overlays ── */
div.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: overlay-fade-in 0.14s ease;
}

div.overlay.open { display: flex; }

@keyframes overlay-fade-in { from { opacity: 0; } to { opacity: 1; } }

.overlay__card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: min(92vw, 720px);
  max-height: min(88vh, 760px);
  overflow-y: auto;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(255, 255, 255, 0.04);
}

#settings-overlay .overlay__card { width: min(92vw, 560px); }

.overlay__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--color-border);
}

.overlay__title {
  font-size: 17px;
  font-weight: 650;
  color: var(--color-text);
  letter-spacing: 0;
}

.overlay__close-hint {
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text-muted);
}

.overlay__close-hint:hover,
.overlay__close-hint:focus-visible {
  background: var(--color-active-bg);
  color: var(--color-text);
  outline: none;
}

/* ── Shortcuts grid ── */
.shortcuts-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }

.shortcuts-grid__category {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-link);
  margin-bottom: 12px;
  font-weight: 600;
}

.shortcuts-grid__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.shortcuts-grid__label { color: var(--color-text); font-size: 14px; }

kbd {
  font-family: var(--font-mono);
  background: var(--color-code-bg);
  padding: 2px 8px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  display: inline-block;
  min-width: 22px;
  text-align: center;
}

/* ── Theme picker ── */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.theme-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 8px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.theme-card:hover {
  border-color: var(--color-text-muted);
  background: var(--color-sidebar-bg);
}

.theme-card:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

.theme-card--active {
  border-color: var(--color-link);
  box-shadow: 0 0 0 1px var(--color-link);
  background: var(--color-active-bg);
}

.theme-card__swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 42px;
  height: 28px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.theme-card__swatches span { min-width: 0; }

.theme-card__preview {
  padding: 16px;
  font-family: var(--font-body);
  font-size: 12px;
  min-height: 120px;
}

.theme-card__preview-heading {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 6px;
  padding-bottom: 4px;
}

.theme-card__preview-code {
  padding: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  margin-bottom: 6px;
}

.theme-card__preview-text { font-size: 11px; }

.theme-card__name {
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Settings panel ── */
.settings { position: fixed; top: 12px; right: 12px; z-index: 100; }

.settings-panel {
  display: grid;
  gap: 18px;
  padding: 18px 20px 20px;
}

.settings__panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 220px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 12px;
  display: none;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.settings__panel.open { display: flex; }

.settings__section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.settings__section + .settings__section {
  padding-top: 2px;
}

.settings__label {
  font-size: 12px;
  font-weight: 650;
  color: var(--color-text-muted);
  letter-spacing: 0;
}

.settings__range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 20px;
  background: transparent;
  accent-color: var(--color-link);
  cursor: pointer;
}

.settings__range:focus-visible { outline: none; }

.settings__range::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-border);
}

.settings__range::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  margin-top: -6px;
  border: 2px solid var(--color-link);
  border-radius: 999px;
  background: var(--color-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.settings__range::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-border);
}

.settings__range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-link);
  border-radius: 999px;
  background: var(--color-bg);
}

.settings__select {
  width: 100%;
  min-height: 34px;
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
}

.settings__select:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

.settings__segmented {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-sidebar-bg);
}

.settings__segmented-btn {
  min-height: 32px;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 12px;
  padding: 6px 5px;
  transition: color 0.12s, background 0.12s, box-shadow 0.12s;
}

.settings__segmented-btn:hover {
  color: var(--color-text);
}

.settings__segmented-btn:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 1px;
}

.settings__segmented-btn--active {
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.settings__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.settings__switch {
  position: relative;
  width: 42px;
  height: 24px;
  background: var(--color-border);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  padding: 0;
}

.settings__switch--on { background: var(--color-link); }

.settings__switch--locked {
  opacity: 0.55;
  cursor: not-allowed;
}

.settings__switch:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

.settings__switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
  transition: transform 0.2s;
}

.settings__switch--on .settings__switch-thumb { transform: translateX(18px); }

/* ── Theme row in settings ── */
.settings__theme-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings__theme-arrow {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-muted);
  transition: all 0.12s;
  line-height: 1;
}

.settings__theme-arrow:hover { border-color: var(--color-text-muted); color: var(--color-text); }

.settings__theme-name {
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  padding: 4px 8px;
  font-family: var(--font-mono);
  transition: all 0.12s;
}

.settings__theme-name:hover { border-color: var(--color-text-muted); color: var(--color-text); }

.settings__shortcuts-btn {
  width: 100%;
  min-height: 36px;
  padding: 8px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.settings__shortcuts-btn:hover {
  background: var(--color-sidebar-bg);
  border-color: var(--color-text-muted);
}

.settings__shortcuts-btn:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}
`;
