import { join } from "path";
import { readFile, stat } from "fs/promises";
import { renderMarkdown } from "./markdown";
import { buildNavTree, renderNav, type NavNode } from "./nav";
import { htmlPage } from "./template";

async function resolveMarkdownPath(contentDir: string, urlPath: string): Promise<string | null> {
  const direct = join(contentDir, urlPath + ".md");
  if (await exists(direct)) return direct;

  const index = join(contentDir, urlPath, "index.md");
  if (await exists(index)) return index;

  const readme = join(contentDir, urlPath, "README.md");
  if (await exists(readme)) return readme;

  return null;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function findFirstFile(nodes: NavNode[]): string | null {
  for (const node of nodes) {
    if (!node.isDir) return node.path;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

export function startServer(contentDir: string, port: number) {
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      let pathname = decodeURIComponent(url.pathname);

      if (pathname === "/") {
        const tree = await buildNavTree(contentDir);
        const first = findFirstFile(tree);
        if (first) {
          return Response.redirect(first, 302);
        }
      }

      const mdPath = await resolveMarkdownPath(contentDir, pathname);
      if (!mdPath) {
        return new Response("Not found", { status: 404 });
      }

      const source = await readFile(mdPath, "utf-8");
      const rendered = renderMarkdown(source);
      const tree = await buildNavTree(contentDir);
      const nav = renderNav(tree, pathname);

      const titleMatch = source.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : pathname.split("/").pop() || "explainr";

      const html = htmlPage(nav, rendered, title);
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    },
  });

  console.log(`explainr running at http://localhost:${server.port}`);
  console.log(`Serving content from: ${contentDir}`);
}
