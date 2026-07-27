export const shellActionStyles = `
.shell-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--rr-space-sm);
  padding: 0;
}

.shell-toolbar__button svg,
.mobile-topbar__btn svg {
  display: block;
  margin: auto;
}

.page-search-modal__dialog {
  outline: none;
}

@media (max-width: 768px) {
  .shell-toolbar { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  div.overlay { animation: none; }
}
`;
