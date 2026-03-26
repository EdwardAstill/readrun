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

    // File upload handler (live mode only)
    if (isLiveMode) {
      const uploadBtn = document.getElementById("file-upload-btn");
      const uploadInput = document.getElementById("file-upload-input");
      const uploadStatus = document.getElementById("file-upload-status");

      if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener("click", () => uploadInput.click());

        uploadInput.addEventListener("change", async () => {
          const file = uploadInput.files[0];
          if (!file) return;

          uploadStatus.textContent = "Uploading...";
          uploadStatus.style.display = "block";

          try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (data.ok) {
              uploadStatus.textContent = \`Uploaded: \${data.name}\`;
            } else {
              uploadStatus.textContent = \`Error: \${data.error}\`;
            }
          } catch (err) {
            uploadStatus.textContent = \`Upload failed: \${err.message}\`;
          }

          setTimeout(() => { uploadStatus.style.display = "none"; }, 3000);
          uploadInput.value = "";
        });
      }
    }
  </script>`;

export const settingsScript = `
  <script type="module">
    const STORAGE_KEY = "explainr-settings";
    const defaults = { fontSize: "medium", contentWidth: 880, showSidebar: true };
    const fontSizeMap = { small: "14px", medium: "16px", large: "18px" };

    function loadSettings() {
      try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
      } catch { return { ...defaults }; }
    }

    function saveSettings(s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    function applySettings(s) {
      document.body.style.fontSize = fontSizeMap[s.fontSize] || fontSizeMap.medium;
      document.getElementById("main-content").style.maxWidth = s.contentWidth + "px";
      document.getElementById("sidebar").style.display = s.showSidebar ? "" : "none";

      document.querySelectorAll("[data-font]").forEach(btn => {
        btn.classList.toggle("settings__font-btn--active", btn.dataset.font === s.fontSize);
      });
      document.getElementById("width-range").value = s.contentWidth;
      document.getElementById("width-label").textContent = "Content width \\u2014 " + s.contentWidth + "px";
      const sw = document.getElementById("sidebar-toggle");
      sw.classList.toggle("settings__switch--on", s.showSidebar);
      sw.setAttribute("aria-checked", s.showSidebar);
    }

    const settings = loadSettings();
    applySettings(settings);

    const panel = document.getElementById("settings-panel");
    document.getElementById("settings-toggle").addEventListener("click", () => {
      panel.classList.toggle("open");
    });

    document.addEventListener("mousedown", (e) => {
      if (!document.getElementById("settings").contains(e.target)) {
        panel.classList.remove("open");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") panel.classList.remove("open");
    });

    document.querySelectorAll("[data-font]").forEach(btn => {
      btn.addEventListener("click", () => {
        settings.fontSize = btn.dataset.font;
        saveSettings(settings);
        applySettings(settings);
      });
    });

    document.getElementById("width-range").addEventListener("input", (e) => {
      settings.contentWidth = Number(e.target.value);
      saveSettings(settings);
      applySettings(settings);
    });

    document.getElementById("sidebar-toggle").addEventListener("click", () => {
      settings.showSidebar = !settings.showSidebar;
      saveSettings(settings);
      applySettings(settings);
    });
  </script>`;
