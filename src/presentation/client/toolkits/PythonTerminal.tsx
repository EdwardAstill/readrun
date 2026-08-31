import {
	useEffect,
	useId,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

import { Button } from "../../components/ui/Button.tsx";
import {
	TerminalSession,
	type TerminalPythonRuntime,
	type TerminalSessionSnapshot,
} from "./terminal-session.ts";

export interface PythonTerminalProps {
	runtime?: TerminalPythonRuntime;
	sessionId?: string;
	autoFocus?: boolean;
}

const defaultTerminalRuntime: TerminalPythonRuntime = {
	async prepare() {
		const { pyodideTerminalRuntime } = await import("../execution/pyodide.ts");
		return pyodideTerminalRuntime.prepare();
	},
	async execute(sessionId, source) {
		const { pyodideTerminalRuntime } = await import("../execution/pyodide.ts");
		return pyodideTerminalRuntime.execute(sessionId, source);
	},
	async reset(sessionId) {
		const { pyodideTerminalRuntime } = await import("../execution/pyodide.ts");
		return pyodideTerminalRuntime.reset(sessionId);
	},
};

export function PythonTerminal({
	runtime = defaultTerminalRuntime,
	sessionId,
	autoFocus = false,
}: PythonTerminalProps): React.JSX.Element {
	const reactId = useId();
	const sessionRef = useRef<TerminalSession | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const transcriptRef = useRef<HTMLDivElement | null>(null);
	const [input, setInput] = useState("");

	if (sessionRef.current === null) {
		sessionRef.current = new TerminalSession(
			runtime,
			sessionId ?? `python-terminal-${reactId}`,
		);
	}
	const session = sessionRef.current;
	const snapshot = useSyncExternalStore(
		(listener) => session.subscribe(listener),
		() => session.getSnapshot(),
		() => session.getSnapshot(),
	);

	useEffect(() => {
		void session.prepare();
		return () => {
			void session.dispose();
		};
	}, [session]);

	useEffect(() => {
		if (autoFocus && snapshot.status === "ready") {
			inputRef.current?.focus();
		}
	}, [autoFocus, snapshot.status]);

	useEffect(() => {
		const lastEntry = transcriptRef.current?.lastElementChild;
		lastEntry?.scrollIntoView?.({ block: "end" });
	}, [snapshot]);

	const inputDisabled = snapshot.status === "loading" || snapshot.status === "error";

	function submit(): void {
		if (input.trim().length === 0 || inputDisabled) {
			return;
		}
		const source = input;
		setInput("");
		void session.submit(source);
	}

	function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
		if (event.key === "Enter") {
			if (event.shiftKey) {
				event.preventDefault();
				const textarea = event.currentTarget;
				const before = input.slice(0, textarea.selectionStart);
				const after = input.slice(textarea.selectionEnd);
				setInput(`${before}\n${after}`);
				return;
			}
			event.preventDefault();
			submit();
			return;
		}

		if (
			event.key === "ArrowUp" &&
			event.currentTarget.selectionStart === 0 &&
			event.currentTarget.selectionEnd === 0
		) {
			event.preventDefault();
			setInput(session.previousCommand());
			return;
		}

		if (
			event.key === "ArrowDown" &&
			event.currentTarget.selectionStart === input.length &&
			event.currentTarget.selectionEnd === input.length
		) {
			event.preventDefault();
			setInput(session.nextCommand());
		}
	}

	function reset(): void {
		setInput("");
		void session.reset();
	}

	return (
		<section
			className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm"
			aria-label="Python terminal"
		>
			<div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
				<div className="text-sm font-medium">Python terminal</div>
				<div className="flex gap-1.5">
					<Button type="button" variant="ghost" size="sm" onClick={() => session.clearOutput()}>
						Clear Output
					</Button>
					<Button type="button" variant="outline" size="sm" onClick={reset}>
						Reset Session
					</Button>
				</div>
			</div>

			<div className="px-3 pt-2 text-xs text-muted-foreground">
				{snapshot.status === "loading" ? (
					<p role="status">Loading Python runtime…</p>
				) : null}
				{snapshot.status === "running" ? (
					<p role="status">Running Python command…</p>
				) : null}
				<p>Python runs in this browser. Long-running commands cannot be interrupted.</p>
			</div>

			{snapshot.status === "error" ? (
				<div className="mx-3 mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm" role="alert">
					<p>
						{snapshot.errorAction === "reset"
							? "Unable to reset Python"
							: "Unable to prepare Python"}
						: {snapshot.loadError}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-2"
						onClick={() =>
							void (snapshot.errorAction === "reset"
								? session.reset()
								: session.retry())
						}
					>
						{snapshot.errorAction === "reset"
							? "Retry Reset Session"
							: "Retry Python runtime"}
					</Button>
				</div>
			) : null}

			<div
				ref={transcriptRef}
				className="m-3 min-h-0 flex-1 overflow-auto rounded-lg bg-muted/40 p-2 font-mono text-sm"
				aria-live="polite"
				data-terminal-transcript
			>
				{snapshot.entries.map((entry) => (
					<div key={entry.id} className="mb-2 last:mb-0">
						<pre className="whitespace-pre-wrap break-words" data-terminal-entry data-terminal-kind="source">
							{entry.source}
						</pre>
						<TranscriptValue kind="stdout" value={entry.stdout} />
						<TranscriptValue kind="stderr" value={entry.stderr} />
						<TranscriptValue kind="result" value={entry.result} />
						<TranscriptValue kind="error" value={entry.error} />
					</div>
				))}
			</div>

			<div className="border-t border-border p-3">
				<label className="sr-only" htmlFor={`python-terminal-input-${reactId}`}>
					Python terminal input
				</label>
				<textarea
					ref={inputRef}
					id={`python-terminal-input-${reactId}`}
					aria-label="Python terminal input"
					data-toolkit-primary-input
					value={input}
					disabled={inputDisabled}
					onInput={(event) => setInput(event.currentTarget.value)}
					onKeyDownCapture={onKeyDown}
					placeholder="Type Python, then press Enter"
					className="flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
				/>
				<div className="mt-2 flex justify-end">
					<Button type="button" size="sm" onClick={submit} disabled={inputDisabled}>
						Run Python command
					</Button>
				</div>
			</div>
		</section>
	);
}

function TranscriptValue({
	kind,
	value,
}: {
	kind: "stdout" | "stderr" | "result" | "error";
	value: string | null;
}): React.JSX.Element | null {
	if (value === null || value.length === 0) {
		return null;
	}
	return (
		<pre className="whitespace-pre-wrap break-words" data-terminal-entry data-terminal-kind={kind}>
			{value}
		</pre>
	);
}
