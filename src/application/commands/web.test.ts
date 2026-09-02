import { expect, test } from "bun:test";
import path from "node:path";

import type {
	RunServeCommandOptions,
	ServeCommandArgs,
} from "./serve.ts";
import { runWebCommand } from "./web.ts";

interface ServeCall {
	args: ServeCommandArgs;
	options: RunServeCommandOptions;
}

test("runWebCommand serves a folder in explicit browser mode", async () => {
	const calls: ServeCall[] = [];

	await runWebCommand(
		{ path: ".", host: "127.0.0.1", port: "43123" },
		{
			serve: async (args, options = {}) => {
				calls.push({ args, options });
			},
		},
	);

	expect(calls).toEqual([
		{
			args: { path: ".", host: "127.0.0.1", port: "43123" },
			options: { source: "serve", viewer: "browser" },
		},
	]);
});

test("runWebCommand maps the exact docs token to built-in docs", async () => {
	const calls: ServeCall[] = [];
	const docsDir = path.resolve(import.meta.dirname, "../../../docs");

	await runWebCommand(
		{ path: "docs", host: "127.0.0.1", port: "43123" },
		{
			serve: async (args, options = {}) => {
				calls.push({ args, options });
			},
		},
	);

	expect(calls).toEqual([
		{
			args: { path: docsDir, host: "127.0.0.1", port: "43123" },
			options: { source: "docs", viewer: "browser" },
		},
	]);
});

test("runWebCommand leaves explicit relative docs paths unchanged", async () => {
	const calls: ServeCall[] = [];

	await runWebCommand(
		{ path: "./docs", host: "127.0.0.1", port: "43123" },
		{
			serve: async (args, options = {}) => {
				calls.push({ args, options });
			},
		},
	);

	expect(calls).toEqual([
		{
			args: { path: "./docs", host: "127.0.0.1", port: "43123" },
			options: { source: "serve", viewer: "browser" },
		},
	]);
});
