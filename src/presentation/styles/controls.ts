export const controlStyles = `
/* ── Shared controls ── */
.rr-control {
  border-radius: var(--rr-control-radius);
  font-family: var(--font-body);
  line-height: 1;
}

.rr-control--compact { min-height: var(--rr-control-height-compact); }
.rr-control--default { min-height: var(--rr-control-height-default); }

.rr-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.12s, border-color 0.12s, color 0.12s;
}

.rr-button.rr-control--compact { padding: 0 8px; }
.rr-button.rr-control--default { padding: 0 12px; }

.rr-button--primary {
  border-color: var(--rr-accent);
  background: var(--rr-accent);
  color: var(--rr-on-accent);
}

.rr-button--primary:hover:not(:disabled) { filter: brightness(0.92); }

.rr-button--secondary {
  border-color: var(--rr-border);
  background: var(--rr-bg);
  color: var(--rr-text);
}

.rr-button--secondary:hover:not(:disabled) {
  border-color: var(--rr-muted);
  background: var(--rr-active-bg);
}

.rr-button--ghost {
  border-color: transparent;
  background: transparent;
  color: var(--rr-muted);
}

.rr-button--ghost:hover:not(:disabled) {
  background: var(--rr-active-bg);
  color: var(--rr-text);
}

.rr-button:focus-visible,
.rr-input:focus-visible {
  outline: 2px solid var(--rr-focus);
  outline-offset: 2px;
}

.rr-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.rr-input {
  min-width: 0;
  border: 1px solid var(--rr-border);
  background: var(--rr-bg);
  color: var(--rr-text);
  font-size: 0.8125rem;
  outline: none;
}

.rr-input.rr-control--compact { padding: 0 8px; }
.rr-input.rr-control--default { padding: 0 10px; }
.rr-input::placeholder { color: var(--rr-muted); opacity: 1; }
.rr-input:focus-visible { border-color: var(--rr-focus); }
.rr-input:disabled { cursor: not-allowed; opacity: 0.6; }
`;
