# readrun

Read Markdown folders as an interactive workspace: themed documents, tabs,
search, file navigation, and runnable code. Use the desktop app, a browser, or
publish the same folder as a static site.

## Install

With [Bun](https://bun.sh/) installed:

```sh
bun install -g github:EdwardAstill/readrun
```

From a checkout of this repository instead:

```sh
bun install
bun link
```

`bun install` installs the dependencies, including Electron; `bun link` makes
this checkout's `rr` command available. No separate native build is needed.
Without linking, run `bun src/cli.ts docs` directly.

## Start reading

```sh
rr ./notes          # open a folder in the desktop app
rr                  # open the current folder
rr ./notes/page.md  # open just one Markdown file (PDFs also work)
rr docs             # try the built-in documentation
rr web ./notes      # use your web browser instead
```

Open a **folder** for workspace-wide links, search, and file navigation.
Opening a single file indexes only that document, not its siblings.
Source changes update the reader automatically.

## Features

- **Themes and styling.** Light, Dark, Solarized, Nord, Dracula, Monokai,
  Gruvbox, and Catppuccin. Settings also controls typeface, text size, and
  content width. Appearance is saved locally and shared across open documents.
- **Tabs and links.** Open local document links in workspace tabs.
  **Ctrl-click / Cmd-click** opens and selects an app tab instead of a browser
  tab; an already-open document is reused. Switch, close, drag, split, float,
  and dock tabs without losing each document's interactive state. External
  links, downloads, and same-page anchors keep their normal behavior.
- **File navigation.** Open **Files** to browse a folder workspace in a
  left-side drawer. Expand nested folders, filter filenames, and open a
  document. The tree supports keyboard navigation and marks the current file.
  Filesystem navigation works without config; an optional
  `.readrun/navigation.yaml` provides a curated tree.
- **Search.** Search filenames, paths, and page text across the workspace,
  inspect linked-note previews, or find text in the active document. The
  **Search** button opens a command palette for choosing the scope.
- **Keyboard shortcuts.** Navigate pages and tabs, change appearance, and
  search without leaving the keyboard.
- **Runnable code.** Run Python blocks inline and mount interactive React/JSX
  widgets alongside your notes. Output, figures, errors, and generated-file
  downloads stay with the document.

Tabs/layout use [edcn Workspace](https://github.com/EdwardAstill/edcn/tree/main/registry/workspace);
file navigation adapts [edcn Tree](https://github.com/EdwardAstill/edcn/tree/main/registry/tree)
to readrun's server-rendered navigation. Both use shadcn/ui components.

## Useful shortcuts

| Action | Shortcut |
| --- | --- |
| Command palette | Ctrl+K / Cmd+K |
| Search the active page | s |
| Next / previous theme | t / Shift+T |
| Increase / decrease text size | = / - |
| Open a file (desktop picker; browser Files drawer) | b |
| Next / previous tab | Alt+Down / Alt+Up |
| Close the active tab | Alt+W |
| Show all shortcuts | ? |

Single-letter shortcuts do not run while typing in an editable field.

## Runnable Python

Put this in a Markdown file and click **Run**:

```text
[python]
print("Hello from readrun!")
[/python]
```

Ordinary fenced code blocks are display-only. Python runs through Pyodide in
the browser, or through local `uv` when it is installed and **Run Python
locally** is enabled (the default when available). Local execution runs native
code on your machine: only run documents you trust. Turn that setting off to
use Pyodide. The first browser run downloads the runtime and required packages.

## More

- [Full documentation and live examples](https://edwardastill.github.io/readrun/)
- [Code and imports](docs/authoring/code.md)
- [Navigation configuration](docs/authoring/nav.md)
- [CLI commands](docs/start/commands.md)
- [Build and deployment](docs/deployment/overview.md) — `rr build ./notes` produces a static site in `dist/`.
