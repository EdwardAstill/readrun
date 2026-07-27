export const execBlockStyles = `
/* ── Code blocks ── */
.code-panel {
  border: 1px solid var(--color-border);
  margin: 16px 0;
  overflow: hidden;
  background: var(--color-bg);
  padding: 0;
}

.block.code-panel,
.block-exec {
  padding: 0;
}

.code-panel__header,
.exec-block-header {
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

.code-panel__language,
.exec-block-lang {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-panel__actions,
.exec-block-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.exec-output {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.exec-block[data-language="jsx"] > .exec-output {
  display: block;
  white-space: normal;
  word-break: normal;
}

.exec-output:not(:empty) { padding: 12px 16px; margin-top: 4px; }
.exec-block[data-language="jsx"] > .exec-output:not(:empty) {
  margin-top: 0;
  padding: 1rem;
  background: var(--color-surface, var(--rr-surface));
  font-family: var(--font-body);
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
.exec-loading { color: var(--color-text-muted); font-style: italic; }
.exec-output img { max-width: 100%; margin-top: 8px; }
.code-panel > pre,
.exec-block pre { margin: 0; }

.exec-block--collapsed > pre { display: none; }

.exec-editable {
  display: block;
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  margin: 0;
  background: var(--color-code-bg);
  color: var(--color-text);
  border: none;
  border-top: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.875em;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  tab-size: 4;
  box-sizing: border-box;
}

.exec-editable:focus { background: var(--color-bg); }
.exec-block--collapsed .exec-editable { display: none; }

/* ── Code modal content ── */
.code-modal__code pre {
  padding: 16px;
  margin: 0;
  overflow-x: auto;
}

.code-modal__output {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

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
