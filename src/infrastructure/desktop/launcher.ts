import path from "node:path";

export interface DesktopLaunch {
	command: string[];
	cwd: string;
}

export interface DesktopProcess {
	exited: Promise<number>;
	kill(): void;
}

export interface DesktopProcessOptions {
	cwd: string;
	stdin: "inherit";
	stdout: "inherit";
	stderr: "inherit";
}

export type SpawnDesktop = (
	command: string[],
	options: DesktopProcessOptions,
) => DesktopProcess;

export type DesktopSignal = "SIGINT" | "SIGTERM";

export interface DesktopSignals {
	once(signal: DesktopSignal, listener: () => void): void;
	off(signal: DesktopSignal, listener: () => void): void;
}

export interface LaunchDesktopOptions {
	packageRoot?: string;
	spawnDesktop?: SpawnDesktop;
	signals?: DesktopSignals;
}

const processSignals: DesktopSignals = {
	once(signal, listener) {
		process.once(signal, listener);
	},
	off(signal, listener) {
		process.off(signal, listener);
	},
};

const spawnDesktop: SpawnDesktop = (command, options) => {
	const child = Bun.spawn(command, options);
	return {
		exited: child.exited,
		kill() {
			child.kill();
		},
	};
};

export function desktopLaunch(
	url: string,
	packageRoot = path.resolve(import.meta.dirname, "../../.."),
): DesktopLaunch {
	return {
		command: [
			"cargo",
			"run",
			"--quiet",
			"--manifest-path",
			path.join(packageRoot, "src-tauri", "Cargo.toml"),
			"--",
			url,
		],
		cwd: packageRoot,
	};
}

export async function launchDesktop(
	url: string,
	options: LaunchDesktopOptions = {},
): Promise<void> {
	const launch = desktopLaunch(url, options.packageRoot);
	const child = (options.spawnDesktop ?? spawnDesktop)(launch.command, {
		cwd: launch.cwd,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	const signals = options.signals ?? processSignals;
	const terminate = () => child.kill();

	signals.once("SIGINT", terminate);
	signals.once("SIGTERM", terminate);
	try {
		const status = await child.exited;
		if (status !== 0) {
			throw new Error(`readrun desktop exited with status ${status}.`);
		}
	} finally {
		signals.off("SIGINT", terminate);
		signals.off("SIGTERM", terminate);
	}
}
