import { expect, test } from "bun:test";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_SELECTION_COMMANDS, parseSelectionCommands, selectionPrompt } from "../../shared/selection-commands.ts";
import { launchSelectionCommand, prefillExtension, readSelectionCommands, terminalArguments, writeSelectionCommands } from "./selection-commands.ts";

test("prompt substitutions preserve code, quotes and placeholder text literally", () => {
	const text = '`$(touch /tmp/never)` "quoted"\n{file}\n${value}';
	expect(selectionPrompt("{file}\n{selection}", text, "/notes/a b.md")).toBe(`/notes/a b.md\n${text}`);
});

test("settings round trip and reject duplicate IDs and invalid executables", async () => {
	const dir = await mkdtemp(join(tmpdir(), "rr-command-test-"));
	try {
		const file = join(dir, "settings.json");
		expect(await readSelectionCommands(file)).toEqual(DEFAULT_SELECTION_COMMANDS);
		const settings = { ...DEFAULT_SELECTION_COMMANDS, commands: [{ ...DEFAULT_SELECTION_COMMANDS.commands[0]!, label: "Help me", enabled: false }] };
		await writeSelectionCommands(settings, file);
		expect(await readSelectionCommands(file)).toEqual(settings);
		expect(() => parseSelectionCommands({ ...settings, commands: [settings.commands[0], settings.commands[0]] })).toThrow("unique ID");
		expect(() => parseSelectionCommands({ ...settings, ompExecutable: "omp\n-p" })).toThrow();
	} finally { await rm(dir, { recursive: true, force: true }); }
});

test("OMP extension fills the editor once and never submits a message", async () => {
	const dir = await mkdtemp(join(tmpdir(), "rr-prefill-test-"));
	const file = join(dir, "extension.ts");
	const prompt = 'Explain this:\n`code` "quotes" ${untouched}\n{file}';
	await Bun.write(file, prefillExtension(prompt));
	try {
		const extension = await import(file);
		const handlers = new Map<string, Function>();
		const edited: string[] = [];
		// No sendMessage or sendUserMessage API is provided: any submission fails this test.
		extension.default({ on: (event: string, callback: Function) => handlers.set(event, callback) });
		expect([...handlers.keys()]).toEqual(["session_start"]);
		await handlers.get("session_start")!({}, { hasUI: true, ui: { setEditorText: (text: string) => edited.push(text) } });
		await handlers.get("session_start")!({}, { hasUI: true, ui: { setEditorText: (text: string) => edited.push(text) } });
		expect(edited).toEqual([prompt]);
		expect(await Bun.file(file).exists()).toBe(false);
	} finally { await rm(dir, { recursive: true, force: true }); }
});

test("terminal invocation contains an extension and no initial message or print flag", () => {
	expect(terminalArguments("kitty", "/path with space/omp", "/tmp/draft.ts")).toEqual([
		"kitty", "/path with space/omp", "--no-extensions", "--extension", "/tmp/draft.ts",
	]);
	expect(terminalArguments("ghostty", "omp", "draft.ts")[1]).toBe("-e");
	expect(terminalArguments("gnome-terminal", "omp", "draft.ts")[1]).toBe("--");
});

test("launch rejects disabled commands, traversal and symlinks outside the content root", async () => {
	const dir = await mkdtemp(join(tmpdir(), "rr-launch-test-"));
	const root = join(dir, "content");
	await Bun.write(join(root, "note.md"), "text");
	await Bun.write(join(dir, "outside.md"), "outside");
	await symlink(join(dir, "outside.md"), join(root, "link.md"));
	const launch = async () => { throw new Error("must not launch"); };
	try {
		for (const relPath of ["../outside.md", "link.md"]) {
			await expect(launchSelectionCommand(root, { commandId: "explain", selection: "text", relPath }, DEFAULT_SELECTION_COMMANDS, launch)).rejects.toThrow("inside");
		}
		await expect(launchSelectionCommand(root, { commandId: "missing", selection: "text", relPath: "note.md" }, DEFAULT_SELECTION_COMMANDS, launch)).rejects.toThrow("disabled");
	} finally { await rm(dir, { recursive: true, force: true }); }
});
