import { expect, test } from "bun:test";
import { parseArgs } from "citty";

import {
  browserOpenCommand,
  httpOptions,
  serverArgs,
  type ServerArgsValues,
} from "./cli-helpers.ts";

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
