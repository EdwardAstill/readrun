export const SELECTION_COMMANDS_URL = "/_readrun/selection-commands";
export const TERMINALS = ["auto", "kitty", "ghostty", "foot", "alacritty", "gnome-terminal", "konsole", "x-terminal-emulator"] as const;
export type Terminal = (typeof TERMINALS)[number];
export interface SelectionCommand {
	id: string;
	label: string;
	prompt: string;
	enabled: boolean;
}
export interface SelectionCommandSettings {
	terminal: Terminal;
	ompExecutable: string;
	commands: SelectionCommand[];
}
export const DEFAULT_SELECTION_COMMANDS: SelectionCommandSettings = {
	terminal: "auto",
	ompExecutable: "omp",
	commands: [{ id: "explain", label: "Explain with OMP", enabled: true,
		prompt: "Explain this passage from {file}:\n\n{selection}\n\nUse the source file for context where helpful." }],
};

export function parseSelectionCommands(value: unknown): SelectionCommandSettings {
	const input = value as Partial<SelectionCommandSettings> | null;
	if (!input || !TERMINALS.includes(input.terminal as Terminal) ||
		typeof input.ompExecutable !== "string" || !input.ompExecutable.trim() ||
		input.ompExecutable.length > 4096 || /[\r\n\0]/.test(input.ompExecutable) ||
		!Array.isArray(input.commands) || input.commands.length > 30) {
		throw new Error("Choose a terminal and an OMP executable, with at most 30 commands.");
	}
	const ids = new Set<string>();
	const commands = input.commands.map((command) => {
		if (!command || typeof command.id !== "string" || !/^[\w-]{1,80}$/.test(command.id) || ids.has(command.id) ||
			typeof command.label !== "string" || !command.label.trim() || command.label.length > 100 ||
			typeof command.prompt !== "string" || !command.prompt.trim() || command.prompt.length > 16000 ||
			typeof command.enabled !== "boolean") throw new Error("Each command needs a unique ID, label, and prompt.");
		ids.add(command.id);
		return { id: command.id, label: command.label, prompt: command.prompt, enabled: command.enabled };
	});
	return { terminal: input.terminal as Terminal, ompExecutable: input.ompExecutable.trim(), commands };
}

export function selectionPrompt(template: string, selection: string, file: string): string {
	return template.replace(/\{(selection|file)\}/g, (_, key) => key === "selection" ? selection : file);
}
