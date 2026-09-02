import { expect, test } from "bun:test";
import path from "node:path";

import type {
	ServeProjectPorts,
	ServerHandle,
} from "../use-cases/serve-project.ts";
import { runServeCommand } from "./serve.ts";

const contentDir = path.resolve(import.meta.dirname, "../../../docs");

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
			async launchDesktop(url) {
				expect(stops).toBe(0);
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
