import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createContentScope } from "../../domain/project/scope.ts";
import { normaliseRelPath } from "../../shared/paths.ts";
import { createFilesystemContentSource } from "./content-source.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

test("prunes excluded directories without hiding project pages and assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-content-source-test-"));
  tempDirs.push(root);

  const included = [
    "index.md",
    "guide/intro.md",
    "slides/week 1.pdf",
    ".readrun/assets/images/logo.svg",
    ".readrun/assets/data/nested/input.csv",
  ];
  const excluded = [
    "drafts/private.md",
    "node_modules/example/index.md",
    "dist/generated.md",
    ".hidden/secret.md",
    ".readrun/private/internal.md",
    ".readrun/.widgets-out/generated.jsx",
    ".readrun/assets/.hidden/secret.txt",
    ".readrun/assets/data/__pycache__/cached.txt",
  ];

  for (const relPath of [...included, ...excluded]) {
    const filePath = path.join(root, ...relPath.split("/"));
    await mkdir(path.dirname(filePath), { recursive: true });
    await Bun.write(filePath, relPath);
  }

  const visitedDirectories: string[] = [];
  const source = createFilesystemContentSource(root, {
    async readDirectory(dirPath) {
      visitedDirectories.push(
        normaliseRelPath(path.relative(root, dirPath)),
      );
      return readdir(dirPath, { withFileTypes: true });
    },
  });
  const scope = createContentScope({
    contentDir: root,
    mode: "tree",
    treeSource: "filesystem",
    ignorePatterns: ["drafts/**"],
    issues: [],
  });

  const files = await source.listFiles(scope);

  expect(files.map((file) => file.relPath)).toEqual([...included].sort());
  expect(visitedDirectories).toEqual(expect.arrayContaining([
    "",
    "guide",
    ".readrun",
    ".readrun/assets",
    ".readrun/assets/images",
    ".readrun/assets/data",
    ".readrun/assets/data/nested",
  ]));
  expect(visitedDirectories).not.toEqual(expect.arrayContaining([
    "drafts",
    "node_modules",
    "dist",
    ".hidden",
    ".readrun/private",
    ".readrun/.widgets-out",
    ".readrun/assets/.hidden",
    ".readrun/assets/data/__pycache__",
  ]));
});

test("file previews read only the selected page and its assets without walking sibling projects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-single-file-test-"));
  tempDirs.push(root);
  for (const relPath of ["note.md", "sibling.md", "project/docs/unrelated.md", ".readrun/assets/images/logo.svg"]) {
    const file = path.join(root, relPath);
    await mkdir(path.dirname(file), { recursive: true });
    await Bun.write(file, relPath);
  }
  const visited: string[] = [];
  const source = createFilesystemContentSource(root, {
    filePath: path.join(root, "note.md"),
    async readDirectory(dir) {
      const relPath = normaliseRelPath(path.relative(root, dir));
      visited.push(relPath);
      expect(relPath.startsWith(".readrun/assets")).toBe(true);
      return readdir(dir, { withFileTypes: true });
    },
  });
  const scope = createContentScope({ contentDir: root, mode: "tree", treeSource: "filesystem", ignorePatterns: [], issues: [] });
  expect((await source.listFiles(scope)).map(file => file.relPath)).toEqual([".readrun/assets/images/logo.svg", "note.md"]);
  expect(visited).toEqual([".readrun/assets", ".readrun/assets/images"]);
  await rm(path.join(root, ".readrun"), { recursive: true });
  expect((await source.listFiles(scope)).map(file => file.relPath)).toEqual(["note.md"]);
});
