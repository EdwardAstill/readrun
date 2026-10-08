import { expect, test } from "bun:test";
import { createFilePicker } from "./file-picker.js";

test("the system picker returns a selected file to readrun without shell commands", async () => {
	const window = {};
	const picker = createFilePicker(window, {
		async showOpenDialog(parent, options) {
			expect(parent).toBe(window);
			expect(options.defaultPath).toBe("/notes");
			expect(options.properties).toEqual(["openFile", "multiSelections"]);
			expect(options.filters[0].extensions).toEqual(["md", "pdf"]);
			return { canceled: false, filePaths: ["/elsewhere/notes #1.md"] };
		},
	}, "http://127.0.0.1:3001/", "desktop-token", async (url, options) => {
		expect(url.toString()).toBe("http://127.0.0.1:3001/_readrun/desktop/open-file");
		expect(options.headers.Authorization).toBe("Bearer desktop-token");
		expect(JSON.parse(options.body)).toEqual({ filePath: "/elsewhere/notes #1.md" });
		return Response.json({ url: "/_readrun/opened/preview/notes%20%231/" });
	}, "/notes");
	expect(await picker()).toEqual(["/_readrun/opened/preview/notes%20%231/"]);
});

test("the system picker opens every selected Markdown and PDF file in selection order", async () => {
	const filePaths = ["/notes/first.md", "/elsewhere/notes #2.md", "/notes/lecture.pdf"];
	const urls = ["/first/", "/_readrun/opened/preview/notes%20%232/", "/lecture/"];
	const requested = [];
	const picker = createFilePicker({}, {
		async showOpenDialog() { return { canceled: false, filePaths }; },
	}, "http://localhost:3001/", "token", async (_url, options) => {
		requested.push(JSON.parse(options.body).filePath);
		return Response.json({ url: urls[requested.length - 1] });
	});
	expect(await picker()).toEqual(urls);
	expect(requested).toEqual(filePaths);
});

test("canceling the picker opens no files and allows another attempt", async () => {
	let dialogs = 0;
	const picker = createFilePicker({}, {
		async showOpenDialog() { dialogs += 1; return { canceled: true, filePaths: [] }; },
	}, "http://localhost:3001/", "token", () => { throw new Error("Cancellation must not make a request"); });
	expect(await picker()).toEqual([]);
	expect(await picker()).toEqual([]);
	expect(dialogs).toBe(2);
});

test("repeated shortcuts cannot open overlapping pickers", async () => {
	let finish;
	const picker = createFilePicker({}, {
		showOpenDialog: () => new Promise((resolve) => { finish = resolve; }),
	}, "http://localhost:3001/", "token");
	const pending = picker();
	expect(await picker()).toEqual([]);
	finish({ canceled: true, filePaths: [] });
	expect(await pending).toEqual([]);
});

test("opening errors are reported and do not prevent another selection", async () => {
	let attempts = 0;
	const picker = createFilePicker({}, {
		async showOpenDialog() { return { canceled: false, filePaths: ["/missing.md"] }; },
	}, "http://localhost:3001/", "token", async () => {
		attempts += 1;
		return Response.json({ error: "File not found" }, { status: 400 });
	});
	await expect(picker()).rejects.toThrow("File not found");
	await expect(picker()).rejects.toThrow("File not found");
	expect(attempts).toBe(2);
});
