# readrun reference

This section explains the app as a system: what readrun is, what it reads from
your folder, what it generates, and what runs in the browser.

## What readrun is

readrun is a Markdown site runner for notes, lessons, and technical documents.
It starts with a normal content folder and adds optional interactive features:

- A navigable website built from `.md` files
- Runnable Python blocks powered by Pyodide
- JSX blocks and bundled React widgets
- File viewers for CSV, 3D models, PDFs, audio, video, and images
- Static output for deployment

The core rule is that plain Markdown should remain valid content. readrun adds
capabilities through bracket blocks, `.readrun/` assets, and optional config.

## Mental model

Think of a readrun project as three layers:

| Layer | What you edit | What readrun does |
|---|---|---|
| Content | Markdown pages and links | Builds pages, nav, tags, search data |
| Assets | `.readrun/assets/**`, `.readrun/widgets/**` | Copies assets, bundles widgets, resolves references |
| Runtime | Generated HTML, CSS, and browser JS | Runs code blocks, mounts widgets, handles navigation |

Most projects only need the content layer. The other layers are there when a
page needs executable code, media, structured navigation, or deployment.

## Content folder

A small readrun folder can be just this:

```text
notes/
  welcome.md
  lecture-1.md
  lecture-2.md
```

A larger folder can opt into project assets and curated navigation:

```text
notes/
  welcome.md
  lessons/
    intro.md
    functions.md
  .readrun/
    navigation.yaml
    ignore
    assets/
      data/
      files/
      images/
      scripts/
    widgets/
```

The `.readrun/` folder is optional. It is where readrun looks for project
configuration, local assets, executable scripts, and source widgets.

## Development and build modes

Use `rr` or `rr serve` while editing. The dev server reads the source folder,
renders pages on request, serves assets, and opens one native readrun window.
The window displays the same browser-compatible page runtime used by static
builds and reloads when source files change. Use `rr web <path>` for an external
browser or `--no-open` for server-only operation.

Use `rr build` or `rr deploy` when you want static output. The build writes
HTML, CSS, JavaScript, search data, and copied assets into a generated output
folder. `rr build` defaults to `dist/`; `rr deploy` uses `site/dist/` alongside
its generated deploy package, lockfile, and installed dependencies in `site/`.
The deployed site does not need a readrun server.

## Reading several files

Opening a page from **Files**, search, or a document link adds a workspace tab.
Selecting an already open page returns to its tab. Each file keeps its scroll
position, code edits, quiz answers, and running widgets while you switch tabs
or rearrange panes.

- **Split right** or **Split down** opens another instance of the selected file.
- Drag a tab to a pane's edge to split it, or to its center to group tabs.
- Drag a divider to resize panes; arrow keys resize a focused divider too.
- **Float** moves the selected file into a floating window; **Dock** returns it.
- Close a tab with its **×** button. Empty panes disappear automatically.

**Outline**, **Resources**, page search, and reading shortcuts apply to the
selected file. `Alt+ArrowDown` and `Alt+ArrowUp` cycle its pane's tabs; `Alt+W`
closes the selected tab. `Alt+F` floats it and `Alt+D` docks it.

Open tabs and their working state last until you close them or reload the
workspace. Reloading starts with the file in the address bar.

## Where to go next

- [Runtime flow](./runtime.md) explains what happens during serve, build, and browser execution.
- [Project layout](./project-layout.md) explains the important source folders in this repo.
- [Blocks](../authoring/blocks.md) is the syntax reference for interactive content.
- [Commands](../start/commands.md) lists every `rr` command.
