# readrun

readrun turns folders of Markdown into interactive websites. No config, no mandatory setup — just `.md` files in a folder. Optional YAML frontmatter (`title`, `tags`) is recognised when present.

This `docs/` folder is also the built-in project served by `rr docs`. Its
sidebar is curated with `.readrun/navigation.yaml`; `rr docs-wiki` reuses the
same source with wiki navigation.

## Documentation

**[Philosophy](./start/philosophy.md)** — the design principles behind readrun: markdown-first, optional enhancements, not a notebook.

**[Frontmatter](./authoring/frontmatter.md)** — `title`, `tags`, and wikilink resolution rules.

**[Navigation](./authoring/nav.md)** — tree mode, wiki mode, `.readrun/navigation.yaml`, and `.readrun/entry.txt`.

**[Deployment](./deployment/overview.md)** — local preview, static builds, and platform-specific deployment (GitHub Pages, Vercel, Netlify).

**[Deployment Auth](./deployment/auth.md)** — Password-gated Vercel builds using `.readrun/pw.txt`.

**[Blocks](./authoring/blocks.md)** — reference for all block syntax: python, jsx, quiz, upload, include, query, raw, and viewer blocks.

**[Code](./authoring/code.md)** — Python basics, imports such as `numpy`, and how executable Python runs in the browser.

**[Commands](./start/commands.md)** — CLI command reference: every `rr` subcommand with arguments and options.

**[Reference](./reference/overview.md)** — The app model: content folders, assets, runtime behavior, and source layout.

**[Architecture](./project/architecture.md)** — source file map: what every file in `src/` does.

**[Limitations](./project/limitations.md)** — known constraints: Pyodide limitations, package support, build behavior.

**[Roadmap](./project/roadmap.md)** — the short list of planned improvements.

## Quick start

```bash
bun install -g github:EdwardAstill/readrun

# serve your notes
cd your-notes-folder
rr

# open a folder or file directly
rr <folder>
rr <file.md>

# or open the built-in docs project
rr docs
```
