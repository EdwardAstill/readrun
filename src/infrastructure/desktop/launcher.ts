import { createRequire } from "node:module";
import path from "node:path";

export interface DesktopLaunch {
	command: string[];
	cwd: string;
	environment: DesktopEnvironment;
}

export interface DesktopProcess {
	exited: Promise<number>;
	kill(): void;
}

export type DesktopEnvironment = Record<string, string | undefined>;

export interface DesktopProcessOptions {
	cwd: string;
	stdin: "inherit";
	stdout: "inherit";
	stderr: "inherit";
	env: DesktopEnvironment;
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
	electronExecutable?: string;
	spawnDesktop?: SpawnDesktop;
	signals?: DesktopSignals;
	environment?: DesktopEnvironment;
}

const require = createRequire(import.meta.url);

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

function installedElectronExecutable(): string {
	const executable = require("electron");
	if (typeof executable !== "string") {
		throw new Error("Could not resolve the Electron executable.");
	}
	return executable;
}

export function desktopLaunch(
	url: string,
	options: Pick<
		LaunchDesktopOptions,
		"packageRoot" | "electronExecutable" | "environment"
	> = {},
): DesktopLaunch {
	const packageRoot =
		options.packageRoot ?? path.resolve(import.meta.dirname, "../../..");
	return {
		command: [
			options.electronExecutable ?? installedElectronExecutable(),
			path.join(packageRoot, "src-electron", "main.js"),
		],
		cwd: packageRoot,
		environment: {
			...(options.environment ?? process.env),
			READRUN_DESKTOP_URL: url,
		},
	};
}

export async function launchDesktop(
	url: string,
	options: LaunchDesktopOptions = {},
): Promise<void> {
	const launch = desktopLaunch(url, options);
	const child = (options.spawnDesktop ?? spawnDesktop)(launch.command, {
		cwd: launch.cwd,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		env: launch.environment,
	});
	const signals = options.signals ?? processSignals;
	let interrupted = false;
	const terminate = () => {
		interrupted = true;
		child.kill();
	};

	signals.once("SIGINT", terminate);
	signals.once("SIGTERM", terminate);
	try {
		const status = await child.exited;
		if (status !== 0 && !interrupted) {
			throw new Error(`readrun desktop exited with status ${status}.`);
		}
	} finally {
		signals.off("SIGINT", terminate);
		signals.off("SIGTERM", terminate);
	}
}
