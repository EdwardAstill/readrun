export function htmlPage(nav: string, content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - explainr</title>
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --sidebar-width: 260px;
      --color-bg: #ffffff;
      --color-sidebar-bg: #f6f8fa;
      --color-border: #d0d7de;
      --color-text: #1f2328;
      --color-text-muted: #656d76;
      --color-link: #0969da;
      --color-active-bg: #ddf4ff;
      --color-code-bg: #f6f8fa;
      --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    }

    body {
      font-family: var(--font-body);
      font-size: 16px;
      line-height: 1.5;
      color: var(--color-text);
      background: var(--color-bg);
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      min-width: var(--sidebar-width);
      border-right: 1px solid var(--color-border);
      background: var(--color-sidebar-bg);
      padding: 16px 0;
      overflow-y: auto;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .sidebar-title {
      font-size: 14px;
      font-weight: 600;
      padding: 0 16px 12px;
      color: var(--color-text);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 8px;
    }

    .sidebar-nav ul {
      list-style: none;
      padding-left: 0;
    }

    .sidebar-nav > ul > li > ul {
      padding-left: 0;
    }

    .sidebar-nav ul ul {
      padding-left: 12px;
    }

    .sidebar-nav li {
      margin: 0;
    }

    .sidebar-nav a {
      display: block;
      padding: 4px 16px;
      color: var(--color-text);
      text-decoration: none;
      font-size: 14px;
      border-radius: 6px;
      margin: 1px 8px;
    }

    .sidebar-nav a:hover {
      background: var(--color-border);
    }

    .sidebar-nav .active > a {
      background: var(--color-active-bg);
      color: var(--color-link);
      font-weight: 500;
    }

    .sidebar-nav details > summary {
      padding: 4px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      list-style: none;
      margin: 1px 8px;
      border-radius: 6px;
      color: var(--color-text);
    }

    .sidebar-nav details > summary:hover {
      background: var(--color-border);
    }

    .sidebar-nav details > summary::before {
      content: "\\25B6";
      font-size: 10px;
      margin-right: 6px;
      display: inline-block;
      transition: transform 0.15s;
    }

    .sidebar-nav details[open] > summary::before {
      transform: rotate(90deg);
    }

    /* Main content */
    .main {
      flex: 1;
      min-width: 0;
      max-width: 880px;
      margin: 0 auto;
      padding: 32px 40px;
    }

    /* GitHub Markdown styles */
    .markdown-body h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; margin-top: 24px; }
    .markdown-body h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; margin-top: 24px; }
    .markdown-body h3 { font-size: 1.25em; margin-bottom: 16px; margin-top: 24px; }
    .markdown-body h4 { font-size: 1em; margin-bottom: 16px; margin-top: 24px; }

    .markdown-body p { margin-bottom: 16px; }
    .markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 16px; }
    .markdown-body li + li { margin-top: 4px; }
    .markdown-body blockquote {
      padding: 0 1em;
      color: var(--color-text-muted);
      border-left: 3px solid var(--color-border);
      margin-bottom: 16px;
    }

    .markdown-body a { color: var(--color-link); text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }

    .markdown-body code {
      background: var(--color-code-bg);
      padding: 0.2em 0.4em;
      border-radius: 6px;
      font-size: 85%;
      font-family: var(--font-mono);
    }

    .markdown-body pre {
      background: var(--color-code-bg);
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 16px;
      line-height: 1.45;
    }

    .markdown-body pre code {
      background: none;
      padding: 0;
      font-size: 85%;
    }

    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }

    .markdown-body th, .markdown-body td {
      border: 1px solid var(--color-border);
      padding: 6px 13px;
    }

    .markdown-body th {
      background: var(--color-sidebar-bg);
      font-weight: 600;
    }

    .markdown-body img {
      max-width: 100%;
    }

    .markdown-body hr {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 24px 0;
    }

    /* Executable code blocks */
    .exec-block {
      border: 1px solid var(--color-border);
      border-radius: 6px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .exec-block-header {
      background: var(--color-sidebar-bg);
      padding: 4px 12px;
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .exec-run-btn {
      background: #2da44e;
      color: #fff;
      border: none;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--font-body);
      cursor: pointer;
      font-weight: 500;
    }

    .exec-run-btn:hover {
      background: #218838;
    }

    .exec-run-btn:disabled {
      background: var(--color-text-muted);
      cursor: not-allowed;
    }

    .exec-output {
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .exec-output:not(:empty) {
      padding: 12px 16px;
      border-top: 1px solid var(--color-border);
      background: #fff;
    }

    .exec-output .exec-stdout {
      color: var(--color-text);
    }

    .exec-output .exec-stderr {
      color: #cf222e;
    }

    .exec-loading {
      color: var(--color-text-muted);
      font-style: italic;
    }

    .exec-block pre {
      margin: 0;
      border-radius: 0;
    }

    /* highlight.js GitHub theme */
    .hljs { background: var(--color-code-bg); color: var(--color-text); }
    .hljs-comment, .hljs-quote { color: #6e7781; }
    .hljs-keyword, .hljs-selector-tag, .hljs-type { color: #cf222e; }
    .hljs-string, .hljs-addition { color: #0a3069; }
    .hljs-number, .hljs-literal { color: #0550ae; }
    .hljs-built_in { color: #8250df; }
    .hljs-title, .hljs-section { color: #8250df; }
    .hljs-attr, .hljs-attribute { color: #0550ae; }
    .hljs-name, .hljs-tag { color: #116329; }
    .hljs-deletion { color: #82071e; background: #ffebe9; }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-title">explainr</div>
    ${nav}
  </aside>
  <main class="main">
    <article class="markdown-body">
      ${content}
    </article>
  </main>
  <script type="module">
    let pyodide = null;
    let pyodideLoading = null;

    async function loadPyodideRuntime() {
      if (pyodide) return pyodide;
      if (pyodideLoading) return pyodideLoading;
      pyodideLoading = (async () => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
        pyodide = await globalThis.loadPyodide();
        return pyodide;
      })();
      return pyodideLoading;
    }

    document.addEventListener("click", async (e) => {
      const btn = e.target.closest(".exec-run-btn");
      if (!btn) return;

      const blockId = btn.dataset.blockId;
      const sourceEl = document.querySelector(\`script[data-source="\${blockId}"]\`);
      const outputEl = document.querySelector(\`[data-output="\${blockId}"]\`);
      if (!sourceEl || !outputEl) return;

      const code = atob(sourceEl.textContent);

      btn.disabled = true;
      btn.textContent = pyodide ? "Running..." : "Loading Python...";
      outputEl.innerHTML = "";

      try {
        const py = await loadPyodideRuntime();
        btn.textContent = "Running...";

        // Capture stdout and stderr
        py.runPython(\`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
\`);

        try {
          const result = py.runPython(code);
          const stdout = py.runPython("sys.stdout.getvalue()");
          const stderr = py.runPython("sys.stderr.getvalue()");

          let html = "";
          if (stdout) html += \`<span class="exec-stdout">\${escapeHtml(stdout)}</span>\`;
          if (stderr) html += \`<span class="exec-stderr">\${escapeHtml(stderr)}</span>\`;
          if (result !== undefined && result !== null && !stdout && !stderr) {
            html += \`<span class="exec-stdout">\${escapeHtml(String(result))}</span>\`;
          }
          outputEl.innerHTML = html || \`<span class="exec-stdout" style="color: var(--color-text-muted)">(no output)</span>\`;
        } catch (pyErr) {
          const stderr = py.runPython("sys.stderr.getvalue()");
          outputEl.innerHTML = \`<span class="exec-stderr">\${escapeHtml(stderr || pyErr.message)}</span>\`;
        } finally {
          // Reset stdout/stderr
          py.runPython(\`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
\`);
        }
      } catch (loadErr) {
        outputEl.innerHTML = \`<span class="exec-stderr">Failed to load Python: \${escapeHtml(loadErr.message)}</span>\`;
      }

      btn.disabled = false;
      btn.textContent = "Run";
    });

    function escapeHtml(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }
  </script>
</body>
</html>`;
}
