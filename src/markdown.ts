import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

// Custom rule: treat :::lang ... ::: as executable code blocks (for now, render like normal code with a marker)
const defaultFence = md.renderer.rules.fence!;

md.block.ruler.before("fence", "exec_fence", (state, startLine, endLine, silent) => {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const line = state.src.slice(pos, max);

  if (!line.startsWith(":::")) return false;

  const lang = line.slice(3).trim();

  // Find closing :::
  let nextLine = startLine + 1;
  while (nextLine < endLine) {
    const nPos = state.bMarks[nextLine] + state.tShift[nextLine];
    const nMax = state.eMarks[nextLine];
    const nLine = state.src.slice(nPos, nMax);
    if (nLine.trimEnd() === ":::") break;
    nextLine++;
  }

  if (nextLine >= endLine) return false;
  if (silent) return true;

  const token = state.push("exec_fence", "code", 0);
  token.info = lang;
  token.content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], true);
  token.map = [startLine, nextLine + 1];

  state.line = nextLine + 1;
  return true;
});

let execBlockId = 0;

md.renderer.rules.exec_fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = token.info || "python";
  const id = execBlockId++;
  const rawCode = token.content;
  let highlighted: string;
  if (hljs.getLanguage(lang)) {
    highlighted = hljs.highlight(rawCode, { language: lang }).value;
  } else {
    highlighted = md.utils.escapeHtml(rawCode);
  }
  // Embed raw source in a hidden script tag for Pyodide to read
  const encoded = Buffer.from(rawCode).toString("base64");
  return `<div class="exec-block" data-lang="${md.utils.escapeHtml(lang)}" data-block-id="${id}">
    <div class="exec-block-header">
      <span>${md.utils.escapeHtml(lang)}</span>
      <button class="exec-run-btn" data-block-id="${id}">Run</button>
    </div>
    <pre class="hljs"><code>${highlighted}</code></pre>
    <script type="text/plain" data-source="${id}">${encoded}</script>
    <div class="exec-output" data-output="${id}"></div>
  </div>`;
};

export function renderMarkdown(source: string): string {
  execBlockId = 0;
  return md.render(source);
}
