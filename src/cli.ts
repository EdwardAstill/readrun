#!/usr/bin/env bun

import { defineCommand, runMain } from "citty";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };
import { authRotateCommand } from "./application/commands/auth-rotate.ts";
import { buildCommand } from "./application/commands/build.ts";
import { cleanCommand } from "./application/commands/clean.ts";
import { docsCommand } from "./application/commands/docs.ts";
import { docsWikiCommand } from "./application/commands/docs-wiki.ts";
import { doctorCommand } from "./application/commands/doctor.ts";
import { initCommand } from "./application/commands/init.ts";
import { newCommand } from "./application/commands/new.ts";
import { serveCommand, runServeCommand } from "./application/commands/serve.ts";
import { todayCommand } from "./application/commands/today.ts";
import { validateCommand } from "./application/commands/validate.ts";
import { deployCommand } from "./application/commands/deploy.ts";
import { webCommand } from "./application/commands/web.ts";
import { widgetsBuildCommand } from "./application/commands/widgets-build.ts";
import {
	pathExists,
	withCommandErrors,
} from "./application/commands/cli-helpers.ts";

const KNOWN_TOP_LEVEL_COMMANDS = new Set([
	"serve",
	"init",
	"validate",
	"build",
	"deploy",
	"docs",
	"docs-wiki",
	"new",
	"today",
	"clean",
	"doctor",
	"auth",
	"widgets-build",
	"web",
	"help",
	"--help",
	"-h",
	"--version",
	"-v",
]);

const firstArgument = process.argv[2];
if (
	firstArgument &&
	!firstArgument.startsWith("-") &&
	!KNOWN_TOP_LEVEL_COMMANDS.has(firstArgument) &&
	(await pathExists(path.resolve(process.cwd(), firstArgument)))
) {
	process.argv.splice(2, 0, "serve");
}

const authCommand = defineCommand({
	meta: {
		name: "auth",
		description: "Authentication helpers.",
	},
	subCommands: {
		rotate: authRotateCommand,
	},
});

const main = defineCommand({
	meta: {
		name: "rr",
		version: packageJson.version,
		description: "readrun",
	},
	subCommands: {
		serve: serveCommand,
		init: initCommand,
		validate: validateCommand,
		build: buildCommand,
		deploy: deployCommand,
		docs: docsCommand,
		"docs-wiki": docsWikiCommand,
		new: newCommand,
		today: todayCommand,
		clean: cleanCommand,
		doctor: doctorCommand,
		auth: authCommand,
		"widgets-build": widgetsBuildCommand,
		web: webCommand,
	},
	async run({ args }) {
		const trailingArgs = (args._ as string[]) ?? [];
		if (trailingArgs.length === 0) {
			await runServeCommand({
				path: process.cwd(),
				port: "3001",
				host: "127.0.0.1",
				"no-open": false,
			});
		}
	},
});

await withCommandErrors(async () => {
	await runMain(main);
});
