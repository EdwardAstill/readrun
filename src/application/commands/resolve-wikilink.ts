import { defineCommand } from "citty";
import { discoverPages } from "../../domain/pages/discovery.ts";
import { resolveWikilink } from "../../domain/pages/wikilinks.ts";
import { createFilesystemContentSource } from "../../infrastructure/filesystem/content-source.ts";
import { readProjectConfigDocuments } from "../../infrastructure/filesystem/project-config-source.ts";
import { renderMarkdown } from "../../presentation/markdown/renderMarkdown.ts";
import { discoverProject } from "../use-cases/discover-project.ts";
import { resolveDirectory } from "./cli-helpers.ts";

export async function resolveWikilinkCommandResult(target: string, root?: string) {
  const contentDir = await resolveDirectory(root);
  const snapshot = await discoverProject({ root: contentDir }, {
    contentSource: createFilesystemContentSource(contentDir),
    readProjectConfigDocuments,
  });
  const resolution = resolveWikilink(target, snapshot.contentIndex);
  const anchor = target.trim().replace(/^\[\[/, "").replace(/\]\]$/, "")
    .split("|", 1)[0]?.split("#")[1]?.split("?", 1)[0]?.trim();
  const pages = resolution.page ? [resolution.page] : (resolution.candidates ?? []).map((entry) => entry.page);
  return {
    status: resolution.status,
    anchor,
    candidates: await Promise.all(pages.map(async (page) => {
      let line: number | undefined;
      if (anchor && page.kind === "markdown") {
        // Snapshot bodies expand code references; editor positions need the original file.
        const original = discoverPages(
          [{ ...page, source: await Bun.file(page.filePath).text() }],
          { mode: snapshot.config.mode === "wiki" ? "wiki" : "tree" },
        ).pages[0];
        const html = original?.kind === "markdown" ? renderMarkdown({ page: original }).html : "";
        new HTMLRewriter().on("h1,h2,h3,h4,h5,h6", {
          element(element) {
            if (element.getAttribute("id") === anchor) {
              const sourceLine = element.getAttribute("data-source-line");
              if (sourceLine) line = Number(sourceLine);
            }
          },
        }).transform(html);
      }
      return { file: page.filePath, relPath: page.relPath, title: page.title, line };
    })),
  };
}

export const resolveWikilinkCommand = defineCommand({
  meta: { name: "resolve-wikilink", description: "Resolve a wikilink to source files as JSON (read-only)." },
  args: {
    target: { type: "positional", required: true, description: "Wikilink target, optionally with #anchor and |label" },
    root: { type: "string", description: "Content folder (default: cwd)" },
  },
  async run({ args }) {
    console.log(JSON.stringify(await resolveWikilinkCommandResult(args.target, args.root)));
  },
});
