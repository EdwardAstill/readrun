import { expect, test } from "bun:test";

import {
	desktopEnvironment,
	desktopLaunch,
	launchDesktop,
	type DesktopProcess,
	type DesktopSignal,
	type DesktopSignals,
} from "./launcher.ts";

test("desktopEnvironment disables NVIDIA explicit sync on Linux", () => {
	expect(desktopEnvironment("linux", { PATH: "/bin" })).toEqual({
		PATH: "/bin",
		__NV_DISABLE_EXPLICIT_SYNC: "1",
	});
});

test("desktopEnvironment preserves user overrides and other platforms", () => {
	expect(
		desktopEnvironment("linux", {
			PATH: "/bin",
			__NV_DISABLE_EXPLICIT_SYNC: "0",
		}),
	).toEqual({ PATH: "/bin", __NV_DISABLE_EXPLICIT_SYNC: "0" });
	expect(desktopEnvironment("darwin", { PATH: "/bin" })).toEqual({
		PATH: "/bin",
	});
});

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

test("desktopLaunch constructs the source Cargo command", () => {
	expect(desktopLaunch("http://127.0.0.1:3001/", "/repo")).toEqual({
		command: [
			"cargo",
			"run",
			"--quiet",
			"--manifest-path",
			"/repo/src-tauri/Cargo.toml",
			"--",
			"http://127.0.0.1:3001/",
		],
		cwd: "/repo",
	});
});

test("launchDesktop resolves after one successful viewer process", async () => {
	let spawned = 0;
	await launchDesktop("http://127.0.0.1:3001/", {
		packageRoot: "/repo",
		platform: "linux",
		environment: { PATH: "/bin" },
		spawnDesktop(command, options) {
			spawned += 1;
			expect(command).toEqual([
				"cargo",
				"run",
				"--quiet",
				"--manifest-path",
				"/repo/src-tauri/Cargo.toml",
				"--",
				"http://127.0.0.1:3001/",
			]);
			expect(options).toEqual({
				cwd: "/repo",
				stdin: "inherit",
				stdout: "inherit",
				stderr: "inherit",
				env: { PATH: "/bin", __NV_DISABLE_EXPLICIT_SYNC: "1" },
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
		spawnDesktop: () => child,
		signals,
	});

	expect([...signals.listeners.keys()]).toEqual(["SIGINT", "SIGTERM"]);
	signals.listeners.get("SIGINT")?.();
	expect(kills).toBe(1);
	finishViewer(0);
	await launch;
	expect(signals.listeners.size).toBe(0);
});
