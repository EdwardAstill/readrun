# Limitations

## Python

- Browser execution uses Pyodide/WebAssembly. Initial startup and large
  scientific packages are slower than native Python.
- Packages must be pure Python or have a compatible Pyodide build; native-only
  extensions and system services are unavailable.
- The virtual filesystem is temporary and resets with the page. Generated files
  must be downloaded if they need to persist.
- Blocks on one page share a Python session. Reloading the page resets that
  state.
- Automatic dependency detection scans static `import` statements. Dynamic
  imports may require an explicit `micropip.install()` call.
- Matplotlib uses a non-interactive backend and displays figures after
  `plt.show()`.

## Browser content

- JSX blocks execute in the page. Only serve or publish content you trust.
- Large datasets, models, and computations are constrained by browser memory
  and can make a page unresponsive.
- Responsive navigation is supported, but wide tables and interactive diagrams
  may still be easier to use on a larger screen.

## Content and builds

- `rr validate` checks wikilinks, navigation, block syntax, and asset refs, but
  does not yet validate ordinary Markdown links.
- Hidden files and common generated directories are excluded from authored
  content. Project assets must live under `.readrun/assets/`.
- Static builds regenerate the complete site; there is no incremental build
  cache.
- Hosted password protection is currently Vercel-only. Local serving, plain
  static output, GitHub Pages, and Netlify output are not password-gated.
- Bun is the supported runtime; Node.js is not a supported substitute for the
  CLI.
