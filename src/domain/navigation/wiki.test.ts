import { expect, test } from "bun:test";

import { buildWikiNavigation } from "./wiki.ts";
import type { Page } from "./model.ts";

test("keeps wiki navigation to actual pages without a synthetic home item", () => {
  const entryPage = page("knowledge.md", "Knowledge Map");
  const navigation = buildWikiNavigation({
    pages: [
      entryPage,
      page("API.md", "Artificial Intelligence"),
      page("api-design.md", "API Design"),
    ],
    entryPage,
  });

  expect(navigation.sections).toHaveLength(1);
  expect(navigation.sections[0]?.id).toBe("all-pages");
  expect(navigation.sections[0]?.items.map((item) => item.label)).toEqual([
    "api-design",
    "API",
    "knowledge",
  ]);
  expect(navigation.sections[0]?.items[2]).toMatchObject({
    kind: "page",
    id: "page:knowledge.md",
    label: "knowledge",
    page: entryPage,
  });
});

function page(relPath: string, title: string): Page {
  return {
    url: `/${relPath.replace(/\.md$/, "/")}`,
    filePath: `/notes/${relPath}`,
    relPath,
    title,
    filename: relPath,
    mtimeMs: 0,
  };
}
