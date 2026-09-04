import { expect, test } from "bun:test";
import { parseArgs } from "citty";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  browserOpenCommand,
  httpOptions,
  resolveServeContentTarget,
  serverArgs,
  type ServerArgsValues,
} from "./cli-helpers.ts";

test("a PDF file is a valid serve target", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-pdf-target-test-"));
  const filePath = path.join(root, "Lecture Notes.pdf");
  await Bun.write(filePath, "%PDF-1.4\n");

  try {
    expect(await resolveServeContentTarget(filePath)).toEqual({
      contentDir: root,
      filePath,
      openPath: "/Lecture Notes",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("--no-open disables the viewer", () => {
  const args = parseArgs(["--no-open"], serverArgs) as ServerArgsValues;

  expect(httpOptions(args).noOpen).toBe(true);
});

test("browserOpenCommand uses the native opener for macOS", () => {
  expect(browserOpenCommand("http://localhost:3001/", "darwin")).toEqual([
    "open",
    "http://localhost:3001/",
  ]);
});

test("browserOpenCommand uses cmd start for Windows", () => {
  expect(browserOpenCommand("http://localhost:3001/", "win32")).toEqual([
    "cmd",
    "/c",
    "start",
    "",
    "http://localhost:3001/",
  ]);
});

test("browserOpenCommand uses xdg-open for Linux and other platforms", () => {
  expect(browserOpenCommand("http://localhost:3001/", "linux")).toEqual([
    "xdg-open",
    "http://localhost:3001/",
  ]);
});
