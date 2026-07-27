export const execBlockStyles = `
/* ── Image lightbox ── */
.lightbox {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  cursor: zoom-out;
  align-items: center;
  justify-content: center;
}

.lightbox.open { display: flex; }

.lightbox__close {
  display: block;
  border: 0;
  cursor: zoom-out;
}

.lightbox img {
  display: block;
  width: auto;
  height: auto;
  max-width: 92vw;
  max-height: 92vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: zoom-out;
}

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

.code-action-btn,
.exec-enlarge-btn,
.exec-toggle-btn,
.code-copy-btn {
  font-family: var(--font-mono);
  font-size: 11px;
}

.code-action-btn--primary,
.exec-run-btn {
  font-size: 12px;
  font-family: var(--font-body);
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
  padding: var(--rr-space-md);
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

/* ── Code modal ── */
.code-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  align-items: center;
  justify-content: center;
}

.code-modal.open { display: flex; }

.code-modal__card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  width: 94%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
}

.code-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-sidebar-bg);
}

.code-modal__lang {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-muted);
}

.code-modal__close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
}

.code-modal__close:hover { color: var(--color-text); }

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

.code-modal__run {
  background: #2da44e;
  color: #fff;
  border: none;
  padding: 4px 12px;
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  font-weight: 500;
}

.code-modal__run:hover { background: #218838; }

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

.upload-btn {
  background: var(--color-link);
  color: #fff;
  border: none;
  padding: 6px 16px;
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
  font-weight: 500;
  display: inline-block;
}

.upload-btn:hover { filter: brightness(0.85); }

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
