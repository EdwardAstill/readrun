import type {
	TerminalExecution,
	TerminalPythonRuntime,
} from "./terminal-session.ts";

interface MemoryRuntimeOptions {
	failPreparationOnce?: boolean;
	rejectExecutionOnce?: boolean;
}

export function memoryTerminalRuntime(
	options: MemoryRuntimeOptions = {},
): TerminalPythonRuntime {
	const sessions = new Map<string, Map<string, number>>();
	let shouldFailPreparation = options.failPreparationOnce ?? false;
	let shouldRejectExecution = options.rejectExecutionOnce ?? false;

	return {
		async prepare() {
			if (shouldFailPreparation) {
				shouldFailPreparation = false;
				throw new Error("offline");
			}
		},
		async execute(sessionId, source) {
			if (shouldRejectExecution) {
				shouldRejectExecution = false;
				throw new Error("package install failed");
			}

			const namespace = sessions.get(sessionId) ?? new Map<string, number>();
			sessions.set(sessionId, namespace);
			return executeMemoryCommand(namespace, source);
		},
		async reset(sessionId) {
			sessions.delete(sessionId);
		},
	};
}

export function failsPreparationOnce(): TerminalPythonRuntime {
	return memoryTerminalRuntime({ failPreparationOnce: true });
}

export function rejectsExecutionOnce(): TerminalPythonRuntime {
	return memoryTerminalRuntime({ rejectExecutionOnce: true });
}

function executeMemoryCommand(
	namespace: Map<string, number>,
	source: string,
): TerminalExecution {
	const assignment = /^x\s*=\s*(3|7)$/.exec(source.trim());
	if (assignment) {
		namespace.set("x", Number(assignment[1]));
		return execution();
	}

	if (source.trim() === "raise") {
		return execution({ error: "Traceback: boom" });
	}

	const value = namespace.get("x");
	if (value === undefined) {
		return execution({ error: "NameError: name 'x' is not defined" });
	}

	switch (source.trim()) {
		case "x":
			return execution({ result: String(value) });
		case "x * 6":
			return execution({ result: String(value * 6) });
		case "print(x)":
			return execution({ stdout: `${value}\n` });
		case "print(x * 6)":
			return execution({ stdout: `${value * 6}\n` });
		default:
			return execution({ error: `Unsupported test command: ${source}` });
	}
}

function execution(
	overrides: Partial<TerminalExecution> = {},
): TerminalExecution {
	return {
		stdout: "",
		stderr: "",
		result: null,
		error: null,
		...overrides,
	};
}
