import { expect, test } from "bun:test";
import { editorConnection } from "./editor.js";

const environment = {
	READRUN_NVIM_SERVER: "/tmp/nvim socket",
	READRUN_NVIM_SESSION: "123-1",
	READRUN_NVIM_BIN: "/usr/bin/nvim",
	READRUN_NVIM_LINE: "25",
};

test("editor bridge only sends numeric lines for the original document", async () => {
	const calls = [];
	const editor = editorConnection(environment, "http://localhost:7700/notes", async (...args) => calls.push(args));
	expect(editor.initial).toEqual({ pathname: "/notes", line: 25 });
	for (const line of [0, -1, NaN, Infinity, 1.5, "1)|quit", 25]) await editor.scroll("/notes", line);
	await editor.scroll("/another-file", 50);
	expect(calls).toHaveLength(0);
	await editor.scroll("/notes", 50);
	expect(calls[0]).toEqual(["/usr/bin/nvim", ["--server", "/tmp/nvim socket", "--remote-expr", "v:lua.ReadrunScroll('123-1',50)"], { timeout: 2000 }]);
	editor.close();
	await editor.scroll("/notes", 60);
	expect(calls).toHaveLength(1);
});

test("rapid scrolls coalesce while an editor request is running", async () => {
	let release;
	const calls = [];
	const editor = editorConnection(environment, "http://localhost/notes", async (_, args) => {
		calls.push(args.at(-1));
		if (calls.length === 1) await new Promise((resolve) => { release = resolve; });
	});
	const first = editor.scroll("/notes", 30);
	await editor.scroll("/notes", 40);
	await editor.scroll("/notes", 50);
	release();
	await first;
	expect(calls).toEqual(["v:lua.ReadrunScroll('123-1',30)", "v:lua.ReadrunScroll('123-1',50)"]);
});

test("normal desktop launches have no editor access", () => {
	expect(editorConnection({}, "http://localhost/")).toBeNull();
	expect(editorConnection({ ...environment, READRUN_NVIM_SESSION: "bad'code" }, "http://localhost/")).toBeNull();
});
