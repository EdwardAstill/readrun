# Welcome to readrun

readrun turns folders of Markdown into interactive websites. You're looking at one right now.

## Get started

**[Getting Started](./start/intro.md)** — install readrun, run code from `.readrun/assets/scripts/`, embed images, and load Pyodide data from `.readrun/assets/data/`.

**[Deployment](./deployment/overview.md)** — CLI usage, static builds, and platform-specific deployment (GitHub Pages, Vercel, Netlify).

## File viewers

**[File Viewers](./authoring/file-viewers.md)** — embed 3D models, CSV tables, audio, video, and PDFs inline with `[stl=]`, `[model=]`, `[csv=]`, `[audio=]`, `[video=]`, `[pdf=]`.

## Reference

**[readrun Reference](./reference/overview.md)** — the app model, runtime flow, and source layout for this demo.

## Examples

**[Tables](./authoring/tables.md)** — content-aware Markdown tables with centred narrow tables, proportional column sizing, sticky overflow, and wide scroll examples.

**[Code](./authoring/code.md)** — Python basics, imports such as `numpy`, and how runnable Python executes in the browser.

**[Lecture 1](./examples/lecture-1.md)** — a sample lesson with runnable code blocks.

**[Functions](./examples/lecture-2.md)** — a second lesson that builds on the first, showing how pages can reference each other.

## How it works

[image=images/how-it-works.svg]

Your existing Markdown notes work as-is. These docs are just `.md` files in a folder:

```
docs/
  welcome.md          ← you are here
  README.md           ← docs landing page
  start/
    intro.md
    philosophy.md
    commands.md
  authoring/
    blocks.md
    code.md
    nav.md
    widgets.md
  reference/
    overview.md
    runtime.md
    project-layout.md
  deployment/
    overview.md
    auth.md
  examples/
    lecture-1.md
    lecture-2.md
  .readrun/
    navigation.yaml
    ignore
    assets/
      images/how-it-works.svg
      data/student.json
      files/results.csv
      scripts/variables.py
```

No mandatory config files. No required frontmatter. Just Markdown — with optional `.readrun/navigation.yaml` when you want a curated sidebar, or `.readrun/entry.txt` when you want wiki mode.

## Learn more

**[Philosophy](./start/philosophy.md)** — the design principles behind readrun: markdown-first, optional enhancements, not a notebook.

**[Roadmap](./project/roadmap.md)** — planned improvements.
