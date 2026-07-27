import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildContentWidgets } from "./content-widgets.ts";

const tempDirs: string[] = [];

async function makeProject(): Promise<string> {
	const root = await mkdtemp(path.join(tmpdir(), "rr-content-widgets-test-"));
	tempDirs.push(root);
	await mkdir(path.join(root, ".readrun", "widgets"), { recursive: true });
	await Bun.write(
		path.join(root, ".readrun", "widgets", "demo-widget.tsx"),
		`import React from "react";

export function DemoWidget() {
  return <div>Widget ok</div>;
}
`,
	);
	return root;
}

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

test("buildContentWidgets writes generated jsx and skips unchanged bodies", async () => {
	const root = await makeProject();

	const first = await buildContentWidgets(root);
	expect(first.built.map((file) => path.basename(file))).toEqual([
		"demo-widget.jsx",
	]);
	expect(first.unchanged).toEqual([]);

	const outputPath = path.join(
		root,
		".readrun",
		".widgets-out",
		"demo-widget.jsx",
	);
	expect(await Bun.file(outputPath).text()).toContain("Widget ok");

	const second = await buildContentWidgets(root);
	expect(second.built).toEqual([]);
	expect(second.unchanged.map((file) => path.basename(file))).toEqual([
		"demo-widget.jsx",
	]);
});

test("buildContentWidgets refuses to overwrite hand-written output", async () => {
	const root = await makeProject();
	await mkdir(path.join(root, ".readrun", ".widgets-out"), { recursive: true });
	await Bun.write(
		path.join(root, ".readrun", ".widgets-out", "demo-widget.jsx"),
		"render(<HandWritten />);\n",
	);

	await expect(buildContentWidgets(root)).rejects.toThrow(
		"Refusing to overwrite",
	);
});
