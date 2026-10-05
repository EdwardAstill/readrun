import { expect, test } from "bun:test";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

import type {
	ServeProjectPorts,
	ServerHandle,
} from "../use-cases/serve-project.ts";
import { parseArgs } from "citty";
import { runServeCommand, serveArgs } from "./serve.ts";

const contentDir = path.resolve(import.meta.dirname, "../../../docs");

test("single-file previews open the discovered route, including index and URL punctuation", async () => {
	const root = await mkdtemp(path.join(tmpdir(), "rr-editor-route-"));
	try {
		await Bun.write(path.join(root, "unrelated.md"), "# Unrelated file\n");
		for (const name of ["index.md", "notes #1.md"]) {
			const file = path.join(root, name);
			await Bun.write(file, "---\ntitle: Preview\n---\n\n# Source\n");
			await runServeCommand({ path: file, port: 0 }, {
				async launchDesktop(url, options) {
					expect(options?.cwd).toBe(root);
					const response = await fetch(url);
					expect(response.status).toBe(200);
					const html = await response.text();
					expect(html).toContain('data-source-line="5"');
					expect(html).not.toContain("Unrelated file");
					expect(html).not.toContain("fonts.googleapis.com");
					expect((await fetch(new URL("/unrelated", url))).status).toBe(404);
					expect(new URL(url).pathname).toBe(name === "index.md" ? "/" : "/notes%20%231");
				},
			});
		}
	} finally { await rm(root, { recursive: true, force: true }); }
});

function fakeServer(
	host: string,
	port: number,
	onStop: () => void,
): ServerHandle {
	return {
		host,
		port,
		stop: onStop,
		async reload() {},
	};
}

test("runServeCommand opens one desktop window then stops the server", async () => {
	let stops = 0;
	const launches: string[] = [];
	const startServer: ServeProjectPorts["startServer"] = async (input) =>
		fakeServer(input.host ?? "127.0.0.1", input.port, () => {
			stops += 1;
		});

	await runServeCommand(
		{ path: contentDir, host: "127.0.0.1", port: "43123" },
		{
			startServer,
			async launchDesktop(url, options) {
				expect(stops).toBe(0);
				expect(options?.cwd).toBe(process.cwd());
				launches.push(url);
			},
		},
	);

	expect(launches).toEqual(["http://127.0.0.1:43123/"]);
	expect(stops).toBe(1);
});

test("runServeCommand stops the server when desktop launch fails", async () => {
	let stops = 0;

	await expect(
		runServeCommand(
			{ path: contentDir, host: "localhost", port: "43123" },
			{
				startServer: async (input) =>
					fakeServer(input.host ?? "localhost", input.port, () => {
						stops += 1;
					}),
				launchDesktop: async () => {
					throw new Error("viewer failed");
				},
			},
		),
	).rejects.toThrow("viewer failed");

	expect(stops).toBe(1);
});

test("--cwd resolves relative serve paths and overrides a file's parent for the desktop", async () => {
	const root = await mkdtemp(path.join(tmpdir(), "rr-cwd-"));
	const file = path.join(root, "nested", "notes.md");
	await Bun.write(file, "# Notes\n");
	try {
		for (const argv of [
			["--cwd", root],
			["--cwd", root, "nested/notes.md"],
			["nested/notes.md", `--cwd=${root}`],
		]) {
			const args = parseArgs<typeof serveArgs>(argv, serveArgs);
			await runServeCommand(args, {
				async startServer(input) {
					expect(input.root).toBe(args.path ? path.dirname(file) : root);
					expect(input.filePath).toBe(args.path ? file : undefined);
					return fakeServer("127.0.0.1", 43123, () => undefined);
				},
				async launchDesktop(url, options) {
					expect(options?.cwd).toBe(root);
					expect(new URL(url).pathname).toBe(args.path ? "/notes" : "/");
				},
			});
		}
	} finally { await rm(root, { recursive: true, force: true }); }
});

test("invalid --cwd fails before starting a server", async () => {
	await expect(runServeCommand({ cwd: path.join(contentDir, "missing-directory") }, {
		startServer: async () => { throw new Error("must not start"); },
	})).rejects.toThrow("Folder not found:");
	await expect(runServeCommand({ cwd: path.join(contentDir, "start", "commands.md") }, {
		startServer: async () => { throw new Error("must not start"); },
	})).rejects.toThrow("Not a folder:");
});

test("runServeCommand opens a browser once and leaves its server running", async () => {
	let stops = 0;
	let desktopLaunches = 0;
	const opened: string[] = [];

	await runServeCommand(
		{ path: contentDir, host: "0.0.0.0", port: "43123" },
		{
			viewer: "browser",
			startServer: async (input) =>
				fakeServer(input.host ?? "0.0.0.0", input.port, () => {
					stops += 1;
				}),
			launchDesktop: async () => {
				desktopLaunches += 1;
			},
			openBrowser: (url) => {
				opened.push(url);
			},
		},
	);

	expect(opened).toEqual(["http://0.0.0.0:43123/"]);
	expect(desktopLaunches).toBe(0);
	expect(stops).toBe(0);
});

test("runServeCommand leaves no-open servers running without a viewer", async () => {
	let stops = 0;
	let desktopLaunches = 0;
	let browserOpens = 0;

	await runServeCommand(
		{
			path: contentDir,
			host: "0.0.0.0",
			port: "43123",
			open: false,
		},
		{
			viewer: "browser",
			startServer: async (input) =>
				fakeServer(input.host ?? "0.0.0.0", input.port, () => {
					stops += 1;
				}),
			launchDesktop: async () => {
				desktopLaunches += 1;
			},
			openBrowser: () => {
				browserOpens += 1;
			},
		},
	);

	expect(desktopLaunches).toBe(0);
	expect(browserOpens).toBe(0);
	expect(stops).toBe(0);
});

test("runServeCommand rejects a non-loopback desktop host before startup", async () => {
	let starts = 0;

	await expect(
		runServeCommand(
			{ path: contentDir, host: "0.0.0.0", port: "43123" },
			{
				startServer: async () => {
					starts += 1;
					return fakeServer("0.0.0.0", 43123, () => undefined);
				},
				launchDesktop: async () => undefined,
			},
		),
	).rejects.toThrow(
		"Desktop mode requires a loopback host; use rr web or --no-open for remote hosts.",
	);

	expect(starts).toBe(0);
});

test("runServeCommand formats an IPv6 loopback viewer URL", async () => {
	const launches: string[] = [];

	await runServeCommand(
		{ path: contentDir, host: "::1", port: "43123" },
		{
			startServer: async (input) =>
				fakeServer(input.host ?? "::1", input.port, () => undefined),
			launchDesktop: async (url) => {
				launches.push(url);
			},
		},
	);

	expect(launches).toEqual(["http://[::1]:43123/"]);
});


test("parses --floating before or after a folder and forwards it to the viewer", async () => {
	for (const argv of [[contentDir, "--floating"], ["--floating", contentDir]]) {
		const args = parseArgs<typeof serveArgs>(argv, serveArgs);
		let stops = 0;
		await runServeCommand(args, {
			startServer: async () => fakeServer("127.0.0.1", 3001, () => { stops += 1; }),
			launchDesktop: async (_, options) => { expect(options?.floating).toBe(true); },
		});
		expect(stops).toBe(1);
	}
});

test("rejects floating without a desktop viewer before starting a server", async () => {
	await expect(runServeCommand({ path: contentDir, floating: true, open: false }, {
		startServer: async () => { throw new Error("must not start"); },
	})).rejects.toThrow("--floating requires the desktop viewer");
});


test("CLI accepts floating folder shorthand and rejects no-open without starting", async () => {
	const cli = path.resolve(import.meta.dirname, "../../cli.ts");
	for (const argv of [
		[contentDir, "--floating", "--no-open"],
		["--floating", contentDir, "--no-open"],
		["--floating", "--no-open"],
		["serve", contentDir, "--floating", "--no-open"],
	]) {
		const result = Bun.spawnSync([process.execPath, cli, ...argv]);
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("--floating requires the desktop viewer");
		expect(result.stdout.toString()).not.toContain("running at");
	}
});

test("CLI accepts --cwd before and after relative file shorthand", async () => {
	const cli = path.resolve(import.meta.dirname, "../../cli.ts");
	for (const argv of [
		["--cwd", contentDir, "start/commands.md"],
		[`--cwd=${contentDir}`, "start/commands.md"],
		["start/commands.md", "--cwd", contentDir],
		["--cwd", contentDir],
	]) {
		const result = Bun.spawnSync([process.execPath, cli, ...argv, "--floating", "--no-open"]);
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("--floating requires the desktop viewer");
		expect(result.stdout.toString()).not.toContain("running at");
	}
});
