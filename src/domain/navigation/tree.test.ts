import { expect, test } from "bun:test";

import type { Page } from "./model.ts";
import { buildFilesystemTree } from "./tree.ts";

test("filesystem navigation labels all-caps filenames with the exact filename stem", () => {
  const tree = buildFilesystemTree([
    page("LINEAR-ALGEBRA.md", "Linear Algebra"),
    page("api-design.md", "API Design"),
  ]);

  expect(tree.map((node) => node.label)).toEqual(["api-design", "LINEAR-ALGEBRA"]);
});

function page(relPath: string, title: string): Page {
  return {
    url: `/${relPath.replace(/\.md$/, "")}`,
    filePath: `/notes/${relPath}`,
    relPath,
    title,
    filename: relPath,
    mtimeMs: 0,
  };
}
