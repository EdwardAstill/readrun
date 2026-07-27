export const markdownStyles = `
/* --- Markdown typography --- */
.readrun-main {
  min-width: 0;
  width: 100%;
  max-width: 880px;
  margin-inline: auto;
}

.readrun-main h1 { font-size: 2em; font-weight: 700; padding-bottom: 0.3em; border-bottom: 1px solid var(--rr-border); margin: 24px 0 16px; }
.readrun-main h2 { font-size: 1.5em; font-weight: 700; padding-bottom: 0.3em; border-bottom: 1px solid var(--rr-border); margin: 24px 0 16px; }
.readrun-main h3 { font-size: 1.25em; font-weight: 700; margin: 24px 0 16px; }
.readrun-main h4 { font-size: 1em; font-weight: 700; margin: 24px 0 16px; }
.readrun-main h5, .readrun-main h6 { margin: 1.25rem 0 0.5rem; }

.readrun-main p { margin-bottom: 16px; }
.readrun-main ul, .readrun-main ol { padding-left: 2em; margin-bottom: 16px; }
.readrun-main li + li { margin-top: 4px; }

.readrun-main blockquote {
  padding: 0 1em;
  color: var(--rr-muted);
  border-left: 3px solid var(--rr-border);
  margin-bottom: 16px;
}

.readrun-main a { color: var(--rr-accent); text-decoration: none; }
.readrun-main a:hover { text-decoration: underline; }

.readrun-main img { max-width: 100%; cursor: zoom-in; }
.readrun-main hr { border: none; border-top: 1px solid var(--rr-border); margin: 24px 0; }

/* --- Inline code --- */
.readrun-main code {
  background: var(--rr-surface);
  padding: 0.2em 0.4em;
  font-size: 85%;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  border-radius: 3px;
}

/* --- Pre / code blocks --- */
.readrun-main pre {
  background: var(--rr-surface);
  padding: 16px;
  overflow-x: auto;
  margin-bottom: 16px;
  line-height: 1.45;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
.readrun-main pre code { background: none; padding: 0; font-size: 85%; }

/* --- Tables --- */
.readrun-main table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
  color: var(--color-text);
}
.readrun-main th,
.readrun-main td {
  border: 1px solid var(--color-border);
  padding: 6px 13px;
  color: var(--color-text);
  background: var(--color-bg);
}
.readrun-main th {
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  font-weight: 600;
}

.readrun-main .rr-table-wrap {
  width: max-content;
  max-width: 100%;
  overflow: hidden;
  margin: 0 auto 16px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}
.readrun-main .rr-table-scroll {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.readrun-main .rr-table-scroll:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: -2px;
}

.readrun-main .rr-table {
  border-collapse: collapse;
  margin-bottom: 0;
  table-layout: fixed;
  font-size: 0.875em;
}
.readrun-main .rr-table th {
  background: var(--color-sidebar-bg);
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.78em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.readrun-main .rr-table td {
  padding: 6px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
  color: var(--color-text);
  vertical-align: top;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.readrun-main .rr-table tbody tr:hover td {
  background: color-mix(in srgb, var(--color-link) 4%, var(--color-bg));
}

.readrun-main .rr-table-wrap--sticky .rr-table th:first-child,
.readrun-main .rr-table-wrap--sticky .rr-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--color-bg);
  box-shadow: 2px 0 0 var(--color-border);
  transition: box-shadow 0.15s ease;
}
.readrun-main .rr-table-wrap--sticky .rr-table th:first-child {
  z-index: 4;
  background: var(--color-sidebar-bg);
}
.readrun-main .rr-table-wrap--sticky .rr-table tbody tr:hover td:first-child {
  background: color-mix(in srgb, var(--color-link) 6%, var(--color-bg));
}

.readrun-main .rr-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  padding: 4px 8px 4px 12px;
  background: var(--color-sidebar-bg);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-muted);
}
.readrun-main .rr-table-language {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.readrun-main .rr-table-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.readrun-main .rr-table-info {
  font-size: 11px;
  white-space: nowrap;
}
.readrun-main .rr-table-slider {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: default;
  white-space: nowrap;
}
.readrun-main .rr-table-slider--hidden { display: none; }
.readrun-main .rr-table-slider-label { font-size: 11px; }
.readrun-main .rr-table-width-slider {
  --rr-table-slider-progress: 20%;
  width: 92px;
  height: 16px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}
.readrun-main .rr-table-width-slider::-webkit-slider-runnable-track {
  height: 3px;
  background: linear-gradient(
    to right,
    var(--color-link) 0 var(--rr-table-slider-progress),
    var(--color-border) var(--rr-table-slider-progress) 100%
  );
}
.readrun-main .rr-table-width-slider::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  margin-top: -4.5px;
  appearance: none;
  border: 1px solid var(--color-link);
  border-radius: 0;
  background: var(--color-link);
}
.readrun-main .rr-table-width-slider::-moz-range-track {
  height: 3px;
  background: var(--color-border);
}
.readrun-main .rr-table-width-slider::-moz-range-progress {
  height: 3px;
  background: var(--color-link);
}
.readrun-main .rr-table-width-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid var(--color-link);
  border-radius: 0;
  background: var(--color-link);
}
.readrun-main .rr-table-width-slider:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}
.readrun-main .rr-table-width-value {
  font-size: 11px;
  min-width: 34px;
  text-align: right;
}
.readrun-main .rr-table-sticky {
  width: 82px;
  flex: 0 0 82px;
  font-family: var(--font-mono);
  font-size: 11px;
}

@media (max-width: 768px) {
  .readrun-main table { font-size: 14px; }

  .readrun-main .rr-table-wrap {
    width: auto !important;
    max-width: none;
    overflow: visible;
    margin: 0 0 16px;
    border: none;
  }

  .readrun-main .rr-table-scroll { overflow: visible; }

  .readrun-main .rr-table,
  .readrun-main .rr-table thead,
  .readrun-main .rr-table tbody,
  .readrun-main .rr-table tr,
  .readrun-main .rr-table th,
  .readrun-main .rr-table td {
    display: block;
    width: auto !important;
  }

  .readrun-main .rr-table-toolbar { display: none; }
  .readrun-main .rr-table thead { display: none; }

  .readrun-main .rr-table tr {
    border: 1px solid var(--color-border);
    margin-bottom: 12px;
    background: var(--color-bg);
  }

  .readrun-main .rr-table td {
    display: grid;
    grid-template-columns: minmax(7rem, 34%) minmax(0, 1fr);
    gap: 10px;
    border: none;
    border-top: 1px solid var(--color-border);
    white-space: normal;
    max-width: none !important;
  }

  .readrun-main .rr-table td:first-child {
    position: static;
    background: transparent;
    box-shadow: none;
    font-weight: 600;
  }

  .readrun-main .rr-table td::before {
    content: attr(data-label);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    min-width: 0;
  }
}

/* --- KaTeX --- */
.readrun-main .katex-display {
  margin: 16px 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.2em 0;
}
.readrun-main .katex-display > .katex { overflow: visible; }

/* --- Blocks (custom readrun block wrappers) --- */
.block { margin: 1rem 0; padding: 0.75rem; border: 1px solid var(--rr-border); background: var(--rr-surface); }

/* --- Viewers --- */
.viewer iframe { width: 100%; min-height: 24rem; border: 1px solid var(--rr-border); }
.viewer img, .viewer video { max-width: 100%; display: block; }
`;
