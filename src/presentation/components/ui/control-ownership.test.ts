import { expect, test } from "bun:test";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "../../../..");

test("authored controls use the canonical shadcn Slider and Switch", async () => {
	const authoredFiles = Array.from(
		new Bun.Glob("{src,docs}/**/*.{ts,tsx}").scanSync({
			cwd: projectRoot,
			onlyFiles: true,
		}),
	).filter((path) => !path.endsWith("control-ownership.test.ts"));
	const customControls: string[] = [];

	for (const path of authoredFiles) {
		const source = await Bun.file(resolve(projectRoot, path)).text();
		if (/<input\b[^>]*\btype=["'](?:range|checkbox)["']/i.test(source)) {
			customControls.push(path);
		}
	}

	expect(customControls).toEqual([]);
});
