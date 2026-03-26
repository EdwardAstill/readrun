export const styles = `
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
      display: flex;
      flex-direction: column;
    }

    .sidebar-title {
      font-size: 14px;
      font-weight: 600;
      padding: 0 16px 12px;
      color: var(--color-text);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 8px;
    }

    .sidebar-nav ul { list-style: none; padding-left: 0; }
    .sidebar-nav > ul > li > ul { padding-left: 0; }
    .sidebar-nav ul ul { padding-left: 12px; }
    .sidebar-nav li { margin: 0; }

    .sidebar-nav a {
      display: block;
      padding: 4px 16px;
      color: var(--color-text);
      text-decoration: none;
      font-size: 14px;
      border-radius: 6px;
      margin: 1px 8px;
    }

    .sidebar-nav a:hover { background: var(--color-border); }

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

    .sidebar-nav details > summary:hover { background: var(--color-border); }

    .sidebar-nav details > summary::before {
      content: "\\25B6";
      font-size: 10px;
      margin-right: 6px;
      display: inline-block;
      transition: transform 0.15s;
    }

    .sidebar-nav details[open] > summary::before { transform: rotate(90deg); }

    /* Main content */
    .main {
      flex: 1;
      min-width: 0;
      max-width: 880px;
      margin: 0 auto;
      padding: 32px 40px;
    }

    /* Markdown styles */
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

    .markdown-body pre code { background: none; padding: 0; font-size: 85%; }

    .markdown-body table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    .markdown-body th, .markdown-body td { border: 1px solid var(--color-border); padding: 6px 13px; }
    .markdown-body th { background: var(--color-sidebar-bg); font-weight: 600; }
    .markdown-body img { max-width: 100%; }
    .markdown-body hr { border: none; border-top: 1px solid var(--color-border); margin: 24px 0; }

    /* Executable code blocks */
    .exec-block { border: 1px solid var(--color-border); border-radius: 6px; margin-bottom: 16px; overflow: hidden; }

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
      background: #2da44e; color: #fff; border: none;
      padding: 2px 10px; border-radius: 4px; font-size: 12px;
      font-family: var(--font-body); cursor: pointer; font-weight: 500;
    }
    .exec-run-btn:hover { background: #218838; }
    .exec-run-btn:disabled { background: var(--color-text-muted); cursor: not-allowed; }

    .exec-output { font-family: var(--font-mono); font-size: 13px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
    .exec-output:not(:empty) { padding: 12px 16px; border-top: 1px solid var(--color-border); background: var(--color-bg); }
    .exec-output .exec-stdout { color: var(--color-text); }
    .exec-output .exec-stderr { color: #cf222e; }
    .exec-loading { color: var(--color-text-muted); font-style: italic; }
    .exec-output img { max-width: 100%; margin-top: 8px; border-radius: 4px; }
    .exec-block pre { margin: 0; border-radius: 0; }

    /* Files panel (bottom of sidebar) */
    .files-panel {
      margin-top: auto;
      border-top: 1px solid var(--color-border);
      padding: 8px 0 0;
      position: relative;
    }

    .files-panel__toggle {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 6px 16px;
      background: none; border: none;
      font-size: 14px; font-weight: 500; font-family: var(--font-body);
      color: var(--color-text-muted); cursor: pointer;
      transition: color 0.12s;
    }
    .files-panel__toggle:hover { color: var(--color-text); }
    .files-panel__toggle svg { flex-shrink: 0; }

    .files-panel__dropdown {
      display: none; flex-direction: column;
      padding: 4px 0;
    }
    .files-panel__dropdown.open { display: flex; }

    .files-panel__header { display: none; }

    .files-panel__list {
      max-height: 200px; overflow-y: auto;
      padding: 0 4px;
    }

    .files-panel__item {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 12px; border-radius: 6px; font-size: 13px;
      color: var(--color-text); cursor: default;
    }
    .files-panel__item:hover { background: var(--color-border); }

    .files-panel__item-icon {
      flex-shrink: 0; width: 14px; height: 14px;
      color: var(--color-text-muted);
    }

    .files-panel__item-name {
      flex: 1; min-width: 0; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }

    .files-panel__item-size {
      flex-shrink: 0; font-size: 11px; color: var(--color-text-muted);
      font-family: var(--font-mono);
    }

    .files-panel__empty {
      padding: 8px 16px;
      font-size: 13px; color: var(--color-text-muted);
    }

    .files-panel__add-btn {
      margin: 2px 8px 4px; padding: 4px 12px;
      background: none; border: 1px dashed var(--color-border);
      border-radius: 6px; font-size: 13px; font-family: var(--font-body);
      color: var(--color-text-muted); cursor: pointer; transition: all 0.12s;
      text-align: center;
    }
    .files-panel__add-btn:hover { border-color: var(--color-text-muted); color: var(--color-text); }
    .files-panel__add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Themes */
    [data-theme="dark"] {
      --color-bg: #0d1117; --color-sidebar-bg: #161b22; --color-border: #30363d;
      --color-text: #e6edf3; --color-text-muted: #8b949e; --color-link: #58a6ff;
      --color-active-bg: #1f2a38; --color-code-bg: #161b22;
    }
    [data-theme="solarized"] {
      --color-bg: #fdf6e3; --color-sidebar-bg: #eee8d5; --color-border: #d6ccb1;
      --color-text: #657b83; --color-text-muted: #93a1a1; --color-link: #268bd2;
      --color-active-bg: #e8dfc8; --color-code-bg: #eee8d5;
    }
    [data-theme="nord"] {
      --color-bg: #2e3440; --color-sidebar-bg: #3b4252; --color-border: #434c5e;
      --color-text: #d8dee9; --color-text-muted: #616e88; --color-link: #88c0d0;
      --color-active-bg: #434c5e; --color-code-bg: #3b4252;
    }
    [data-theme="dracula"] {
      --color-bg: #282a36; --color-sidebar-bg: #21222c; --color-border: #44475a;
      --color-text: #f8f8f2; --color-text-muted: #6272a4; --color-link: #8be9fd;
      --color-active-bg: #44475a; --color-code-bg: #21222c;
    }
    [data-theme="monokai"] {
      --color-bg: #272822; --color-sidebar-bg: #1e1f1c; --color-border: #3e3d32;
      --color-text: #f8f8f2; --color-text-muted: #75715e; --color-link: #66d9ef;
      --color-active-bg: #3e3d32; --color-code-bg: #1e1f1c;
    }
    [data-theme="gruvbox"] {
      --color-bg: #282828; --color-sidebar-bg: #3c3836; --color-border: #504945;
      --color-text: #ebdbb2; --color-text-muted: #928374; --color-link: #83a598;
      --color-active-bg: #504945; --color-code-bg: #3c3836;
    }
    [data-theme="catppuccin"] {
      --color-bg: #1e1e2e; --color-sidebar-bg: #181825; --color-border: #313244;
      --color-text: #cdd6f4; --color-text-muted: #6c7086; --color-link: #89b4fa;
      --color-active-bg: #313244; --color-code-bg: #181825;
    }

    /* highlight.js — Light (default) */
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

    /* highlight.js — Dark */
    [data-theme="dark"] .hljs-comment, [data-theme="dark"] .hljs-quote { color: #8b949e; }
    [data-theme="dark"] .hljs-keyword, [data-theme="dark"] .hljs-selector-tag, [data-theme="dark"] .hljs-type { color: #ff7b72; }
    [data-theme="dark"] .hljs-string, [data-theme="dark"] .hljs-addition { color: #a5d6ff; }
    [data-theme="dark"] .hljs-number, [data-theme="dark"] .hljs-literal { color: #79c0ff; }
    [data-theme="dark"] .hljs-built_in { color: #d2a8ff; }
    [data-theme="dark"] .hljs-title, [data-theme="dark"] .hljs-section { color: #d2a8ff; }
    [data-theme="dark"] .hljs-attr, [data-theme="dark"] .hljs-attribute { color: #79c0ff; }
    [data-theme="dark"] .hljs-name, [data-theme="dark"] .hljs-tag { color: #7ee787; }
    [data-theme="dark"] .hljs-deletion { color: #ffa198; background: #490202; }

    /* highlight.js — Solarized */
    [data-theme="solarized"] .hljs-comment, [data-theme="solarized"] .hljs-quote { color: #93a1a1; }
    [data-theme="solarized"] .hljs-keyword, [data-theme="solarized"] .hljs-selector-tag, [data-theme="solarized"] .hljs-type { color: #859900; }
    [data-theme="solarized"] .hljs-string, [data-theme="solarized"] .hljs-addition { color: #2aa198; }
    [data-theme="solarized"] .hljs-number, [data-theme="solarized"] .hljs-literal { color: #d33682; }
    [data-theme="solarized"] .hljs-built_in { color: #b58900; }
    [data-theme="solarized"] .hljs-title, [data-theme="solarized"] .hljs-section { color: #268bd2; }
    [data-theme="solarized"] .hljs-attr, [data-theme="solarized"] .hljs-attribute { color: #b58900; }
    [data-theme="solarized"] .hljs-name, [data-theme="solarized"] .hljs-tag { color: #268bd2; }
    [data-theme="solarized"] .hljs-deletion { color: #dc322f; background: #fdf6e3; }

    /* highlight.js — Nord */
    [data-theme="nord"] .hljs-comment, [data-theme="nord"] .hljs-quote { color: #616e88; }
    [data-theme="nord"] .hljs-keyword, [data-theme="nord"] .hljs-selector-tag, [data-theme="nord"] .hljs-type { color: #81a1c1; }
    [data-theme="nord"] .hljs-string, [data-theme="nord"] .hljs-addition { color: #a3be8c; }
    [data-theme="nord"] .hljs-number, [data-theme="nord"] .hljs-literal { color: #b48ead; }
    [data-theme="nord"] .hljs-built_in { color: #88c0d0; }
    [data-theme="nord"] .hljs-title, [data-theme="nord"] .hljs-section { color: #8fbcbb; }
    [data-theme="nord"] .hljs-attr, [data-theme="nord"] .hljs-attribute { color: #8fbcbb; }
    [data-theme="nord"] .hljs-name, [data-theme="nord"] .hljs-tag { color: #81a1c1; }
    [data-theme="nord"] .hljs-deletion { color: #bf616a; background: #3b4252; }

    /* highlight.js — Dracula */
    [data-theme="dracula"] .hljs-comment, [data-theme="dracula"] .hljs-quote { color: #6272a4; }
    [data-theme="dracula"] .hljs-keyword, [data-theme="dracula"] .hljs-selector-tag, [data-theme="dracula"] .hljs-type { color: #ff79c6; }
    [data-theme="dracula"] .hljs-string, [data-theme="dracula"] .hljs-addition { color: #f1fa8c; }
    [data-theme="dracula"] .hljs-number, [data-theme="dracula"] .hljs-literal { color: #bd93f9; }
    [data-theme="dracula"] .hljs-built_in { color: #50fa7b; }
    [data-theme="dracula"] .hljs-title, [data-theme="dracula"] .hljs-section { color: #50fa7b; }
    [data-theme="dracula"] .hljs-attr, [data-theme="dracula"] .hljs-attribute { color: #50fa7b; }
    [data-theme="dracula"] .hljs-name, [data-theme="dracula"] .hljs-tag { color: #ff79c6; }
    [data-theme="dracula"] .hljs-deletion { color: #ff5555; background: #44475a; }

    /* highlight.js — Monokai */
    [data-theme="monokai"] .hljs-comment, [data-theme="monokai"] .hljs-quote { color: #75715e; }
    [data-theme="monokai"] .hljs-keyword, [data-theme="monokai"] .hljs-selector-tag, [data-theme="monokai"] .hljs-type { color: #f92672; }
    [data-theme="monokai"] .hljs-string, [data-theme="monokai"] .hljs-addition { color: #e6db74; }
    [data-theme="monokai"] .hljs-number, [data-theme="monokai"] .hljs-literal { color: #ae81ff; }
    [data-theme="monokai"] .hljs-built_in { color: #a6e22e; }
    [data-theme="monokai"] .hljs-title, [data-theme="monokai"] .hljs-section { color: #a6e22e; }
    [data-theme="monokai"] .hljs-attr, [data-theme="monokai"] .hljs-attribute { color: #a6e22e; }
    [data-theme="monokai"] .hljs-name, [data-theme="monokai"] .hljs-tag { color: #f92672; }
    [data-theme="monokai"] .hljs-deletion { color: #f92672; background: #3e3d32; }

    /* highlight.js — Gruvbox */
    [data-theme="gruvbox"] .hljs-comment, [data-theme="gruvbox"] .hljs-quote { color: #928374; }
    [data-theme="gruvbox"] .hljs-keyword, [data-theme="gruvbox"] .hljs-selector-tag, [data-theme="gruvbox"] .hljs-type { color: #fb4934; }
    [data-theme="gruvbox"] .hljs-string, [data-theme="gruvbox"] .hljs-addition { color: #b8bb26; }
    [data-theme="gruvbox"] .hljs-number, [data-theme="gruvbox"] .hljs-literal { color: #d3869b; }
    [data-theme="gruvbox"] .hljs-built_in { color: #fabd2f; }
    [data-theme="gruvbox"] .hljs-title, [data-theme="gruvbox"] .hljs-section { color: #83a598; }
    [data-theme="gruvbox"] .hljs-attr, [data-theme="gruvbox"] .hljs-attribute { color: #fabd2f; }
    [data-theme="gruvbox"] .hljs-name, [data-theme="gruvbox"] .hljs-tag { color: #fb4934; }
    [data-theme="gruvbox"] .hljs-deletion { color: #fb4934; background: #3c3836; }

    /* highlight.js — Catppuccin */
    [data-theme="catppuccin"] .hljs-comment, [data-theme="catppuccin"] .hljs-quote { color: #6c7086; }
    [data-theme="catppuccin"] .hljs-keyword, [data-theme="catppuccin"] .hljs-selector-tag, [data-theme="catppuccin"] .hljs-type { color: #cba6f7; }
    [data-theme="catppuccin"] .hljs-string, [data-theme="catppuccin"] .hljs-addition { color: #a6e3a1; }
    [data-theme="catppuccin"] .hljs-number, [data-theme="catppuccin"] .hljs-literal { color: #fab387; }
    [data-theme="catppuccin"] .hljs-built_in { color: #94e2d5; }
    [data-theme="catppuccin"] .hljs-title, [data-theme="catppuccin"] .hljs-section { color: #89b4fa; }
    [data-theme="catppuccin"] .hljs-attr, [data-theme="catppuccin"] .hljs-attribute { color: #94e2d5; }
    [data-theme="catppuccin"] .hljs-name, [data-theme="catppuccin"] .hljs-tag { color: #cba6f7; }
    [data-theme="catppuccin"] .hljs-deletion { color: #f38ba8; background: #313244; }

    /* Focus mode */
    [data-focus="true"] .sidebar { display: none !important; }
    [data-focus="true"] .settings { display: none !important; }
    [data-focus="true"] .main { max-width: none; }

    /* Overlays */
    .overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(6px);
      display: none; align-items: center; justify-content: center;
      animation: overlay-fade-in 0.15s ease;
    }
    .overlay.open { display: flex; }
    @keyframes overlay-fade-in { from { opacity: 0; } to { opacity: 1; } }

    .overlay__card {
      background: var(--color-bg); border: 1px solid var(--color-border);
      border-radius: 16px; padding: 32px 48px; width: 94%; max-width: 1200px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
    }

    .overlay__header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border);
    }

    .overlay__title { font-size: 18px; font-weight: 700; color: var(--color-text); }

    .overlay__close-hint {
      background: var(--color-code-bg); padding: 3px 10px; border-radius: 6px;
      font-size: 12px; font-family: var(--font-mono); color: var(--color-text-muted);
    }

    /* Shortcut overlay */
    .shortcuts-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }

    .shortcuts-grid__category {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--color-link); margin-bottom: 12px; font-weight: 600;
    }

    .shortcuts-grid__row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }

    .shortcuts-grid__label { color: var(--color-text); font-size: 14px; }

    kbd {
      font-family: var(--font-mono); background: var(--color-code-bg);
      padding: 2px 8px; border-radius: 4px; font-size: 12px;
      border: 1px solid var(--color-border); color: var(--color-text);
      display: inline-block; min-width: 22px; text-align: center;
    }

    /* Theme picker overlay */
    .theme-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    }

    .theme-card {
      border: 2px solid var(--color-border); border-radius: 12px;
      overflow: hidden; cursor: pointer; transition: border-color 0.15s, transform 0.15s;
    }
    .theme-card:hover { transform: translateY(-2px); border-color: var(--color-link); }
    .theme-card--active { border-color: var(--color-link); box-shadow: 0 0 0 2px var(--color-link); }

    .theme-card__preview { padding: 16px; font-family: var(--font-body); font-size: 12px; min-height: 120px; }

    .theme-card__preview-heading {
      font-weight: 700; font-size: 14px; margin-bottom: 6px;
      padding-bottom: 4px;
    }

    .theme-card__preview-code {
      padding: 8px; border-radius: 4px; font-family: var(--font-mono);
      font-size: 11px; margin-bottom: 6px;
    }

    .theme-card__preview-text { font-size: 11px; }

    .theme-card__name {
      padding: 8px 16px; font-size: 13px; font-weight: 600;
      text-align: center; border-top: 1px solid var(--color-border);
      background: var(--color-sidebar-bg); color: var(--color-text);
    }

    /* Settings additions */
    .settings__theme-row {
      display: flex; align-items: center; gap: 8px;
    }

    .settings__theme-arrow {
      background: var(--color-sidebar-bg); border: 1px solid var(--color-border);
      border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 14px;
      color: var(--color-text-muted); transition: all 0.12s; line-height: 1;
    }
    .settings__theme-arrow:hover { border-color: var(--color-text-muted); color: var(--color-text); }

    .settings__theme-name {
      flex: 1; text-align: center; font-size: 13px; font-weight: 500;
      color: var(--color-text); cursor: pointer;
    }
    .settings__theme-name:hover { color: var(--color-link); }

    .settings__shortcuts-btn {
      width: 100%; padding: 6px; background: var(--color-sidebar-bg);
      border: 1px solid var(--color-border); border-radius: 6px;
      font-size: 12px; font-family: var(--font-body); color: var(--color-text-muted);
      cursor: pointer; transition: all 0.12s;
    }
    .settings__shortcuts-btn:hover { border-color: var(--color-text-muted); color: var(--color-text); }

    /* Settings */
    .settings { position: fixed; top: 12px; right: 12px; z-index: 100; }

    .settings__toggle {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid var(--color-border); background: var(--color-sidebar-bg);
      color: var(--color-text-muted); cursor: pointer; transition: all 0.15s ease;
    }
    .settings__toggle:hover { background: var(--color-border); color: var(--color-text); }

    .settings__panel {
      position: absolute; top: calc(100% + 8px); right: 0; width: 220px;
      background: var(--color-bg); border: 1px solid var(--color-border);
      border-radius: 8px; padding: 12px; display: none;
      flex-direction: column; gap: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }
    .settings__panel.open { display: flex; }

    .settings__section { display: flex; flex-direction: column; gap: 6px; }

    .settings__label {
      font-size: 11px; font-weight: 600; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.08em;
    }

    .settings__font-sizes { display: flex; gap: 6px; }

    .settings__font-btn {
      flex: 1; padding: 4px; background: var(--color-sidebar-bg);
      border: 1px solid var(--color-border); border-radius: 4px;
      cursor: pointer; font-family: var(--font-mono); font-size: 12px;
      color: var(--color-text-muted); transition: all 0.12s;
    }
    .settings__font-btn:hover { border-color: var(--color-text-muted); color: var(--color-text); }
    .settings__font-btn--active { border-color: var(--color-link); color: var(--color-link); }

    .settings__range { width: 100%; accent-color: var(--color-link); cursor: pointer; }

    .settings__toggle-row { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }

    .settings__switch {
      position: relative; width: 36px; height: 20px; background: var(--color-border);
      border: none; border-radius: 10px; cursor: pointer; transition: background 0.2s; padding: 0;
    }
    .settings__switch--on { background: var(--color-link); }

    .settings__switch-thumb {
      position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
      background: white; border-radius: 50%; transition: transform 0.2s;
    }
    .settings__switch--on .settings__switch-thumb { transform: translateX(16px); }
`;
