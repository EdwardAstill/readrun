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
  display: block;
  border-collapse: collapse;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
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

/* --- KaTeX --- */
.readrun-main .katex-display {
  margin: 16px 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.2em 0;
}
.readrun-main .katex-display > .katex { overflow: visible; }

/* --- Blocks (custom readrun block wrappers) --- */
.readrun-main .block[class*="block-"] { margin: 1rem 0; padding: 0.75rem; border: 1px solid var(--rr-border); background: var(--rr-surface); }

/* --- Viewers --- */
.viewer iframe { width: 100%; min-height: 24rem; border: 1px solid var(--rr-border); }
.viewer img, .viewer video { max-width: 100%; display: block; }
`;
