export interface TerminalExecution {
	stdout: string;
	stderr: string;
	result: string | null;
	error: string | null;
}

export interface TerminalPythonRuntime {
	prepare(): Promise<void>;
	execute(sessionId: string, source: string): Promise<TerminalExecution>;
	reset(sessionId: string): Promise<void>;
}

export interface TerminalTranscriptEntry extends TerminalExecution {
	id: number;
	source: string;
}

export interface TerminalSessionSnapshot {
	status: "loading" | "ready" | "running" | "error";
	loadError: string | null;
	errorAction: "prepare" | "reset" | null;
	entries: readonly TerminalTranscriptEntry[];
}

type Listener = () => void;

interface HistoryEntry {
	id: number;
	source: string;
}

export class TerminalSession {
	private snapshot: TerminalSessionSnapshot = {
		status: "loading",
		loadError: null,
		errorAction: null,
		entries: [],
	};
	private readonly listeners = new Set<Listener>();
	private readonly history: HistoryEntry[] = [];
	private historyIndex = 0;
	private nextHistoryId = 1;
	private nextEntryId = 1;
	private queue: Promise<void> = Promise.resolve();
	private disposed = false;
	private disposePromise: Promise<void> | null = null;

	constructor(
		private readonly runtime: TerminalPythonRuntime,
		private readonly sessionId: string,
	) {}

	subscribe(listener: Listener): () => void {
		if (this.disposed) {
			return () => {};
		}
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	getSnapshot(): TerminalSessionSnapshot {
		return this.snapshot;
	}

	async prepare(): Promise<void> {
		if (this.disposed) {
			return;
		}
		this.update({ status: "loading", loadError: null, errorAction: null });
		try {
			await this.runtime.prepare();
			this.update({ status: "ready", loadError: null, errorAction: null });
		} catch (error) {
			this.update({
				status: "error",
				loadError: errorText(error),
				errorAction: "prepare",
			});
		}
	}

	retry(): Promise<void> {
		return this.prepare();
	}

	submit(source: string): Promise<void> {
		if (this.disposed || source.trim().length === 0) {
			return Promise.resolve();
		}

		this.history.push({ id: this.nextHistoryId++, source });
		this.historyIndex = this.history.length;

		const execution = this.queue.then(async () => {
			const id = this.nextEntryId++;
			this.update({ status: "running" });
			let result: TerminalExecution;
			try {
				result = await this.runtime.execute(this.sessionId, source);
			} catch (error) {
				result = {
					stdout: "",
					stderr: "",
					result: null,
					error: errorText(error),
				};
			}
			this.update({
				status: "ready",
				entries: [...this.snapshot.entries, { id, source, ...result }],
			});
		});
		this.queue = execution.catch(() => {});
		return execution;
	}

	clearOutput(): void {
		this.update({ entries: [] });
	}

	reset(): Promise<void> {
		if (this.disposed) {
			return this.disposePromise ?? Promise.resolve();
		}

		const historyBoundary = this.nextHistoryId - 1;
		const reset = this.queue.then(async () => {
			try {
				await this.runtime.reset(this.sessionId);
			} catch (error) {
				this.update({
					status: "error",
					loadError: errorText(error),
					errorAction: "reset",
				});
				return;
			}
			const remainingHistory = this.history.filter(
				(entry) => entry.id > historyBoundary,
			);
			this.history.splice(0, this.history.length, ...remainingHistory);
			this.historyIndex = this.history.length;
			this.nextEntryId = 1;
			this.update({
				status: "ready",
				loadError: null,
				errorAction: null,
				entries: [],
			});
		});
		this.queue = reset.catch(() => {});
		return reset;
	}

	previousCommand(): string {
		if (this.history.length === 0) {
			return "";
		}
		this.historyIndex = Math.max(0, this.historyIndex - 1);
		return this.history[this.historyIndex]?.source ?? "";
	}

	nextCommand(): string {
		if (this.historyIndex >= this.history.length - 1) {
			this.historyIndex = this.history.length;
			return "";
		}
		this.historyIndex += 1;
		return this.history[this.historyIndex]?.source ?? "";
	}

	dispose(): Promise<void> {
		if (this.disposePromise) {
			return this.disposePromise;
		}
		this.disposed = true;
		this.listeners.clear();
		this.disposePromise = this.queue
			.then(() => this.runtime.reset(this.sessionId))
			.catch(() => {});
		return this.disposePromise;
	}

	private update(patch: Partial<TerminalSessionSnapshot>): void {
		if (this.disposed) {
			return;
		}
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) {
			listener();
		}
	}
}

function errorText(error: unknown): string {
	if (error instanceof Error) {
		return error.stack ?? error.message;
	}
	return String(error);
}
