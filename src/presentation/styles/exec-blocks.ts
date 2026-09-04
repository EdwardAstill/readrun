export const execBlockStyles = `
/* Code surfaces use shadcn Card, Button, and Textarea defaults. */
.readrun-main .code-panel pre {
  width: 100%;
  margin: 0;
}

.exec-block[data-language="jsx"] .exec-output {
  display: block;
  white-space: normal;
  word-break: normal;
  background: var(--color-surface, var(--rr-surface));
  color: var(--color-text);
}

.exec-block--output-only {
  min-width: 0;
  margin: 1rem 0;
}

.exec-block--output-only .exec-output {
  background: transparent;
}

.jsx-output__mount {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  margin-inline: auto;
  box-sizing: border-box;
}

.exec-output .exec-stdout { color: var(--color-text); }
.exec-output .exec-stderr { color: #cf222e; }
.exec-loading { color: var(--color-text-muted); }
.exec-block--collapsed [data-code-source],
.exec-block--collapsed .exec-editable { display: none; }

/* ── File upload blocks ── */
.upload-block { border: 1px solid var(--color-border); margin-bottom: 16px; overflow: hidden; }

.upload-block-header {
  background: var(--color-sidebar-bg);
  padding: 4px 12px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-block-body {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-block-status {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.upload-error { color: #cf222e; }

.upload-file-tag {
  display: inline-block;
  background: var(--color-code-bg);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  margin-right: 4px;
}
`;
