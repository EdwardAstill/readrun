import { expect, test } from "bun:test";

import type { MarkdownPage } from "./page.ts";
import {
  buildWikilinkLookup,
  extractOutboundWikilinks,
  resolveWikilink,
} from "./wikilinks.ts";

test("exact case-sensitive filename targets win before fuzzy title matches", () => {
  const lookup = buildWikilinkLookup([
    page("BIOCHEMISTRY.md", "Biochemistry"),
    page("biochemistry-biology.md", "Biochemistry"),
  ]);

  const resolution = resolveWikilink("BIOCHEMISTRY", lookup);

  expect(resolution.status).toBe("resolved");
  expect(resolution.page?.relPath).toBe("BIOCHEMISTRY.md");
});

test("lowercase fuzzy title links remain ambiguous when multiple pages share a title", () => {
  const lookup = buildWikilinkLookup([
    page("BIOCHEMISTRY.md", "Biochemistry"),
    page("biochemistry-biology.md", "Biochemistry"),
  ]);

  const resolution = resolveWikilink("biochemistry", lookup);

  expect(resolution.status).toBe("ambiguous");
});

test("outbound wikilinks exclude code while preserving prose positions", () => {
  const source = [
    "[[prose]]",
    "`[[inline-code]]`",
    "```ts",
    "const value = [[fenced, code]];",
    "```",
    "[jsx]",
    "const points = [[1, 1, 1]];",
    "[/jsx]",
    "[[second|label]]",
    "[jsx=chart.jsx]",
    "[[after-reference]]",
  ].join("\n");

  const links = extractOutboundWikilinks(source);

  expect(links.map((link) => link.target)).toEqual([
    "prose",
    "second",
    "after-reference",
  ]);
  expect(links[1]?.position?.line).toBe(9);
});

function page(relPath: string, title: string): MarkdownPage {
  return {
    kind: "markdown",
    ext: ".md",
    url: `/${relPath.replace(/\.md$/, "")}`,
    filePath: `/notes/${relPath}`,
    relPath,
    filename: relPath,
    title,
    mtimeMs: 0,
    body: `# ${title}`,
    tags: [],
    outboundLinks: [],
  };
}
