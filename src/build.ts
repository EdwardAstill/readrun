import { join, relative, dirname } from "path";
import { readFile, mkdir, writeFile } from "fs/promises";
import { renderMarkdown } from "./markdown";
import { buildNavTree, renderNav, type NavNode } from "./nav";
import { htmlPage } from "./template";
import { findFirstFile } from "./server";

export async function build(contentDir: string, outDir: string) {
  console.log(`Building static site...`);
  console.log(`  Content: ${contentDir}`);
  console.log(`  Output:  ${outDir}`);

  const tree = await buildNavTree(contentDir);
  const pages = collectPages(tree);

  if (pages.length === 0) {
    console.log("No .md files found.");
    return;
  }

  const firstPage = findFirstFile(tree);

  for (const page of pages) {
    const mdPath = join(contentDir, page.path + ".md");
    const source = await readFile(mdPath, "utf-8");
    const rendered = renderMarkdown(source);
    const nav = renderNav(tree, page.path);

    const titleMatch = source.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : page.name;

    const html = htmlPage(nav, rendered, title);

    const outPath = join(outDir, page.path, "index.html");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html);
    console.log(`  ${page.path}/index.html`);
  }

  // Index redirect
  if (firstPage) {
    const indexHtml = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${firstPage}"></head></html>`;
    await writeFile(join(outDir, "index.html"), indexHtml);
    console.log(`  index.html -> ${firstPage}`);
  }

  console.log(`\nBuilt ${pages.length} pages.`);
}

function collectPages(nodes: NavNode[]): NavNode[] {
  const pages: NavNode[] = [];
  for (const node of nodes) {
    if (!node.isDir) {
      pages.push(node);
    }
    if (node.children) {
      pages.push(...collectPages(node.children));
    }
  }
  return pages;
}
