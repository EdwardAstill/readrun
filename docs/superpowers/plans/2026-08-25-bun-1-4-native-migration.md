# Bun 1.4 Native Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin readrun to Bun 1.4.0 and replace the Markdown and widget infrastructure with the smallest Bun-native implementations while preserving the explicitly retained readrun behavior.

**Architecture:** `Bun.markdown.html` produces trusted-author HTML and one fragment-scoped `HTMLRewriter` applies TOC, wiki-link, local-link, and inline-fragment behavior. KaTeX auto-render handles dollar-delimited math in the page lifecycle, while `Bun.build` bundles named-export widgets from an in-memory entry and the existing `Bun.file` routes are protected by a byte-range integration test.

**Tech Stack:** Bun 1.4.0, TypeScript, React 19, Bun test, Bun.markdown, HTMLRewriter, Bun.build, Bun.file, KaTeX, happy-dom.

**Spec:** `docs/superpowers/specs/2026-08-25-bun-1-4-native-migration-design.md`

## Global Constraints

- Every root or generated package manager declaration is exactly `bun@1.4.0`.
- Root workflows use `oven-sh/setup-bun@v2`; generated workflows use `oven-sh/setup-bun@v2` with Bun `1.4.0` explicitly selected.
- Use Bun APIs and Bun commands; do not introduce Node-only build or test runners.
- Markdown remains trusted-author HTML and is not sanitized.
- Retain dollar-delimited `$...$` and `$$...$$` math only; remove support claims for `\\(...\\)` and `\\[...\\]`.
- Content widgets must export the PascalCase filename-derived component as a named export.
- Do not replace the `yaml` dependency or alter CSV viewer behavior.
- Keep changes surgical and delete only infrastructure made obsolete by this migration.

---

### Task 1: Pin the Bun 1.4 runtime and generated deployment output

**Files:**
- Modify: `package.json`
- Modify: `src/infrastructure/deploy/deploy-setup.test.ts`
- Modify: `src/infrastructure/deploy/deploy-setup.ts`

**Interfaces:**
- Consumes: existing generated-site package and workflow writers in `deploy-setup.ts`.
- Produces: root `packageManager: "bun@1.4.0"`, parallel default tests, and generated files containing Bun 1.4.0 with setup-bun v2.

- [ ] **Step 1: Change deployment expectations first**

Update the existing generated package assertion and add workflow assertions beside it:

```ts
expect(sitePackage.packageManager).toBe("bun@1.4.0");

const workflow = await Bun.file(
  path.join(root, ".github", "workflows", "deploy.yml"),
).text();
expect(workflow).toContain("oven-sh/setup-bun@v2");
expect(workflow).toContain("bun-version: 1.4.0");
expect(workflow).not.toContain("setup-bun@v1");
```

- [ ] **Step 2: Run the focused test and observe the old version failure**

Run: `bun test src/infrastructure/deploy/deploy-setup.test.ts`

Expected: FAIL because generated output still contains `bun@1.3.14` and `setup-bun@v1`.

- [ ] **Step 3: Apply the minimal version/config changes**

Set the root fields to:

```json
"packageManager": "bun@1.4.0",
"test": "bun test ./src --parallel"
```

Set the generated package field and workflow stanza to:

```ts
packageManager: "bun@1.4.0",
```

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: 1.4.0
```

- [ ] **Step 4: Re-run the deployment test**

Run: `bun test src/infrastructure/deploy/deploy-setup.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the runtime baseline**

```bash
git add package.json src/infrastructure/deploy/deploy-setup.ts src/infrastructure/deploy/deploy-setup.test.ts
git commit -m "build: pin Bun 1.4 runtime"
```

### Task 2: Replace Markdown-it with Bun.markdown and HTMLRewriter

**Files:**
- Modify: `src/presentation/markdown/markdownEngine.test.ts`
- Modify: `src/presentation/markdown/renderMarkdown.test.ts`
- Modify: `src/presentation/markdown/markdownEngine.ts`
- Modify: `src/presentation/markdown/renderMarkdown.ts`

**Interfaces:**
- Consumes: `MarkdownRenderEnvironment`, `ResolvedWikilink[]`, and `MarkdownFragmentOptions`.
- Produces: `renderMarkdownFragment(source: string, env: MarkdownRenderEnvironment, options: MarkdownFragmentOptions): string` with no global reset function.

- [ ] **Step 1: Replace engine tests with native-output behavior**

Cover native inline formatting, resolved/unresolved wiki links, raw HTML, local `.md` stripping with query/fragment preservation, Bun heading IDs and TOC collection, and literal math before client mounting:

```ts
test("renders native Markdown and applies readrun link rewrites", () => {
  const env = environment();
  const html = renderMarkdownFragment(
    '**Bold** `code` [[Other|Label]] [[Missing]] [local](guide.md?x=1#part) <mark>raw</mark> $y$.',
    env,
    { mode: "inline", collectHeadings: false },
  );

  expect(html).toContain("<strong>Bold</strong>");
  expect(html).toContain("<code>code</code>");
  expect(html).toContain('<a href="/other">Label</a>');
  expect(html).toContain("<span>Missing</span>");
  expect(html).toContain('href="guide?x=1#part"');
  expect(html).toContain("<mark>raw</mark>");
  expect(html).toContain("$y$");
  expect(html).not.toMatch(/^<p>|<\/p>\n?$/);
});

test("uses Bun heading IDs and collects the page TOC", () => {
  const env = environment();
  const html = renderMarkdownFragment("# Hello, Bun!\n\n## Child", env, {
    mode: "block",
  });

  expect(html).toContain('<h1 id="hello-bun">Hello, Bun!</h1>');
  expect(env.toc).toEqual([
    { id: "hello-bun", label: "Hello, Bun!", level: 1 },
    { id: "child", label: "Child", level: 2 },
  ]);
});
```

Update page-render tests so native tables assert `<table>`, `<thead>`, and `<tbody>` without `rr-table-*`; display fences assert `<pre><code class="language-python">`; math asserts literal dollar source and no `katex` before mounting; quiz content uses dollar delimiters.

- [ ] **Step 2: Run the Markdown tests and observe the old renderer mismatch**

Run: `bun test src/presentation/markdown/markdownEngine.test.ts src/presentation/markdown/renderMarkdown.test.ts`

Expected: FAIL on native table/code output, unresolved wiki-link spans, literal math, and removed reset API expectations.

- [ ] **Step 3: Implement the Bun-native renderer**

Replace the Markdown-it singleton with explicit native options:

```ts
const markdownOptions: Bun.MarkdownOptions = {
  tables: true,
  strikethrough: true,
  tasklists: true,
  autolinks: { url: true, www: true, email: true },
  headings: { ids: true, autolink: false },
  wikiLinks: true,
};
```

Render and rewrite in one fragment-scoped call:

```ts
export function renderMarkdownFragment(
  source: string,
  env: MarkdownRenderEnvironment,
  options: MarkdownFragmentOptions,
): string {
  const collectHeadings = options.collectHeadings ?? env.collectHeadings;
  const rewriter = createMarkdownRewriter(env, collectHeadings, options.mode);
  return rewriter.transform(Bun.markdown.html(source, markdownOptions));
}
```

`createMarkdownRewriter` must register handlers that:

```ts
for (let level = 1; level <= 6; level += 1) {
  let label = "";
  rewriter.on(`h${level}`, {
    element(element) {
      label = "";
      const id = element.getAttribute("id") ?? "";
      element.onEndTag(() => {
        const text = label.trim();
        if (collectHeadings && id && text) env.toc.push({ id, label: text, level });
      });
    },
    text(text) {
      label += text.text;
    },
  });
}
```

For `x-wikilink`, use its `data-target` with the existing case-insensitive matcher, set resolved elements to `a[href]`, and set unresolved elements to `span`; remove `data-target` in both cases. For local `a[href]`, use `href.replace(/\.md(?=$|[?#])/, "")` only when the value has no URI scheme and does not start with `//`. In inline mode, register `p` with `element.removeAndKeepContent()`.

Remove `resetMarkdownEngineState` and its call from `renderMarkdown.ts`.

- [ ] **Step 4: Run the focused Markdown tests**

Run: `bun test src/presentation/markdown/markdownEngine.test.ts src/presentation/markdown/renderMarkdown.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit native Markdown rendering**

```bash
git add src/presentation/markdown/markdownEngine.ts src/presentation/markdown/markdownEngine.test.ts src/presentation/markdown/renderMarkdown.ts src/presentation/markdown/renderMarkdown.test.ts
git commit -m "feat: render Markdown with Bun"
```

### Task 3: Remove display-code highlighting and interactive Markdown tables

**Files:**
- Delete: `src/presentation/markdown/latexDelimiters.ts`
- Delete: `src/presentation/markdown/table.ts`
- Delete: `src/presentation/client/table-interactive.ts`
- Delete: `src/presentation/client/table-interactive.test.ts`
- Modify: `src/presentation/markdown/components/CodeBlock.tsx`
- Modify: `src/presentation/markdown/components/CodePanel.tsx`
- Modify: `src/presentation/client/main.tsx`
- Modify: `src/presentation/styles/markdown.ts`
- Modify: `src/presentation/styles/responsive-styles.test.ts`
- Modify: `src/presentation/styles/tokens.ts`
- Modify: `src/presentation/styles/themes.ts`
- Modify: `src/presentation/styles/theme/theme.test.ts`

**Interfaces:**
- Consumes: executable blocks that still render `CodeBlock`/`CodePanel` from readrun block handling.
- Produces: code components accepting plain `code` and optional `language`, native Markdown tables with horizontal overflow, and themes without `hljs` palettes.

- [ ] **Step 1: Change focused component and style expectations**

Remove all `highlightedHtml` test inputs/assertions. Replace responsive table expectations with assertions for the base native rule:

```ts
expect(markdownStyles).toContain(".readrun-main table {");
expect(markdownStyles).toContain("display: block;");
expect(markdownStyles).toContain("overflow-x: auto;");
expect(markdownStyles).not.toContain("rr-table-wrap");
expect(markdownStyles).not.toContain("rr-table-slider");
```

Update theme tests to assert no emitted `.hljs` selector and no `hljsPalette` export.

- [ ] **Step 2: Run focused tests and observe stale behavior**

Run: `bun test src/presentation/control-migrations.test.tsx src/presentation/styles/responsive-styles.test.ts src/presentation/styles/theme/theme.test.ts`

Expected: FAIL while old highlighted HTML, table wrapper CSS, and highlight palettes remain.

- [ ] **Step 3: Delete the obsolete paths and simplify props/styles**

Make the code panel body always escape/render the source as text:

```tsx
<pre className="code-panel-pre">
  <code className={language ? `language-${language}` : undefined}>{code}</code>
</pre>
```

Remove `highlightedHtml` from both prop interfaces and all calls. Remove `initInteractiveTables` from `main.tsx`. Delete the `rr-table-*` CSS block and retain one native table rule with `display: block; max-width: 100%; overflow-x: auto;`. Remove `HljsColors`, per-theme `syntax` objects, `hljsPalette`, and highlight selector generation while leaving unrelated theme tokens intact.

- [ ] **Step 4: Run focused and presentation tests**

Run: `bun test src/presentation/control-migrations.test.tsx src/presentation/styles/responsive-styles.test.ts src/presentation/styles/theme/theme.test.ts src/presentation/markdown`

Expected: PASS.

- [ ] **Step 5: Commit the presentation simplification**

```bash
git add -A src/presentation
git commit -m "refactor: simplify Markdown presentation"
```

### Task 4: Add lifecycle-mounted KaTeX auto-render

**Files:**
- Create: `src/presentation/client/math.ts`
- Create: `src/presentation/client/math.test.ts`
- Modify: `src/presentation/client/main.tsx`
- Modify: `src/presentation/shell/Document.tsx`

**Interfaces:**
- Consumes: page lifecycle `ClientFeature.mount(): void | (() => void)` and KaTeX's `renderMathInElement`.
- Produces: `renderPageMath(root?: HTMLElement): void`, registered as the page-scoped `math` feature.

- [ ] **Step 1: Write the failing happy-dom math test**

```ts
import { afterEach, expect, test } from "bun:test";
import { installHappyDom } from "../../test/happy-dom.ts";
import { renderPageMath } from "./math.ts";

const dom = installHappyDom();
afterEach(() => {
  document.body.replaceChildren();
});

test("renders dollar math and leaves code untouched", () => {
  document.body.innerHTML = '<main><p>$x^2$</p><pre><code>$y$</code></pre></main>';
  renderPageMath(document.body);
  expect(document.querySelector(".katex")).not.toBeNull();
  expect(document.querySelector("code")?.textContent).toBe("$y$");
});

void dom;
```

- [ ] **Step 2: Run the test and observe the missing module**

Run: `bun test src/presentation/client/math.test.ts`

Expected: FAIL because `math.ts` does not exist.

- [ ] **Step 3: Implement and register auto-render**

```ts
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";

export function renderPageMath(root: HTMLElement = document.body): void {
  renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
    throwOnError: false,
  });
}
```

Import `renderPageMath` in `main.tsx` and register `pageFeature("math", renderPageMath)` after page islands. Remove the external KaTeX stylesheet URL and `<link>` from `Document.tsx` because the client bundle now owns the installed stylesheet.

- [ ] **Step 4: Run math and lifecycle tests**

Run: `bun test src/presentation/client/math.test.ts src/presentation/client/lifecycle.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit client math rendering**

```bash
git add src/presentation/client/math.ts src/presentation/client/math.test.ts src/presentation/client/main.tsx src/presentation/shell/Document.tsx
git commit -m "feat: render math in the browser"
```

### Task 5: Replace esbuild and the AST export scanner with Bun.build

**Files:**
- Modify: `src/widgets/bundler.test.ts`
- Modify: `src/widgets/bundler.ts`

**Interfaces:**
- Consumes: `bundleWidget(name: string, opts: BundleWidgetOpts): Promise<string>`, source file `<widgetsDir>/<name>.tsx`, and toolkit root.
- Produces: browser ESM source built by `Bun.build`, using a named PascalCase component and the existing render sentinel/banner.

- [ ] **Step 1: Rewrite widget tests around the supported named-export contract**

Create an isolated temporary widget directory with `fs.mkdtempSync(path.join(tmpdir(), "readrun-widgets-"))`. Write:

```tsx
// foo-bar.tsx
import React from "react";
export function FooBar() {
  return <div>hello {React.version}</div>;
}
```

Keep a named-const success case. Change default-only and mismatched component fixtures to rejected builds:

```ts
await expect(bundleWidget("default-ref", options)).rejects.toThrow(/DefaultRef/);
await expect(bundleWidget("wrong-name", options)).rejects.toThrow(/WrongName/);
```

Remove every `resolveWidgetExport` unit test and import.

- [ ] **Step 2: Run the widget test and observe obsolete compatibility**

Run: `bun test src/widgets/bundler.test.ts`

Expected: FAIL because the old bundler still accepts default exports and exports `resolveWidgetExport`.

- [ ] **Step 3: Implement the Bun build path**

Use an in-memory entry beside the real file:

```ts
const entryPath = path.join(widgetsDir, `${name}.readrun-entry.tsx`);
const entrySource = `import { ${pascalName} } from ${JSON.stringify(sourcePath)};\n${RENDER_SENTINEL}(<${pascalName} />);\n`;
const result = await Bun.build({
  entrypoints: [entryPath],
  files: { [entryPath]: entrySource },
  format: "esm",
  target: "browser",
  jsx: { runtime: "classic", factory: "React.createElement", fragment: "React.Fragment" },
  plugins: [reactGlobalsPlugin, readrunWidgetsPlugin(toolkitRoot)],
  throw: false,
});
```

Type both plugins as `BunPlugin`. If `result.success` is false, throw a widget-context error containing `result.logs.map(String).join("\n")`. Read the sole artifact with `await result.outputs[0]!.text()`, replace the sentinel call with `render(<PascalName />);`, and prepend `buildBanner`. Delete TypeScript AST parsing, export resolution types/functions, default-import entry generation, and the direct esbuild import.

- [ ] **Step 4: Run widget tests and typecheck**

Run: `bun test src/widgets/bundler.test.ts && bun run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the native widget bundler**

```bash
git add src/widgets/bundler.ts src/widgets/bundler.test.ts
git commit -m "refactor: bundle widgets with Bun"
```

### Task 6: Protect Bun.file byte-range serving

**Files:**
- Modify: `src/infrastructure/runtime/server.test.ts`

**Interfaces:**
- Consumes: existing `startServer` helper and asset route returning `new Response(Bun.file(filePath))`.
- Produces: regression coverage for HTTP `Range` responses; no production route change.

- [ ] **Step 1: Add a range request to the runtime asset test**

Create a fixture asset containing `0123456789`, start the server with the existing test helper, and assert:

```ts
const response = await fetch(`${handle.url}/_readrun/assets/files/range.txt`, {
  headers: { Range: "bytes=2-5" },
});
expect(response.status).toBe(206);
expect(response.headers.get("content-range")).toBe("bytes 2-5/10");
expect(await response.text()).toBe("2345");
```

- [ ] **Step 2: Run the focused server test**

Run: `bun test src/infrastructure/runtime/server.test.ts`

Expected: PASS under Bun 1.4.0, proving the existing route already uses native range serving. If it fails, inspect the exact request URL against the snapshot's generated asset route and correct only the fixture URL.

- [ ] **Step 3: Commit the range regression test**

```bash
git add src/infrastructure/runtime/server.test.ts
git commit -m "test: cover Bun file range responses"
```

### Task 7: Remove dependencies, refresh docs, and verify the migration

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `AGENTS.md`
- Modify: `docs/authoring/math.md`
- Modify: `docs/authoring/quiz-format.md`
- Modify: `docs/authoring/tables.md`
- Modify: `docs/start/philosophy.md`
- Modify: any other tracked Markdown file found by the exact stale-feature searches below

**Interfaces:**
- Consumes: all native implementations from Tasks 1-6.
- Produces: a Bun 1.4 lockfile, direct KaTeX dependency/types, no obsolete renderer/bundler packages, and user documentation matching runtime behavior.

- [ ] **Step 1: Update direct dependencies with Bun**

Run:

```bash
bun remove markdown-it @types/markdown-it @vscode/markdown-it-katex highlight.js esbuild
bun add katex
bun add --dev @types/katex @types/bun@^1.4.0
```

Expected: `package.json` has no removed dependency names, `katex` is direct, `@types/katex` is development-only, `@types/bun` is on the 1.4 line, and `bun.lock` is regenerated by Bun 1.4.0.

- [ ] **Step 2: Update documentation to the reduced contracts**

Change `AGENTS.md` to say the widget bundler resolves `@readrun/widgets/*` through a Bun build plugin. Document only `$...$` and `$$...$$` in math and quiz authoring pages. Rewrite the table page to describe standard GFM tables and horizontal scrolling without toolbar/slider/sticky controls. Remove the syntax-highlighting promise from philosophy copy while retaining runnable-code documentation.

- [ ] **Step 3: Search for stale implementation and documentation references**

Run:

```bash
rg -n "markdown-it|markdownIt|highlight\.js|hljs|from [\"']esbuild|setup-bun@v1|bun@1\.3\.14|rr-table-|initInteractiveTables|resolveWidgetExport|highlightedHtml" package.json bun.lock AGENTS.md src docs .github
rg -n -F '\\(' docs README.md
rg -n -F '\\[' docs README.md
```

Expected: no obsolete code/dependency/version hits; delimiter hits remain only where the text explicitly explains those forms are unsupported, if such a warning is retained.

- [ ] **Step 4: Run focused and full verification**

Run each command separately and require exit code 0:

```bash
bun --version
bun run typecheck
bun test ./src --parallel
bun run validate:docs
bun run build:docs
bun run check
git diff --check
git status --short
```

Expected: Bun prints `1.4.0`; all checks pass; `git diff --check` is silent; status contains only the intended migration changes and generated `dist/` remains ignored.

- [ ] **Step 5: Commit the dependency and documentation cleanup**

```bash
git add package.json bun.lock AGENTS.md docs
git commit -m "docs: align readrun with Bun native paths"
```

- [ ] **Step 6: Review the complete branch diff**

Run:

```bash
git diff --stat 4804b84..HEAD
git diff --check 4804b84..HEAD
git log --oneline 4804b84..HEAD
```

Expected: the diff implements every success criterion from the spec, contains no whitespace errors, and is split into the focused commits above.
