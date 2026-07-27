# Runtime flow

This page explains how readrun turns a folder into an interactive site.

## Serve mode

When you run `rr` or `rr serve`, readrun starts a local server for the selected
folder.

```text
content folder
  -> resolve .readrun/navigation.yaml, .readrun/entry.txt, and .readrun/ignore
  -> scan scoped pages and assets into one immutable snapshot
  -> build a route lookup from that snapshot
  -> serve browser assets
  -> watch files, rebuild, and atomically swap the route lookup
  -> notify connected browsers
```

The server keeps the source folder as the source of truth. `Bun.serve()` starts
once and keeps its port and live connections. File changes are rebuilt in
order; each request observes either the complete old snapshot or the complete
new snapshot, never a partially updated project.

## Static build mode

When you run `rr build` or `rr deploy`, readrun renders the whole site ahead of
time.

```text
content folder
  -> bundle widgets
  -> scan markdown pages
  -> render every page
  -> write _readrun/client.js
  -> write _readrun/client.css
  -> write _readrun/search-index.json
  -> copy project assets
  -> write target-specific site files
```

The output folder is static. It can be served by GitHub Pages, Vercel, Netlify,
or any server that can host HTML, CSS, JavaScript, and assets.

Build output owns site artifacts, including GitHub Pages' `.nojekyll` file.
`rr deploy` reuses the same build orchestration, then separately creates or
updates repository configuration such as the GitHub Actions workflow,
`vercel.json`, or `netlify.toml`.

## Browser runtime

The browser runtime is loaded by each rendered page. It handles behavior that
cannot be decided at build time:

- Sidebar and table-of-contents interactions
- Theme, layout, and shortcut settings
- In-page search and site search
- Runnable Python blocks
- JSX blocks and bundled widgets
- File viewers that need client-side behavior
- Scoped feature remounting after in-shell navigation

The browser runtime is intentionally small and DOM-based. Its composition root
registers application-scoped features once and page-scoped features through a
single lifecycle. It does not use a framework router or a global app state
store.

## Python execution

Python code runs in the browser through Pyodide. Packages are detected from
imports in `[python]` blocks and loaded before execution when possible.

```text
[python] block
  -> scan imports
  -> if "use uv for python" is off:
       load Pyodide on demand
       install needed packages
       run code in the browser
  -> if "use uv for python" is on and the server allows it:
       POST code to the local readrun server
       run uv in a temporary folder
  -> render stdout, stderr, figures, and generated files
```

Data files under `.readrun/assets/data/` are made available to Pyodide via
the `/_readrun/files/` endpoint, so code can read local project data in
browser mode. The local `uv` runner copies the same data files into its
temporary working directory as `data/**`.

The local uv switch is available automatically when `rr serve`, `rr docs`, or
`rr docs-wiki` can find `uv` on the host system. If `uv` is missing,
the settings switch is locked and Python blocks keep using Pyodide.

## JSX and widgets

Inline `[jsx]` blocks run directly in the page after React, ReactDOM, Babel,
and Tailwind are loaded.

Source widgets in `.readrun/widgets/*.tsx` are bundled into generated `.jsx`
files by `rr widgets-build`. Those generated files are embedded through the
same `[jsx=...]` syntax as normal script references.

## Remounting

In-shell navigation can replace the current article without a full page reload.
After a page swap, readrun dispatches one remount event. The central lifecycle
disposes every page-scoped feature, then mounts the registered page features
against the new article. Async JSX work receives an abort signal so disposed
pages cannot update later.

This lets the app keep global browser state, such as theme and Pyodide, while
still refreshing page-specific behavior.
