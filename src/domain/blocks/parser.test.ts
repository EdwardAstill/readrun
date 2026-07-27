import { expect, test } from "bun:test";

import { parseBlocks } from "./parser.ts";

test("parseBlocks ignores regular fenced code languages", () => {
  const parsed = parseBlocks("```python\nprint('display only')\n```\n");

  expect(parsed.blocks).toHaveLength(0);
  expect(parsed.issues).toHaveLength(0);
});

test("parseBlocks parses documented bracket blocks and shorthand src", () => {
  const parsed = parseBlocks("[python]\nprint('run')\n[/python]\n\n[csv=files/results.csv]\n");

  expect(parsed.issues).toHaveLength(0);
  expect(parsed.blocks.map((block) => block.name)).toEqual(["python", "csv"]);
  expect(parsed.blocks[0]!.body).toBe("print('run')");
  expect(parsed.blocks[1]!.src).toBe("files/results.csv");
  expect(parsed.blocks[1]!.attrs).toContainEqual({
    name: "src",
    value: "files/results.csv",
    raw: "src=files/results.csv",
  });
});

test("parseBlocks reports unclosed bracket blocks", () => {
  const parsed = parseBlocks("[quiz]\nQuestion\n");

  expect(parsed.issues[0]?.code).toBe("block.parse");
  expect(parsed.issues[0]?.message).toContain("Unclosed block [quiz]");
});

test("parseBlocks treats executable source as opaque text", () => {
  const parsed = parseBlocks([
    "[jsx]",
    "const selected = items[focusedId];",
    "const tail = values[values.length - 1];",
    "[/jsx]",
  ].join("\n"));

  expect(parsed.issues).toHaveLength(0);
  expect(parsed.blocks.map((block) => block.name)).toEqual(["jsx"]);
  expect(parsed.blocks[0]?.body).toContain("items[focusedId]");
});
