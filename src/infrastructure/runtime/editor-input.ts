import { createInterface } from "node:readline";
import type { Readable } from "node:stream";

/** Private stdin channel from the launching editor; no HTTP write endpoint. */
export function attachEditorInput(input: Readable, update: (source: string | null) => Promise<void>): () => void {
	const reader = createInterface({ input, crlfDelay: Infinity });
	let pending: { source: string | null } | undefined;
	let running = false;
	let disposed = false;
	async function flush() {
		if (running) return;
		running = true;
		try {
			while (pending && !disposed) {
				const next = pending;
				pending = undefined;
				try { await update(next.source); }
				catch (error) { console.error("Readrun editor preview:", error); }
			}
		} finally { running = false; }
	}
	reader.on("line", (line) => {
		if (disposed) return;
		try {
			const message = JSON.parse(line);
			if (message?.type !== "buffer" || message.source !== null && typeof message.source !== "string") return;
			pending = { source: message.source };
			void flush();
		} catch { /* Ignore malformed/incomplete editor messages. */ }
	});
	return () => {
		disposed = true;
		pending = undefined;
		reader.close();
		input.pause();
	};
}
