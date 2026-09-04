import { expect, test } from "bun:test";

import {
	desktopLaunch,
	launchDesktop,
	type DesktopProcess,
	type DesktopSignal,
	type DesktopSignals,
} from "./launcher.ts";

class FakeSignals implements DesktopSignals {
	readonly listeners = new Map<DesktopSignal, () => void>();

	once(signal: DesktopSignal, listener: () => void): void {
		this.listeners.set(signal, listener);
	}

	off(signal: DesktopSignal, listener: () => void): void {
		if (this.listeners.get(signal) === listener) {
			this.listeners.delete(signal);
		}
	}
}

test("desktopLaunch constructs the Electron command", () => {
	expect(
		desktopLaunch("http://127.0.0.1:3001/", {
			packageRoot: "/repo",
			electronExecutable: "/repo/node_modules/electron/dist/electron",
			environment: { PATH: "/bin" },
		}),
	).toEqual({
		command: [
			"/repo/node_modules/electron/dist/electron",
			"/repo/src-electron/main.js",
		],
		cwd: "/repo",
		environment: {
			PATH: "/bin",
			READRUN_DESKTOP_URL: "http://127.0.0.1:3001/",
		},
	});
});

test("launchDesktop resolves after one successful viewer process", async () => {
	let spawned = 0;
	await launchDesktop("http://127.0.0.1:3001/", {
		packageRoot: "/repo",
		electronExecutable: "/repo/node_modules/electron/dist/electron",
		environment: { PATH: "/bin" },
		spawnDesktop(command, options) {
			spawned += 1;
			expect(command).toEqual([
				"/repo/node_modules/electron/dist/electron",
				"/repo/src-electron/main.js",
			]);
			expect(options).toEqual({
				cwd: "/repo",
				stdin: "inherit",
				stdout: "inherit",
				stderr: "inherit",
				env: {
					PATH: "/bin",
					READRUN_DESKTOP_URL: "http://127.0.0.1:3001/",
				},
			});
			return { exited: Promise.resolve(0), kill() {} };
		},
		signals: new FakeSignals(),
	});

	expect(spawned).toBe(1);
});

test("launchDesktop rejects an unsuccessful viewer exit", async () => {
	await expect(
		launchDesktop("http://127.0.0.1:3001/", {
			packageRoot: "/repo",
			electronExecutable: "/repo/node_modules/electron/dist/electron",
			spawnDesktop: () => ({ exited: Promise.resolve(9), kill() {} }),
			signals: new FakeSignals(),
		}),
	).rejects.toThrow("readrun desktop exited with status 9.");
});

test("launchDesktop forwards interruption and removes its listeners", async () => {
	let finishViewer: (status: number) => void = () => undefined;
	const exited = new Promise<number>((resolve) => {
		finishViewer = resolve;
	});
	let kills = 0;
	const child: DesktopProcess = {
		exited,
		kill() {
			kills += 1;
		},
	};
	const signals = new FakeSignals();
	const launch = launchDesktop("http://127.0.0.1:3001/", {
		packageRoot: "/repo",
		electronExecutable: "/repo/node_modules/electron/dist/electron",
		spawnDesktop: () => child,
		signals,
	});

	expect([...signals.listeners.keys()]).toEqual(["SIGINT", "SIGTERM"]);
	signals.listeners.get("SIGINT")?.();
	expect(kills).toBe(1);
	finishViewer(130);
	await launch;
	expect(signals.listeners.size).toBe(0);
});
