import { expect, test } from "bun:test";
import { interpolate } from "./editor-sync.ts";

test("source interpolation accounts for a tall rendered widget in both directions", () => {
	const anchors = [{ line: 1, top: 0 }, { line: 10, top: 200 }, { line: 12, top: 1000 }, { line: 30, top: 1400 }];
	expect(interpolate(anchors, 600, "top")).toBe(11);
	expect(interpolate(anchors, 21, "line")).toBe(1200);
	expect(interpolate(anchors, -10, "top")).toBe(1);
	expect(interpolate(anchors, 2000, "top")).toBe(30);
});
