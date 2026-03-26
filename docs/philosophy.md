# Philosophy

## Markdown-first

explainr is built around one core idea: **your existing Markdown notes should just work.**

Point explainr at any folder of `.md` files and it renders a navigable website with a sidebar, syntax highlighting, and clean typography. No special syntax, no config files, no frontmatter required. If you already take notes in Markdown, explainr turns them into a website with zero changes to your files.

## Optional enhancements, not requirements

explainr supports executable Python code blocks (`:::python`) and will eventually support file uploads. These are **optional layers** on top of plain Markdown — they exist for authors who want interactivity, but they are never required. A site built entirely from standard Markdown is a first-class use case, not a fallback.

This matters because:

- Authors shouldn't have to learn a new format to use explainr
- Notes written for explainr should remain perfectly readable in any Markdown viewer (VS Code, GitHub, Obsidian, etc.)
- The `:::python` fence is the only non-standard syntax, and it degrades gracefully — readers without explainr just see the code as text

## Not a notebook

explainr is not a notebook tool. It's a document renderer. The difference:

- **Notebooks** (Jupyter, Marimo) are code-first — you write code cells and add prose around them
- **explainr** is prose-first — you write documents and optionally embed runnable code

The goal is to make it easy to turn written explanations into interactive websites, not to replace computational notebooks.
