# Frontmatter

Readrun treats YAML frontmatter as optional. A folder of plain `.md` files with no frontmatter renders correctly. When frontmatter *is* present, readrun strips it from the rendered body and uses recognised fields for page metadata.

## Recognised fields

```yaml
---
title: "Contour Integration"
tags: [math, analysis]
---
```

| Field | Role |
|-------|------|
| `title` | Display label in the nav tree, page `<title>`, and preferred wikilink label |
| `tags` | Page tags used by tag indexes and query blocks |

Anything else is ignored by readrun.

## Navigation placement

Navigation placement is configured at the project level, not in page
frontmatter. Use `.readrun/navigation.yaml` for authored tree mode or
`.readrun/entry.txt` for wiki mode.

## Wikilink resolution

Readrun rewrites code examples like `&lbrack;&lbrack;target&rbrack;&rbrack;` and its variants into clickable links before rendering:

| Syntax | Result |
|--------|--------|
| `&lbrack;&lbrack;contour-integration&rbrack;&rbrack;` | Link to the note whose filename stem is `contour-integration` |
| `&lbrack;&lbrack;contour-integration\|The Residue Theorem&rbrack;&rbrack;` | Same link, with custom display label |
| `&lbrack;&lbrack;contour-integration#cauchy-theorem&rbrack;&rbrack;` | Same link with `#cauchy-theorem` anchor appended |
| `&lbrack;&lbrack;old/path/contour-integration&rbrack;&rbrack;` | Path prefix is stripped; only the final segment is resolved |

**Display label preference.** Explicit alias > target note's frontmatter `title` > filename stem.

**Fuzzy matches.** The index is keyed by the filename stem and by a normalised form: lowercase, with leading numeric prefixes like `01_` or `01-` stripped and underscores folded to hyphens. This means `&lbrack;&lbrack;01_absorption&rbrack;&rbrack;`, `&lbrack;&lbrack;Absorption&rbrack;&rbrack;`, and `&lbrack;&lbrack;absorption&rbrack;&rbrack;` all resolve to the same file when the actual filename is `absorption.md`.

**Ambiguity and unresolved.** If the normalised form matches more than one file, or if no file matches at all, the original `&lbrack;&lbrack;target&rbrack;&rbrack;` is left in the rendered output unchanged. Broken refs stay visible instead of silently failing.

## Frontmatter is stripped

Every note's YAML block (`---\n…\n---` at the top of the file) is removed before markdown rendering, so it never appears in the reader's HTML body. Your tooling can still read it directly from the `.md` file.
