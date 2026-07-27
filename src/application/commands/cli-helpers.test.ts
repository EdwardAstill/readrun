import { expect, test } from "bun:test";

import { browserOpenCommand } from "./cli-helpers.ts";

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
