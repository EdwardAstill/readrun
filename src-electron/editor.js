import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execute = promisify(execFile);

/** The renderer can only move the buffer/session selected by the launching editor. */
export function editorConnection(environment, url, run = execute) {
	const server = environment.READRUN_NVIM_SERVER;
	const session = environment.READRUN_NVIM_SESSION;
	const executable = environment.READRUN_NVIM_BIN;
	const line = Number(environment.READRUN_NVIM_LINE);
	if (!server || !executable || !/^\d+-\d+$/.test(session ?? "") || !Number.isSafeInteger(line) || line < 1) return null;
	const pathname = new URL(url).pathname;
	let pending;
	let running = false;
	let closed = false;
	let lastLine = line;
	return {
		initial: { pathname, line },
		async scroll(path, nextLine) {
			if (closed || path !== pathname || !Number.isSafeInteger(nextLine) || nextLine < 1 || !running && nextLine === lastLine) return;
			pending = nextLine;
			if (running) return;
			running = true;
			try {
				while (pending !== undefined && !closed) {
					const target = pending;
					pending = undefined;
					await run(executable, ["--server", server, "--remote-expr",
						`v:lua.ReadrunScroll('${session}',${target})`], { timeout: 2000 });
					lastLine = target;
				}
			} catch (error) {
				closed = true;
				console.error(`Readrun editor sync stopped: ${error.message}`);
			} finally {
				running = false;
			}
		},
		close() { closed = true; pending = undefined; },
	};
}
