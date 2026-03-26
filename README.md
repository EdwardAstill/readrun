# explainr

Turn folders of Markdown into interactive websites with executable Python code blocks.

Like [Marimo](https://marimo.io/) but for Markdown-first workflows -- write your content in `.md` files, organize them in folders, and explainr renders them as a navigable, interactive site where readers can run Python code inline.

## Vision

### Phase 1: Markdown Rendering
Render a folder of Markdown files as a static website with navigation, syntax highlighting, and clean typography. Deployable to Vercel or GitHub Pages.

### Phase 2: Executable Code Blocks
Python code blocks become runnable in the browser (via Pyodide/WASM). Readers click "Run" and see output inline -- tables, plots, printed results.

### Phase 3: File Uploads
Users can upload their own data files (CSV, JSON, etc.) that the code blocks can read and process. Turns a static document into a personal analysis tool.

### Phase 4: `index.yml` Layout Configuration
An `index.yml` at the root describes how Markdown files and folders are structured -- ordering, grouping, titles, and navigation hierarchy. Lets authors control the site layout without renaming files.

## Motivation

For my thesis project ([FanMin](https://github.com/eastill/FanMin)), I used Marimo to build an interactive notebook for a numerical method. Marimo is great for notebooks, but what I actually wanted was to write Markdown documents with embedded runnable code -- more like a textbook or tutorial than a notebook. explainr fills that gap.

## Hosting

Designed to deploy as a static site to:
- Vercel
- GitHub Pages
- Netlify
- Any static file host
