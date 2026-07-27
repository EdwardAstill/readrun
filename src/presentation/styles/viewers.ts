export const viewerStyles = `
/* ── Shared viewer chrome ── */
.viewer-error {
  padding: 0.75rem 1rem;
  background: var(--error-bg, #3a1a1a);
  color: var(--error-text, #f87171);
  border-left: 3px solid var(--error-text, #f87171);
  font-size: 0.875rem;
}

/* ── PDF ── */
.pdf-viewer-wrap {
  width: 100%;
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin: 1rem 0;
}
.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* ── Audio / Video ── */
.audio-viewer-wrap,
.video-viewer-wrap {
  margin: 1rem 0;
}
.audio-viewer {
  width: 100%;
}
.video-viewer {
  display: block;
  max-width: 100%;
}

/* ── CSV table ── */
.csv-viewer {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin: 1rem 0;
  font-size: 0.875rem;
}
.csv-toolbar {
  padding: 6px 10px;
  background: var(--color-sidebar-bg);
  border-bottom: 1px solid var(--color-border);
}
.csv-filter {
  width: 100%;
}
.csv-table-wrap {
  flex: 1;
  overflow: auto;
}
.csv-table {
  width: 100%;
  border-collapse: collapse;
}
.csv-table th {
  background: var(--color-sidebar-bg);
  color: var(--color-text-muted);
  padding: 5px 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.8rem;
}
.csv-table th:hover { background: var(--color-active-bg); }
.csv-table td {
  padding: 4px 10px;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.csv-table tr:nth-child(even) td { background: var(--color-sidebar-bg); }

/* ── Model viewer (Three.js STL/GLB) ── */
.model-viewer {
  position: relative;
  width: 100%;
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin: 1rem 0;
  background: var(--color-sidebar-bg);
}
.model-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.model-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: var(--error-text, #f87171);
  background: var(--color-sidebar-bg);
  font-size: 0.875rem;
}

/* ── CSV pagination ── */
.csv-pagination {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  background: var(--color-sidebar-bg);
  border-top: 1px solid var(--color-border);
  font-size: 0.75rem;
}
.csv-table tr:hover td { background: var(--color-active-bg); }

/* ── Generic file viewer ── */
.file-viewer {
  padding: 1.25rem;
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.file-viewer__icon {
  font-size: 2rem;
  opacity: 0.5;
}

.file-viewer__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-viewer__name {
  font-weight: 600;
  color: var(--color-text);
}

.file-viewer__meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.file-viewer__download {
  margin-left: auto;
  padding: 4px 12px;
  background: var(--color-link);
  color: white;
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
}

.file-viewer__download:hover { filter: brightness(0.9); }

/* ── Image viewer ── */
.image-viewer {
  margin: 1rem 0;
}
.image-viewer img {
  display: block;
  max-width: 100%;
  cursor: zoom-in;
}
`;
