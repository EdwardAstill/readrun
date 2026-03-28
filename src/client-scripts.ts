export const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";

export const executionScript = `
  <script type="module">
    const isLiveMode = document.body.dataset.live === "true";

    let pyodide = null;
    let pyodideLoading = null;

    async function loadPyodideRuntime() {
      if (pyodide) return pyodide;
      if (pyodideLoading) return pyodideLoading;
      pyodideLoading = (async () => {
        const script = document.createElement("script");
        script.src = "${PYODIDE_URL}";
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
        pyodide = await globalThis.loadPyodide();

        // Preload embedded files into Pyodide's virtual filesystem
        const filesEl = document.getElementById("explainr-files");
        if (filesEl) {
          try {
            const files = JSON.parse(filesEl.textContent);
            for (const f of files) {
              const bytes = Uint8Array.from(atob(f.data), c => c.charCodeAt(0));
              pyodide.FS.writeFile(f.name, bytes);
            }
          } catch {}
        }

        return pyodide;
      })();
      return pyodideLoading;
    }

    async function runLive(code, btn, outputEl) {
      btn.disabled = true;
      btn.textContent = "Running...";
      outputEl.innerHTML = "";

      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        let html = "";
        if (data.stdout) html += \`<span class="exec-stdout">\${escapeHtml(data.stdout)}</span>\`;
        if (data.stderr) html += \`<span class="exec-stderr">\${escapeHtml(data.stderr)}</span>\`;
        if (data.images && data.images.length > 0) {
          for (const img of data.images) {
            html += \`<img src="data:\${img.mime};base64,\${img.data}" alt="\${escapeHtml(img.name)}">\`;
          }
        }
        outputEl.innerHTML = html || \`<span class="exec-stdout" style="color: var(--color-text-muted)">(no output)</span>\`;
      } catch (err) {
        outputEl.innerHTML = \`<span class="exec-stderr">Error: \${escapeHtml(err.message)}</span>\`;
      }

      btn.disabled = false;
      btn.textContent = "Run";
    }

    async function runPyodide(code, btn, outputEl) {
      btn.disabled = true;
      btn.textContent = pyodide ? "Running..." : "Loading Python...";
      outputEl.innerHTML = "";

      try {
        const py = await loadPyodideRuntime();
        btn.textContent = "Running...";

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
    }

    document.addEventListener("click", async (e) => {
      const btn = e.target.closest(".exec-run-btn");
      if (!btn) return;

      const blockId = btn.dataset.blockId;
      const sourceEl = document.querySelector(\`script[data-source="\${blockId}"]\`);
      const outputEl = document.querySelector(\`[data-output="\${blockId}"]\`);
      if (!sourceEl || !outputEl) return;

      const code = atob(sourceEl.textContent);

      if (isLiveMode) {
        await runLive(code, btn, outputEl);
      } else {
        await runPyodide(code, btn, outputEl);
      }
    });

    function escapeHtml(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }

    // Files panel (live mode only)
    if (isLiveMode) {
      const filesToggle = document.getElementById("files-toggle");
      const filesDropdown = document.getElementById("files-dropdown");
      const filesList = document.getElementById("files-list");
      const filesAddBtn = document.getElementById("files-add-btn");
      const filesInput = document.getElementById("files-input");

      const fileIcon = \`<svg class="files-panel__item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>\`;

      function formatSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
      }

      async function loadFiles() {
        try {
          const res = await fetch("/api/files");
          const data = await res.json();
          if (!data.files || data.files.length === 0) {
            filesList.innerHTML = \`<div class="files-panel__empty">No files yet</div>\`;
            return;
          }
          filesList.innerHTML = data.files.map(f =>
            \`<div class="files-panel__item">
              \${fileIcon}
              <span class="files-panel__item-name" title="\${escapeHtml(f.name)}">\${escapeHtml(f.name)}</span>
              <span class="files-panel__item-size">\${formatSize(f.size)}</span>
            </div>\`
          ).join("");
        } catch {
          filesList.innerHTML = \`<div class="files-panel__empty">Failed to load files</div>\`;
        }
      }

      if (filesToggle && filesDropdown) {
        filesToggle.addEventListener("click", () => {
          const isOpen = filesDropdown.classList.toggle("open");
          if (isOpen) loadFiles();
        });
      }

      if (filesAddBtn && filesInput) {
        filesAddBtn.addEventListener("click", () => filesInput.click());

        filesInput.addEventListener("change", async () => {
          const file = filesInput.files[0];
          if (!file) return;

          filesAddBtn.textContent = "Uploading...";
          filesAddBtn.disabled = true;

          try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (data.ok) {
              await loadFiles();
            } else {
              filesList.innerHTML = \`<div class="files-panel__empty">Error: \${escapeHtml(data.error)}</div>\`;
            }
          } catch (err) {
            filesList.innerHTML = \`<div class="files-panel__empty">Upload failed</div>\`;
          }

          filesAddBtn.textContent = "+ Add file";
          filesAddBtn.disabled = false;
          filesInput.value = "";
        });
      }
    }
  </script>`;

export const settingsScript = `
  <script type="module">
    const STORAGE_KEY = "explainr-settings";
    const THEMES = ["light", "dark", "solarized", "nord", "dracula", "monokai", "gruvbox", "catppuccin"];
    const THEME_LABELS = { light: "Light", dark: "Dark", solarized: "Solarized", nord: "Nord", dracula: "Dracula", monokai: "Monokai", gruvbox: "Gruvbox", catppuccin: "Catppuccin" };
    const FONT_SIZES = ["small", "medium", "large"];
    const fontSizeMap = { small: "14px", medium: "16px", large: "18px" };
    const defaults = { fontSize: "medium", contentWidth: 880, showSidebar: true, theme: "light", focusMode: false };

    function loadSettings() {
      try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
      } catch { return { ...defaults }; }
    }

    function saveSettings(s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    function applySettings(s) {
      // Font size
      document.body.style.fontSize = fontSizeMap[s.fontSize] || fontSizeMap.medium;
      document.querySelectorAll("[data-font]").forEach(btn => {
        btn.classList.toggle("settings__font-btn--active", btn.dataset.font === s.fontSize);
      });

      // Content width
      document.getElementById("main-content").style.maxWidth = s.focusMode ? "none" : s.contentWidth + "px";
      document.getElementById("width-range").value = s.contentWidth;
      document.getElementById("width-label").textContent = "Content width \\u2014 " + s.contentWidth + "px";

      // Sidebar
      const sidebar = document.getElementById("sidebar");
      sidebar.style.display = s.showSidebar && !s.focusMode ? "" : "none";
      const sw = document.getElementById("sidebar-toggle");
      sw.classList.toggle("settings__switch--on", s.showSidebar);
      sw.setAttribute("aria-checked", s.showSidebar);

      // Theme
      document.documentElement.dataset.theme = s.theme === "light" ? "" : s.theme;
      if (s.theme === "light") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = s.theme;
      document.getElementById("theme-name").textContent = THEME_LABELS[s.theme] || s.theme;

      // Theme picker active state
      document.querySelectorAll("[data-theme-choice]").forEach(card => {
        card.classList.toggle("theme-card--active", card.dataset.themeChoice === s.theme);
      });

      // Focus mode
      if (s.focusMode) {
        document.body.dataset.focus = "true";
      } else {
        delete document.body.dataset.focus;
      }
    }

    const settings = loadSettings();
    applySettings(settings);

    // --- Settings panel ---
    const panel = document.getElementById("settings-panel");
    document.getElementById("settings-toggle").addEventListener("click", () => {
      panel.classList.toggle("open");
    });

    document.addEventListener("mousedown", (e) => {
      const settingsEl = document.getElementById("settings");
      if (settingsEl && !settingsEl.contains(e.target)) {
        panel.classList.remove("open");
      }
    });

    // Font size buttons
    document.querySelectorAll("[data-font]").forEach(btn => {
      btn.addEventListener("click", () => {
        settings.fontSize = btn.dataset.font;
        saveSettings(settings);
        applySettings(settings);
      });
    });

    // Content width slider
    document.getElementById("width-range").addEventListener("input", (e) => {
      settings.contentWidth = Number(e.target.value);
      saveSettings(settings);
      applySettings(settings);
    });

    // Sidebar toggle
    document.getElementById("sidebar-toggle").addEventListener("click", () => {
      settings.showSidebar = !settings.showSidebar;
      saveSettings(settings);
      applySettings(settings);
    });

    // --- Theme controls ---
    function cycleTheme(dir) {
      const idx = THEMES.indexOf(settings.theme);
      settings.theme = THEMES[(idx + dir + THEMES.length) % THEMES.length];
      saveSettings(settings);
      applySettings(settings);
    }

    document.getElementById("theme-prev").addEventListener("click", () => cycleTheme(-1));
    document.getElementById("theme-next").addEventListener("click", () => cycleTheme(1));

    // Click theme name to open picker
    document.getElementById("theme-name").addEventListener("click", () => {
      openOverlay("theme-picker-overlay");
      panel.classList.remove("open");
    });

    // Theme picker card clicks
    document.getElementById("theme-picker-overlay").addEventListener("click", (e) => {
      const card = e.target.closest("[data-theme-choice]");
      if (card) {
        settings.theme = card.dataset.themeChoice;
        saveSettings(settings);
        applySettings(settings);
        closeAllOverlays();
      }
    });

    // --- Shortcuts button ---
    document.getElementById("open-shortcuts-btn").addEventListener("click", () => {
      openOverlay("shortcuts-overlay");
      panel.classList.remove("open");
    });

    // --- Overlay management ---
    function openOverlay(id) {
      closeAllOverlays();
      document.getElementById(id).classList.add("open");
    }

    function closeAllOverlays() {
      document.querySelectorAll(".overlay.open").forEach(el => el.classList.remove("open"));
    }

    function isAnyOverlayOpen() {
      return !!document.querySelector(".overlay.open");
    }

    // Close overlay on backdrop click
    document.querySelectorAll(".overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeAllOverlays();
      });
    });

    // --- Page navigation helpers ---
    function getNavLinks() {
      return Array.from(document.querySelectorAll(".sidebar-nav a[href]"));
    }

    function getCurrentPageIndex() {
      const links = getNavLinks();
      const path = window.location.pathname;
      return links.findIndex(a => {
        const href = new URL(a.href, window.location.origin).pathname;
        return href === path;
      });
    }

    function navigateToPage(offset) {
      const links = getNavLinks();
      const idx = getCurrentPageIndex();
      if (idx < 0) return;
      const next = idx + offset;
      if (next >= 0 && next < links.length) {
        window.location.href = links[next].href;
      }
    }

    // --- Font size cycling ---
    function cycleFontSize(dir) {
      const idx = FONT_SIZES.indexOf(settings.fontSize);
      const next = idx + dir;
      if (next >= 0 && next < FONT_SIZES.length) {
        settings.fontSize = FONT_SIZES[next];
        saveSettings(settings);
        applySettings(settings);
      }
    }

    // --- Focus mode ---
    function toggleFocusMode() {
      settings.focusMode = !settings.focusMode;
      saveSettings(settings);
      applySettings(settings);
    }

    // --- Keyboard shortcuts (configurable via .config/explainr/settings.toml) ---
    const shortcuts = JSON.parse(document.getElementById("explainr-shortcuts").textContent);

    // Parse binding string into a matcher: "Shift+Space" => { shift: true, key: " " }
    // Chord bindings like "g h" are split into prefix + suffix
    function parseBinding(binding) {
      const parts = binding.split("+");
      const mods = { shift: false, ctrl: false, meta: false, alt: false };
      let key = parts.pop();
      for (const m of parts) {
        const ml = m.toLowerCase();
        if (ml === "shift") mods.shift = true;
        else if (ml === "ctrl" || ml === "control") mods.ctrl = true;
        else if (ml === "meta" || ml === "cmd") mods.meta = true;
        else if (ml === "alt") mods.alt = true;
      }
      if (key === "Space") key = " ";
      return { key, ...mods };
    }

    function matchesKey(e, parsed) {
      return e.key === parsed.key
        && e.shiftKey === parsed.shift
        && e.ctrlKey === parsed.ctrl
        && e.metaKey === parsed.meta
        && e.altKey === parsed.alt;
    }

    // Build action map: split chords (e.g. "g h") from simple bindings
    const actions = {
      nextPage:       () => navigateToPage(1),
      prevPage:       () => navigateToPage(-1),
      goHome:         () => { const links = getNavLinks(); if (links.length) window.location.href = links[0].href; },
      scrollDown:     () => window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" }),
      scrollUp:       () => window.scrollBy({ top: -window.innerHeight * 0.85, behavior: "smooth" }),
      scrollToTop:    () => window.scrollTo({ top: 0, behavior: "smooth" }),
      scrollToBottom: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
      toggleSidebar:  () => { settings.showSidebar = !settings.showSidebar; saveSettings(settings); applySettings(settings); },
      focusMode:      () => toggleFocusMode(),
      nextTheme:      () => cycleTheme(1),
      prevTheme:      () => cycleTheme(-1),
      fontIncrease:   () => cycleFontSize(1),
      fontDecrease:   () => cycleFontSize(-1),
      search:         () => {},
      showShortcuts:  () => openOverlay("shortcuts-overlay"),
      closeOverlay:   () => {
        if (isAnyOverlayOpen()) { closeAllOverlays(); return; }
        if (settings.focusMode) { toggleFocusMode(); return; }
        panel.classList.remove("open");
      },
    };

    // Pre-parse all bindings into simple keys and chord sequences
    const simpleBindings = [];
    const chordBindings = {};

    for (const [action, binding] of Object.entries(shortcuts)) {
      const tokens = binding.split(/\\s+/);
      if (tokens.length === 2) {
        // Chord: "g h" => prefix "g", suffix "h"
        const prefix = tokens[0];
        const suffix = parseBinding(tokens[1]);
        if (!chordBindings[prefix]) chordBindings[prefix] = [];
        chordBindings[prefix].push({ suffix, action });
      } else {
        const parsed = parseBinding(binding);
        const needsPreventDefault = parsed.key === " " || parsed.key === "/";
        simpleBindings.push({ parsed, action, needsPreventDefault });
      }
    }

    let chordKey = null;
    let chordTimer = null;

    function clearChord() {
      chordKey = null;
      if (chordTimer) { clearTimeout(chordTimer); chordTimer = null; }
    }

    document.addEventListener("keydown", (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) {
        if (e.key === "Escape") e.target.blur();
        return;
      }

      // Close overlay always works with Escape
      if (e.key === "Escape") {
        actions.closeOverlay();
        return;
      }

      if (isAnyOverlayOpen()) return;

      // Handle chord second key
      if (chordKey) {
        const chords = chordBindings[chordKey] || [];
        clearChord();
        for (const { suffix, action } of chords) {
          if (matchesKey(e, suffix)) {
            if (actions[action]) actions[action]();
            return;
          }
        }
        return;
      }

      // Check if this key starts a chord
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && chordBindings[e.key]) {
        // But only if it's not also a simple binding
        const isAlsoSimple = simpleBindings.some(b => matchesKey(e, b.parsed));
        if (!isAlsoSimple) {
          chordKey = e.key;
          chordTimer = setTimeout(clearChord, 1000);
          return;
        }
      }

      // Simple bindings
      for (const { parsed, action, needsPreventDefault } of simpleBindings) {
        if (matchesKey(e, parsed)) {
          if (needsPreventDefault) e.preventDefault();
          if (actions[action]) actions[action]();
          return;
        }
      }
    });
  </script>`;
