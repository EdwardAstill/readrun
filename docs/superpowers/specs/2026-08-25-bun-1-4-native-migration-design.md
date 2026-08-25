# Bun 1.4 Native Migration Design

**Status:** Approved in chat on 2026-08-25

## Purpose

Make Bun 1.4.0 the reproducible runtime baseline and replace custom or
third-party infrastructure with Bun-native APIs where that materially reduces
source code. The migration favors the smallest implementation over exact HTML
compatibility with the current Markdown and widget pipelines.

## Goals

- Pin Bun 1.4.0 consistently in the repository and generated deployment
  projects.
- Render Markdown with `Bun.markdown`.
- Use `HTMLRewriter` only for readrun-specific navigation and TOC behavior.
- Bundle content widgets with `Bun.build` and its in-memory `files` input.
- Let `Bun.file` responses provide Bun 1.4 range and conditional file serving.
- Run the test suite with Bun 1.4's parallel test execution.
- Delete source, browser behavior, styles, tests, and dependencies made obsolete
  by the native paths.

## Non-goals

- Preserve byte-for-byte Markdown HTML.
- Preserve the custom Markdown table toolbar, column-width slider, sticky first
  column, or content-measurement algorithm.
- Preserve server-side syntax highlighting or display-code copy/enlarge panels.
- Preserve default-export compatibility for content widgets.
- Adopt unrelated Bun APIs such as `Bun.Image`, `Bun.WebView`, `Bun.cron`, SQL,
  Redis, terminal APIs, React Compiler, or compiled executables.
- Replace the `yaml` dependency; navigation diagnostics still require its CST
  and source-position support.

## Runtime baseline

The root `package.json` and every generated site `package.json` will declare:

```json
"packageManager": "bun@1.4.0"
```

The root workflows will continue using `oven-sh/setup-bun@v2` with the root
package file as their version source. Generated GitHub Pages workflows will use
`oven-sh/setup-bun@v2` and explicitly install Bun 1.4.0. `@types/bun` will move
to the Bun 1.4 type line, and `bun.lock` will be regenerated with Bun 1.4.0.

## Markdown rendering

### Native rendering path

`renderMarkdownFragment` remains the single Markdown entry point. It will call
`Bun.markdown.html()` with these explicit options:

- GFM tables, strikethrough, and task lists enabled;
- URL, `www`, and email autolinks enabled;
- heading IDs enabled without heading autolinks;
- wiki links enabled;
- trusted-author raw HTML left enabled.

Raw HTML remains unsanitized, matching readrun's existing trusted-author
policy. Content from untrusted users must not be passed to this renderer.

The native HTML then passes through one synchronous `HTMLRewriter` instance per
fragment. Its handlers will:

1. collect `h1` through `h6` IDs and text into the existing TOC environment when
   heading collection is enabled;
2. change a resolved `<x-wikilink data-target="...">` into an anchor using the
   resolved readrun URL;
3. change an unresolved wiki-link element into a neutral span while preserving
   its visible label;
4. remove a terminal `.md` suffix from local anchor URLs while preserving query
   strings and fragments;
5. remove the outer paragraph element in inline-fragment mode.

Heading slugging and duplicate suffixes become Bun's behavior. The old global
table counter and `resetMarkdownEngineState` disappear because rendering becomes
stateless.

### Math

Bun 1.4.0 accepts a `latexMath` parser option but does not emit rendered math in
the shipped runtime. Dollar-delimited math remains supported through KaTeX's
small browser auto-render integration:

- `$...$` for inline math;
- `$$...$$` for display math.

The client imports KaTeX and its stylesheet from the installed package and runs
auto-render as a page lifecycle feature after initial load and client-side
navigation. KaTeX's standard ignored tags keep code, `pre`, scripts, and text
inputs untouched. Rendering errors leave the original source visible.

The `\(...\)` and `\[...\]` forms are removed because Bun's Markdown parser
consumes those backslashes as Markdown escapes before client rendering. Demo and
reference content will use dollar delimiters.

### Code fences

Fenced code uses Bun's native `<pre><code class="language-*">` output. The
Markdown path no longer runs `highlight.js` or wraps display-only fences in a
React `CodeBlock`. Executable readrun blocks retain their existing controls and
execution behavior.

The `highlightedHtml` escape hatch will be removed from `CodeBlock` and
`CodePanel` because no remaining caller supplies highlighted markup. The
highlight.js-only theme palettes and generated selectors will also be removed.

### Tables

Markdown tables use Bun's native GFM table HTML. Existing base table styling is
retained and simplified to provide horizontal overflow for wide tables. The
custom token processor, table counter, table toolbar markup, table-sizing
client feature, React slider mount, sticky-column behavior, specialized CSS,
and their focused tests are removed.

CSV viewer tables are a separate feature and remain unchanged.

## Widget bundling

Content widgets continue to live in `<content>/.readrun/widgets/*.tsx`, import
the in-repo toolkit through `@readrun/widgets`, and emit JSX payloads under
`<content>/.readrun/.widgets-out`.

`bundleWidget` will create an in-memory entry file beside the real widget. The
entry imports the documented named component whose PascalCase name is derived
from the kebab-case filename and calls the existing render sentinel. `Bun.build`
will bundle that entry for the browser as ESM and return its artifact in memory.
The sentinel is replaced with the JSX runtime's final `render(<Name />)` call,
and the existing generated-file banner is prepended.

Two small Bun bundler plugins remain necessary:

- map React imports to the `globalThis.React` and `globalThis.ReactDOM` objects
  supplied by readrun's JSX runtime;
- resolve `@readrun/widgets` and its documented subpaths to `src/widgets`.

The plugins use Bun's `BunPlugin` interface. Build failures and missing named
exports surface Bun's build diagnostics with widget context. The TypeScript AST
export scanner and its default-export/alias compatibility paths are deleted.
The supported contract is the one already documented:

```tsx
export function MyWidget() {
  return <div />;
}
```

Repository file access and the banner's Git lookup will use Bun APIs where they
reduce code. `node:path` remains appropriate for portable path manipulation.

## File serving

Asset and Pyodide data routes already return `new Response(Bun.file(path))`.
That is the Bun 1.4 sendfile path, so no wrapper or new abstraction is added.
An integration test will request a byte range from a served asset and assert a
`206` response, the correct `Content-Range`, and the requested body bytes.

## Test execution

The package test script becomes:

```json
"test": "bun test ./src --parallel"
```

Tests that use shared fixed temporary directories will be changed to isolated
temporary paths only if the parallel run exposes a collision. Test commands,
CI, and the repository check script continue to enter through `bun run test`.

Behavior changes are developed test-first:

- Markdown tests first describe native headings, wiki links, plain GFM tables,
  raw HTML, inline fragments, and literal dollar math before client mounting.
- A client math test proves dollar-delimited expressions become KaTeX while
  code remains untouched.
- Widget integration tests first require a Bun-built named export and reject a
  default-only or mismatched export.
- The runtime server test first requires Bun's range response behavior.
- Deployment tests first require Bun 1.4.0 and setup-bun v2 output.

After focused red-green cycles, verification runs the typecheck, parallel full
test suite, strict docs validation, docs build, and the repository's complete
`bun run check` command.

## Dependency and source cleanup

Remove these dependencies because the native paths replace them:

- `markdown-it`;
- `@types/markdown-it`;
- `@vscode/markdown-it-katex`;
- `highlight.js`;
- `esbuild`.

Declare `katex` directly, with its TypeScript declarations if required by the
auto-render subpath. Delete the Markdown-it LaTeX delimiter module, Markdown-it
table module, interactive Markdown table client and test, and obsolete table,
KaTeX-server, and highlight.js-only styles. Remove their imports and lifecycle
registration.

Update `AGENTS.md` and the authoring/reference pages that promise the old widget
bundler, delimiter forms, syntax highlighting, or interactive table sizing.

## Error handling and compatibility

- A Bun Markdown rendering exception propagates to the existing page-rendering
  error boundary; no duplicate fallback layer is added.
- Unknown or unresolved wiki links remain visible but non-navigable.
- Bun build diagnostics are included when widget compilation fails.
- Existing generated widget files retain their banner and overwrite protection.
- Existing default-export-only widgets must switch to a named PascalCase export.
- Existing `\(...\)` and `\[...\]` content must switch to dollar delimiters.
- Existing Markdown table content remains valid but loses interactive sizing.
- Static sites require JavaScript to typeset math; the source remains readable
  before client mounting.

## Success criteria

1. The installed and generated runtime baseline is Bun 1.4.0 with no remaining
   Bun 1.3.14 or setup-bun v1 pins.
2. Markdown pages and quiz fragments render through `Bun.markdown` and retain
   TOCs, resolved wiki navigation, local Markdown links, raw HTML, and GFM.
3. Dollar-delimited math renders after client mounting without touching code.
4. Markdown tables use native GFM output with basic wide-table scrolling and no
   interactive-table JavaScript.
5. Content widgets build through `Bun.build` with the documented named-export
   contract and no direct `esbuild` import or dependency.
6. Served assets satisfy byte-range requests through `Bun.file` responses.
7. The default test script runs in parallel.
8. Typechecking, tests, strict docs validation, docs build, and the complete
   repository check all pass under Bun 1.4.0.
