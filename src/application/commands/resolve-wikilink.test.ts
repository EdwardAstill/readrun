import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveWikilinkCommandResult } from "./resolve-wikilink.ts";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "readrun-resolve-"));
  roots.push(root);
  await Bun.write(path.join(root, "a.md"), "---\ntitle: Shared title\n---\n# Alpha\n\n## Some `code`\n\n## Some `code`\n");
  await Bun.write(path.join(root, "nested/b.md"), "# Shared title\n");
  await Bun.write(path.join(root, ".readrun/ignore"), "ignored.md\n");
  await Bun.write(path.join(root, "ignored.md"), "# Hidden title\n");
  return root;
}

test("resolves real project pages and rendered anchor IDs without changing files", async () => {
  const root = await fixture();
  const before = (await readdir(root, { recursive: true })).sort();
  const result = await resolveWikilinkCommandResult(" [[a.md#some-code-1|label]] ", root);
  expect(result).toEqual({
    status: "resolved", anchor: "some-code-1",
    candidates: [{ file: path.join(root, "a.md"), relPath: "a.md", title: "Shared title", line: 8 }],
  });
  expect((await resolveWikilinkCommandResult("a#missing", root)).candidates[0]?.line).toBeUndefined();
  expect((await readdir(root, { recursive: true })).sort()).toEqual(before);
});

test("uses existing ambiguity, case-folding, and content-scope rules", async () => {
  const root = await fixture();
  expect((await resolveWikilinkCommandResult("SHARED TITLE", root)).status).toBe("ambiguous");
  expect((await resolveWikilinkCommandResult("Shared title", root)).candidates.map((page) => page.relPath)).toEqual(["a.md", "nested/b.md"]);
  expect((await resolveWikilinkCommandResult("Hidden title", root)).status).toBe("unresolved");
  expect((await resolveWikilinkCommandResult("missing", root)).candidates).toEqual([]);
});

test("CLI emits only JSON and returns a failure for an unavailable content folder", async () => {
  const root = await fixture();
  const cli = path.resolve(import.meta.dirname, "../../cli.ts");
  const invoke = (directory: string) => Bun.spawnSync([process.execPath, cli, "resolve-wikilink", "nested/b", "--root", directory]);
  const result = invoke(root);
  expect(result.exitCode).toBe(0);
  expect(result.stderr.toString()).toBe("");
  expect(JSON.parse(result.stdout.toString()).candidates[0].file).toBe(path.join(root, "nested/b.md"));
  const missing = invoke(path.join(root, "missing"));
  expect(missing.exitCode).not.toBe(0);
  expect(missing.stderr.toString()).toContain("Folder not found");
});

test("anchor lines refer to saved source, without expanding or executing code references", async () => {
  const root = await fixture();
  await Bun.write(path.join(root, "code.md"), "# Code\n\n[jsx=demo.jsx]\n\n## After code\n");
  await Bun.write(path.join(root, ".readrun/.widgets-out/demo.jsx"), 'throw new Error("Must never execute");\n\n\n');
  const result = await resolveWikilinkCommandResult("code#after-code", root);
  expect(result.candidates[0]?.line).toBe(5);
});
