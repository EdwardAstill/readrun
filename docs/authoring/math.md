# Math

readrun typesets dollar-delimited LaTeX with KaTeX in the browser.

Use `$...$` for inline math:

```markdown
Euler's identity is $e^{i\pi} + 1 = 0$.
```

Use `$$...$$` for display math:

```markdown
$$
\sum_{i=1}^n i = \frac{n(n+1)}{2}
$$
```

Math is rendered after the page loads and after readrun navigation. Before the
browser client mounts, the dollar-delimited source remains readable. Delimiters
inside inline code and fenced code blocks are left unchanged.

Backslash-delimited `\(...\)` and `\[...\]` math is not supported. Use dollar
delimiters when migrating existing notes.
