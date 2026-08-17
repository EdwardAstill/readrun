# Math

readrun renders LaTeX math with KaTeX. Both dollar and LaTeX-style delimiters
are supported.

Use either `$...$` or `\(...\)` for inline math:

```markdown
Euler's identity is $e^{i\pi} + 1 = 0$.

Euler's identity is \(e^{i\pi} + 1 = 0\).
```

Use either `$$...$$` or `\[...\]` for display math:

```markdown
\[
\sum_{i=1}^n i = \frac{n(n+1)}{2}
\]
```

Put `\[` and `\]` at the start and end of the display block. Delimiters inside
inline code and fenced code blocks are left unchanged.
