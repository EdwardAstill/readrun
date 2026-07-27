export const mobileStyles = `
/* Mobile topbar (hidden on desktop) */
.mobile-topbar { display: none; }

.drawer-scrim {
  position: fixed;
  inset: 0;
  z-index: 240;
  background: rgba(0, 0, 0, 0.45);
  display: none;
}

.drawer-scrim.open { display: block; }

@media (max-width: 768px) {
  :root {
    --sidebar-width: 80vw;
    --readrun-mobile-topbar-height: 44px;
  }

  body {
    display: block;
    min-height: 100vh;
  }

  .readrun-shell,
  .readrun-shell--with-toc {
    grid-template-columns: 1fr;
  }

  .readrun-content {
    grid-column: 1;
    grid-row: 1;
    padding-top: var(--readrun-mobile-topbar-height);
  }

  /* Mobile topbar */
  .mobile-topbar {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--readrun-mobile-topbar-height);
    align-items: center;
    padding: 0 8px;
    gap: 6px;
    background: var(--color-sidebar-bg);
    border-bottom: 1px solid var(--color-border);
    z-index: 220;
  }

  .mobile-topbar__btn {
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: 22px;
    line-height: 1;
    padding: 8px 10px;
    min-width: 44px;
    min-height: 44px;
    cursor: pointer;
    font-family: inherit;
  }

  .mobile-topbar__btn:active { background: var(--color-border); }

  .mobile-topbar__title {
    flex: 1;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
  }

  /* Sidebar -> off-canvas drawer */
  .readrun-sidebar {
    position: fixed !important;
    top: 0;
    left: 0;
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    max-width: 320px;
    height: 100vh;
    height: 100dvh;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    z-index: 250;
    display: flex;
    box-shadow: 2px 0 16px rgba(0, 0, 0, 0.2);
  }

  .readrun-sidebar.open { transform: translateX(0); }

  /* Main content full-width, leave room for fixed topbar */
  .readrun-article {
    max-width: 100%;
    margin: 0;
  }

  .readrun-layout {
    grid-template-columns: 1fr;
    max-width: none;
    min-height: calc(100vh - var(--readrun-mobile-topbar-height));
    min-height: calc(100dvh - var(--readrun-mobile-topbar-height));
    padding: 0 16px 24px;
  }

  /* Resize handles: useless on touch */
  .resize-handle { display: none; }

  /* TOC already hidden < 960px; keep it hidden */
  .toc-sidebar-slot { display: none; }

  /* Larger tap targets in nav */
  .nav-tree :is(li > a, details > summary) {
    min-height: 40px;
    padding: 0 14px;
    font-size: 14px;
  }

  .nav-tree ul ul { padding-left: 14px; }

  /* Settings panel: anchor below mobile topbar, sized for thumb */
  .settings { top: 48px; right: 6px; z-index: 230; }

  .settings-panel,
  .settings__panel {
    width: min(92vw, 280px);
  }

  /* Hide content-width slider on mobile (always full width) */
  #width-section { display: none; }

  /* Overlays: shrink padding, allow more height */
  .overlay__card {
    width: 100%;
    max-height: 92vh;
  }

  .overlay__header {
    min-height: 50px;
    padding: 0 14px;
  }

  .overlay__title { font-size: 15px; }

  /* Theme grid: 2 columns */
  .theme-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .theme-card { min-height: 46px; }
  .theme-card__preview { padding: 10px; min-height: 90px; }
  .theme-card__name { font-size: 12px; }

  /* Shortcuts grid: single column, smaller gap */
  .shortcuts-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  /* Code modal: full-screen on mobile */
  .code-modal__card {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
  }

  /* Context menu disabled on touch */
  .context-menu { display: none; }

}

@media (max-width: 768px) and (prefers-reduced-motion: reduce) {
  .readrun-sidebar { transition: none; }
}

@media (max-width: 480px) {
  .theme-grid { grid-template-columns: 1fr; gap: 8px; }
  div.overlay { padding: 10px; }
  .settings-panel { padding: 14px; }
}
`;
