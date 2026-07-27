export const uiStyles = `
/* ── Print ── */
@media print {
  .readrun-sidebar, #toc-sidebar,
  [data-slot="dropdown-menu-content"], #lightbox, #code-modal,
  .exec-block-actions { display: none !important; }
  .readrun-article { width: 100% !important; max-width: none !important; padding: 0 !important; }
  body { background: white !important; color: black !important; }
  .markdown-body { color: black !important; }
  a { color: black !important; text-decoration: underline; }
  pre, code { background: #f4f4f4 !important; color: black !important; }
  .exec-block { border: 1px solid #ccc !important; page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
}

/* Resource filtering is behavioural; presentation comes from Sidebar. */
.resource-browser li.rr-resource-hidden { display: none; }
`;
