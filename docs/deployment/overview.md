# Deployment

## Previewing your site

Run `rr` from your content folder. readrun serves the current directory on port 3001 by default.

## Usage

```bash
rr               # serve the current folder
rr <folder>      # serve a folder directly
rr <file.md>     # serve a single markdown file directly
rr docs          # serve the built-in docs project
```

## Building a static site

Run `rr build <folder>` to generate static HTML, or `rr deploy <platform> <folder>` to generate a static build plus host config.

The output is a self-contained directory of HTML files — no server runtime needed. Each markdown page becomes `path/index.html`, and a root `index.html` redirects to the first page.

`rr deploy` keeps its generated deployment workspace separate from repository
host configuration:

```text
repository/
  site/
    package.json
    bun.lock
    .gitignore              # ignores node_modules/ and dist/
    node_modules/           # local install, ignored
    dist/                   # static site, ignored
  vercel.json               # Vercel only
  netlify.toml              # Netlify only
  .github/workflows/deploy.yml  # GitHub Pages only
  .vercel/output/           # password-protected Vercel only
```

Useful build options:

```bash
rr build my-notes/ --out=site
rr build my-notes/ --platform=github
rr build my-notes/ --platform=vercel
```

## Platform-specific builds

### GitHub Pages

Run this once from the repository root:

```bash
rr deploy github my-notes/
```

This creates `site/` at the repository root, including its generated
`package.json`, lockfile, and local dependencies, then builds `my-notes/` into
`site/dist/`. `site/.gitignore` ignores its `node_modules/` and `dist/`
directories. It also adds `.nojekyll`, auto-detects the base path from the git
remote, and writes the repository-root `.github/workflows/deploy.yml`. The
workflow uses a frozen install from `site/`, builds there, and deploys
`site/dist/` to Pages. In GitHub repository settings, set Pages to use
**GitHub Actions** as the source if it is not already configured that way.

### Vercel

`rr deploy vercel my-notes/` creates a repository-root `site/` deployment
workspace, builds the site from `my-notes/` into `site/dist/`, and writes a
repository-root `vercel.json`. The workspace contains the generated
`package.json`, lockfile, and installed dependencies. Vercel uses a frozen
install from this workspace. If a password is configured, it also writes Vercel
Build Output API files to `.vercel/output/`.

**`rr deploy` does not publish to Vercel.** It only prepares local build
output and deploy config. To actually push the site live, use one of these
methods:

- **Git integration** — commit and push the content folder, `site/`,
  `vercel.json`, and `.readrun/pw.txt` (if used). If Vercel is connected to
  your repo, it rebuilds from the commit automatically.
- **Manual CLI** — run `vercel deploy --prebuilt --prod` from the repo
  root. This uploads the prebuilt `.vercel/output/` directory generated
  by `rr deploy`, which includes the auth middleware.

#### Password protection

For simple private sharing on Vercel, add a password file before deploying:

```bash
mkdir -p .readrun
printf 'shared-password\n' > .readrun/pw.txt
rr deploy vercel my-notes/
# then push live:
vercel deploy --prebuilt --prod
```

When `rr deploy` finds `.readrun/pw.txt` in the repository root or content
root, it treats the Vercel deploy as password-protected. It still writes the
normal static output folder to `site/dist/`, and also writes Vercel Build
Output API files to `.vercel/output/`:

```text
.vercel/output/
  config.json
  static/                         # copy of the built site
  functions/_readrun_auth.func/   # login + cookie auth middleware
```

`.vercel/output/` is a prebuilt Vercel deployment. The middleware runs before
static files are served.

The middleware protects every route, including pages, `_readrun/client.js`,
`_readrun/client.css`, `_readrun/search-index.json`, assets, tag pages, and
`robots.txt`. Readers see a password-only login page; successful login sets an
auth cookie. `.readrun/pw.txt` may contain multiple passwords, one per line.

`pw.txt` must contain the real password. Empty files and the placeholder
`PUT-PASSWORD-HERE` fail `rr deploy` so you cannot accidentally deploy a site
that looks configured but has no real password.

GitHub Pages and plain static output cannot enforce this password gate because
they do not run middleware.

### Netlify

Run `rr deploy netlify my-notes/` once to create the repository-root `site/`
deployment workspace, build the site from `my-notes/` into `site/dist/`, and
write a repository-root `netlify.toml` with a frozen install, build command,
and publish directory configured.

## Ignore patterns

Create `.readrun/ignore` to exclude files and folders from the navigation tree:

```
drafts
notes/scratch.md
work-in-progress/
```

One pattern per line. Lines starting with `#` are comments. The nav tree also automatically ignores `node_modules`, `dist`, `out`, `.git`, `__pycache__`, and `venv`.

## The `.readrun/` directory

```
your-notes/
  page.md
  .readrun/
    assets/        # static resources referenced from markdown
      images/      # images referenced with [image=images/diagram.svg]
      data/        # data files preloaded into Pyodide's filesystem
      scripts/     # canonical code file references
    scripts/       # legacy code file references, still supported
    ignore         # patterns to exclude from navigation
```

- **assets/** — the canonical resource tree for images, data, PDFs, media, models, and other static files. Viewer blocks resolve paths relative to this folder, e.g. `[image=images/diagram.svg]`, `[csv=data/results.csv]`, or `[pdf=docs/spec.pdf]`.
- **assets/data/** — data files copied into static builds and preloaded into Pyodide's virtual filesystem, so Python code can read them with `open("data/example.csv")`.
- **assets/scripts/** — canonical executable file refs for `[python=scripts/file.py]` and `[jsx=scripts/widget.jsx]`. Legacy `.readrun/scripts/` remains supported for existing sites and widget outputs.

## How code execution works

### Python blocks (`[python]...[/python]`)

Python code blocks run in the browser via [Pyodide](https://pyodide.org/) (Python compiled to WebAssembly) by default. No server is involved in this default mode.

- **Automatic package installation** — import statements are parsed and packages are installed via micropip automatically. Common packages (numpy, pandas, matplotlib, scipy) are available from Pyodide's distribution. Pure-Python PyPI packages also work. Common import-to-package mappings are built in (e.g. `PIL` → `pillow`, `cv2` → `opencv-python`, `sklearn` → `scikit-learn`)
- **Preloading** — when a page loads, all code blocks are scanned for imports and packages begin installing in the background, so they're ready by the time you click Run
- **Shared session** — all code blocks on a page share a single Python session. Variables and imports persist between blocks, like cells in a Jupyter notebook
- **Matplotlib** — the Agg backend is configured automatically. Plots render inline as images when `plt.show()` is called
- **File generation** — files created by scripts are detected by comparing Pyodide's virtual filesystem before and after execution. New files are offered as downloads via Blob URLs
- **File uploads** — `[upload]...[/upload]` blocks render upload buttons that write files into Pyodide's virtual filesystem via the browser File API, making them available to Python code with standard file I/O
- **Embedded data** — files placed in `.readrun/assets/data/` are copied into static builds and preloaded into Pyodide's virtual filesystem
- **Local uv mode** — when serving locally with `uv` installed, the settings panel can switch Python blocks to run through `uv` on the local readrun server. This executes native Python on your machine and is not available in static builds.

### JSX blocks (`[jsx]...[/jsx]`)

JSX blocks run React/JSX code in the browser and auto-render on page load (no Run button needed). React 18, ReactDOM, Babel, and Tailwind CSS are loaded automatically.

Use the `render()` function to mount a component:

```
[jsx]
function Counter() {
  const [n, setN] = React.useState(0);
  return <button onClick={() => setN(n + 1)} className="p-2 bg-blue-500 text-white rounded">Clicked {n} times</button>;
}
render(<Counter />);
[/jsx]
```

JSX blocks can also have Hide/Show, Enlarge, and Run controls like Python blocks. Add `hidden` to start collapsed.

## User interface

- **Settings panel** — press Escape to open (Escape follows a priority chain: close open overlays → close search → close settings panel → exit focus mode → open settings). Adjust font size (small/medium/large), content width (500–1400px slider), theme, and sidebar visibility
- **Theme picker** — click the theme name in settings to browse all 8 themes with live previews (Light, Dark, Solarized, Nord, Dracula, Monokai, Gruvbox, Catppuccin). Or press `t`/`T` to cycle themes directly
- **In-page search** — press `s` to search. Matches are highlighted and counted (e.g. "3/12"). Navigate with Enter/Shift+Enter or arrow buttons
- **Table of contents** — auto-generated from headings in the right sidebar. Sections are collapsible. The current section highlights as you scroll (scroll spy). Heading IDs are generated from the text (e.g. `## My Section` → `#my-section`)
- **Context menu** — right-click in the content area for quick access to Search and Settings
- **Code block controls** — every executable block has Hide/Show (collapse the code), Enlarge (full-screen modal with synced output), and Run buttons
- **Focus mode** — press `f` to hide both sidebars for distraction-free reading
- **Resizable sidebars** — drag the edge of the nav or TOC sidebar to resize. Widths persist across page loads
- **Image lightbox** — click any image to view it enlarged. Press Escape to close
- **Resource browser** — sidebar tabs for images, files, and scripts from `.readrun/`. Only works in View mode (dev server); static builds show empty tabs
- **Enter folder** — right-click any folder in the nav sidebar to zoom into it. A breadcrumb bar appears at the top; click any crumb to navigate back up

## Keyboard shortcuts

Press `?` on any page to view the full shortcut list. Chord bindings like
`g h` (go home) and `g g` (scroll to top) require pressing both keys within
one second.

| Action | Default | Description |
|--------|---------|-------------|
| Search | `s` | Open in-page search |
| Close / Settings | `Escape` | Close overlays → search → settings panel → focus mode → open settings |
| Show shortcuts | `?` | Open keyboard shortcuts overlay |
| Next page | `j` | Navigate to next page |
| Previous page | `k` | Navigate to previous page |
| Go home | `g h` | Go to first page |
| Scroll down | `Space` | Scroll down one screen |
| Scroll up | `Shift+Space` | Scroll up one screen |
| Scroll to top | `g g` | Jump to top of page |
| Scroll to bottom | `G` | Jump to bottom of page |
| Toggle sidebar | `b` | Show/hide nav sidebar |
| Focus mode | `f` | Hide both sidebars |
| Next theme | `t` | Cycle to next theme |
| Previous theme | `T` | Cycle to previous theme |
| Increase font | `=` | Increase font size |
| Decrease font | `-` | Decrease font size |

See [limitations](../project/limitations.md) for known constraints.
