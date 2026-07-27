export const quizStyles = `
/* ── Quiz container ── */
.quiz {
  width: 100%;
  padding: 32px 24px;
  font-family: var(--font-body);
}

/* Header */
.quiz__header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.quiz__title {
  font-size: 1.375em;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.quiz__section {
  font-size: 0.75em;
  color: var(--color-link);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
  font-family: var(--font-mono);
}

.quiz__progress {
  font-size: 0.75em;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.quiz__answered { margin-left: 12px; }

/* Question */
.quiz__question { margin-bottom: 24px; }

.quiz__question-text {
  font-size: 0.9375em;
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: 16px;
}

.quiz__question-text p:last-child { margin-bottom: 0; }

/* Options */
.quiz__options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.quiz__option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.875em;
  color: var(--color-text);
  text-align: left;
  transition: border-color 0.12s, background 0.12s;
}

.quiz__option:hover:not(.quiz__option--disabled) {
  border-color: var(--color-text-muted);
}

.quiz__option--selected {
  border-color: var(--color-link);
  background: var(--color-active-bg);
}

.quiz__option--correct {
  border-color: #2da44e;
  background: rgba(45, 164, 78, 0.1);
}

.quiz__option--wrong {
  border-color: #cf222e;
  background: rgba(207, 34, 46, 0.1);
}

.quiz__option--disabled { cursor: default; pointer-events: none; }

.quiz__option-marker {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875em;
  font-weight: 600;
  font-family: var(--font-mono);
  background: var(--color-border);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.quiz__option--selected .quiz__option-marker {
  background: var(--color-link);
  color: white;
}

.quiz__option--correct .quiz__option-marker {
  background: #2da44e;
  color: white;
}

.quiz__option--wrong .quiz__option-marker {
  background: #cf222e;
  color: white;
}

/* Feedback */
.quiz__feedback {
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 0.875em;
  line-height: 1.5;
}

.quiz__feedback--correct {
  background: rgba(45, 164, 78, 0.12);
  border-left: 3px solid #2da44e;
  color: var(--color-text);
}

.quiz__feedback--wrong {
  background: rgba(207, 34, 46, 0.1);
  border-left: 3px solid #cf222e;
  color: var(--color-text);
}

/* Summary */
.quiz__summary {
  padding: 32px 24px;
  text-align: center;
}

.quiz__summary h2 {
  font-size: 1.5em;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--color-text);
}

.quiz__summary-score {
  font-size: 3em;
  font-weight: 700;
  color: var(--color-link);
  margin-bottom: 8px;
}

.quiz__summary-detail {
  font-size: 0.875em;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.quiz__summary-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  font-size: 0.875em;
}

.quiz__summary-stat-label {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.75em;
  margin-bottom: 4px;
}

.quiz__summary-stat-value {
  color: var(--color-text);
  font-weight: 600;
}

/* Progress bar */
.quiz__progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  margin: 16px 0;
  overflow: hidden;
}

.quiz__progress-bar-fill {
  height: 100%;
  background: var(--color-link);
  transition: width 0.3s ease;
}

/* ── Legacy quiz selectors (for client-side quiz rendering) ── */
.quiz__option-check { font-size: 0.75em; }
.quiz__option-text { flex: 1; }

.quiz__tf-options { display: flex; gap: 8px; margin-bottom: 16px; }
.quiz__tf-btn--correct { border-color: #2da44e; background: rgba(45, 164, 78, 0.1); }
.quiz__tf-btn--wrong { border-color: #cf222e; background: rgba(207, 34, 46, 0.1); }

.quiz__freetext { margin-bottom: 16px; }
.quiz__freetext-answer { font-size: 0.875em; color: var(--color-text-muted); }

.quiz__hint { margin-top: 12px; }
.quiz__hint-text {
  margin-top: 8px;
  padding: 10px 14px;
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  font-size: 0.875em;
  color: var(--color-text-muted);
}

.quiz__feedback-result { font-weight: 600; }
.quiz__feedback-result--correct { color: #2da44e; }
.quiz__feedback-result--wrong { color: #cf222e; }

.quiz__correct-answer {
  margin-top: 6px;
  font-size: 0.875em;
  color: var(--color-text-muted);
}

.quiz__explanation {
  margin-top: 6px;
  font-size: 0.875em;
  color: var(--color-text-muted);
  font-style: italic;
}

.quiz__nav {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.quiz__group-prompt { margin-bottom: 16px; }
.quiz__group-part { margin-bottom: 16px; }
.quiz__group-part-label {
  font-size: 0.75em;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  margin-bottom: 8px;
}

.quiz__info-label {
  font-size: 0.75em;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.quiz__info {
  background: var(--color-sidebar-bg);
  border: 1px solid var(--color-border);
  padding: 16px 20px;
  margin-bottom: 16px;
  font-size: 0.9375em;
  line-height: 1.8;
  color: var(--color-text);
}

.quiz__info p { margin: 0 0 12px; }
.quiz__info p:last-child { margin-bottom: 0; }
.quiz__info h2 { font-size: 1.25em; margin: 16px 0 8px; }
.quiz__info h3 { font-size: 1.1em; margin: 14px 0 6px; }
.quiz__info ul, .quiz__info ol { padding-left: 24px; margin: 8px 0; }
.quiz__info table { border-collapse: collapse; width: 100%; margin: 12px 0; }
.quiz__info th, .quiz__info td {
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  font-size: 0.875em;
}
.quiz__info th { background: var(--color-bg); }
.quiz__info code {
  background: var(--color-code-bg);
  padding: 2px 5px;
  font-size: 0.875em;
  font-family: var(--font-mono);
}
.quiz__info pre {
  background: var(--color-code-bg);
  border: 1px solid var(--color-border);
  padding: 14px 16px;
  overflow-x: auto;
  margin: 12px 0;
}
.quiz__info pre code {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-text);
  font-size: 0.875em;
}

.quiz__info blockquote {
  border-left: 3px solid var(--color-link);
  padding: 8px 14px;
  margin: 12px 0;
  background: var(--color-active-bg);
  font-style: italic;
}
.quiz__info blockquote p:last-child { margin-bottom: 0; }

/* ── Results ── */
.quiz__results-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.quiz__results-score {
  font-size: 3em;
  font-weight: 700;
  color: var(--color-text);
  margin: 12px 0 4px;
  font-family: var(--font-mono);
}

.quiz__results-detail {
  font-size: 0.8125em;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.quiz__results-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 24px;
}

.quiz__result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 0.8125em;
}

.quiz__result-item--correct { background: rgba(45, 164, 78, 0.07); }
.quiz__result-item--wrong { background: rgba(207, 34, 46, 0.07); }

.quiz__result-marker { width: 18px; text-align: center; font-weight: 700; }
.quiz__result-item--correct .quiz__result-marker { color: #2da44e; }
.quiz__result-item--wrong .quiz__result-marker { color: #cf222e; }

.quiz__result-num {
  font-family: var(--font-mono);
  font-size: 0.6875em;
  color: var(--color-text-muted);
  min-width: 28px;
}

.quiz__result-text { flex: 1; color: var(--color-text); }
.quiz__result-text p { margin: 0; }

.quiz__results-actions { text-align: center; }
`;
