import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout } from "node:timers/promises";

const execute = promisify(execFile);

// Wait for the compositor to map this process's window. Never target whichever
// window happens to be focused while the viewer is starting.
export async function floatDesktopWindow(pid, run = execute, wait = setTimeout) {
	for (let attempt = 0; attempt < 40; attempt += 1) {
		const { stdout } = await run("hyprctl", ["clients", "-j"], { timeout: 2000 });
		const client = JSON.parse(stdout).find((client) => client.pid === pid && client.mapped);
		if (client) {
			const target = `"pid:${pid}"`;
			const script = [
				`hl.dispatch(hl.dsp.window.float({action="set", window=${target}}))`,
				`hl.dispatch(hl.dsp.window.resize({x=1100, y=750, relative=false, window=${target}}))`,
				`hl.dispatch(hl.dsp.window.center({window=${target}}))`,
			].join("; ");
			const result = await run("hyprctl", ["eval", script], { timeout: 2000 });
			if (result.stdout.trim() !== "ok") {
				throw new Error(`Could not float readrun: ${result.stdout.trim()}`);
			}
			return;
		}
		await wait(50);
	}
	throw new Error("Timed out waiting for Hyprland to map the readrun window.");
}
