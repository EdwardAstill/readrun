import { chmod, mkdir, mkdtemp, realpath, rename, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative, isAbsolute } from "node:path";
import { DEFAULT_SELECTION_COMMANDS, parseSelectionCommands, selectionPrompt, TERMINALS, type SelectionCommandSettings } from "../../shared/selection-commands.ts";

export function selectionSettingsPath(): string {
	return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "readrun", "selection-commands.json");
}
export async function readSelectionCommands(file = selectionSettingsPath()): Promise<SelectionCommandSettings> {
	if (!await Bun.file(file).exists()) return structuredClone(DEFAULT_SELECTION_COMMANDS);
	return parseSelectionCommands(await Bun.file(file).json());
}
export async function writeSelectionCommands(value: unknown, file = selectionSettingsPath()): Promise<SelectionCommandSettings> {
	const settings = parseSelectionCommands(value);
	await mkdir(dirname(file), { recursive: true, mode: 0o700 });
	const temporary = `${file}.${crypto.randomUUID()}.tmp`;
	try {
		await Bun.write(temporary, JSON.stringify(settings, null, 2), { mode: 0o600 });
		await rename(temporary, file);
	} finally { await rm(temporary, { force: true }); }
	return settings;
}

// OMP receives no positional message. Its editor API fills a draft only.
export function prefillExtension(prompt: string): string {
	return `import { rm } from "node:fs/promises";
export default function (api) {
  let filled = false;
  api.on("session_start", async (_event, ctx) => {
    if (filled || !ctx.hasUI) return;
    filled = true;
    ctx.ui.setEditorText(${JSON.stringify(prompt)});
    await rm(import.meta.dirname, { recursive: true, force: true });
  });
}
`;
}

export function terminalArguments(terminal: string, executable: string, extension: string): string[] {
	const separator = terminal === "gnome-terminal" ? "--" : "-e";
	return [terminal, ...(terminal === "kitty" ? [] : [separator]), executable, "--no-extensions", "--extension", extension];
}

export async function launchSelectionCommand(root: string, value: unknown,
	settings: SelectionCommandSettings,
	launch: (args: string[], cwd: string) => Promise<void> = launchTerminal,
): Promise<void> {
	const input = value as { commandId?: unknown; selection?: unknown; relPath?: unknown } | null;
	if (!input || typeof input.selection !== "string" || !input.selection.trim() || input.selection.length > 100000 ||
		typeof input.relPath !== "string" || isAbsolute(input.relPath)) throw new Error("Select text in a source document first (maximum 100,000 characters).");
	const command = settings.commands.find((item) => item.id === input.commandId && item.enabled);
	if (!command) throw new Error("This selection command is disabled or no longer exists.");
	const resolvedRoot = await realpath(root);
	const file = await realpath(join(resolvedRoot, input.relPath));
	const rel = relative(resolvedRoot, file);
	if (!rel || rel === ".." || rel.startsWith("../") || isAbsolute(rel) || !(await Bun.file(file).stat()).isFile()) {
		throw new Error("The source file must be inside the served content folder.");
	}
	const terminal = settings.terminal === "auto"
		? TERMINALS.slice(1).find((name) => Bun.which(name)) : settings.terminal;
	if (!terminal || !Bun.which(terminal)) throw new Error("No supported terminal found. Choose an installed terminal in Settings.");
	const executable = Bun.which(settings.ompExecutable);
	if (!executable) throw new Error("OMP was not found. Set its executable path in Settings.");
	const directory = await mkdtemp(join(tmpdir(), "readrun-omp-"));
	await chmod(directory, 0o700);
	const extension = join(directory, "prefill.ts");
	try {
		await Bun.write(extension, prefillExtension(selectionPrompt(command.prompt, input.selection, file)), { mode: 0o600 });
		await launch(terminalArguments(terminal, executable, extension), resolvedRoot);
	} catch (error) {
		await rm(directory, { recursive: true, force: true });
		throw error;
	}
}

async function launchTerminal(args: string[], cwd: string): Promise<void> {
	const child = Bun.spawn(args, { cwd, stdin: "ignore", stdout: "ignore", stderr: "ignore" });
	const exitCode = await Promise.race([child.exited, Bun.sleep(400).then(() => null)]);
	if (exitCode !== null && exitCode !== 0) throw new Error(`Terminal failed to open (exit ${exitCode}). Check the terminal setting.`);
	child.unref();
}
