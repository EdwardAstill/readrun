import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  PASSWORD_PLACEHOLDER,
  getPasswordFileCandidates,
  inspectPasswordText,
  readPasswordAuthConfig,
} from "./password-auth.ts";

test("inspectPasswordText rejects empty and placeholder password files", () => {
  expect(inspectPasswordText("\n").issues[0]?.severity).toBe("error");

  const placeholder = inspectPasswordText(`${PASSWORD_PLACEHOLDER}\n`);
  expect(placeholder.issues[0]?.message).toContain("still contains");
  expect(placeholder.issues[0]?.severity).toBe("error");
});

test("inspectPasswordText supports multiple passwords and weak warnings", () => {
  const result = inspectPasswordText("reader-one\n12345678\nreader-one\n");

  expect(result.passwords).toEqual(["reader-one", "12345678"]);
  expect(result.issues.some((issue) => issue.message.includes("duplicate"))).toBe(true);
  expect(result.issues.some((issue) => issue.severity === "warning")).toBe(true);
});

test("readPasswordAuthConfig prefers content password before project fallback", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-auth-test-"));
  try {
    const contentDir = path.join(root, "docs");
    await mkdir(path.join(root, ".readrun"), { recursive: true });
    await mkdir(path.join(contentDir, ".readrun"), { recursive: true });
    await Bun.write(path.join(root, ".readrun", "pw.txt"), "project-password\n");
    await Bun.write(path.join(contentDir, ".readrun", "pw.txt"), "content-password\n");

    expect(getPasswordFileCandidates({ contentDir, projectDir: root })).toEqual([
      path.join(contentDir, ".readrun", "pw.txt"),
      path.join(root, ".readrun", "pw.txt"),
    ]);

    const auth = await readPasswordAuthConfig({ contentDir, projectDir: root });
    expect(auth?.passwords).toEqual(["content-password"]);
    expect(auth?.lookupWarnings?.[0]?.kind).toBe("subdirectory-both-present");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
