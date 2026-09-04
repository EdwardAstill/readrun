import { defineCommand } from "citty";
import {
	builtInDocsDir,
	resolveExistingPath,
	serverArgs,
	type ServerArgsValues,
} from "./cli-helpers.ts";
import {
	runServeCommand,
	type RunServeCommandOptions,
	type ServeCommandArgs,
} from "./serve.ts";

export interface WebCommandArgs extends ServerArgsValues {}

export interface RunWebCommandOptions {
	serve?: (
		args: ServeCommandArgs,
		options?: RunServeCommandOptions,
	) => Promise<void>;
}

export async function runWebCommand(
	args: WebCommandArgs,
	options: RunWebCommandOptions = {},
): Promise<void> {
	const useBuiltInDocs = args.path === "docs";
	const contentPath = useBuiltInDocs
		? await resolveExistingPath(
				builtInDocsDir(),
				() => "Built-in docs folder not found.",
			)
		: args.path;

	await (options.serve ?? runServeCommand)(
		{ ...args, path: contentPath },
		{
			source: useBuiltInDocs ? "docs" : "serve",
			viewer: "browser",
		},
	);
}

export const webCommand = defineCommand({
	meta: {
		name: "web",
		description: "Serve readrun content in the default web browser.",
	},
	args: {
		path: {
			type: "positional",
			required: true,
			description: "Folder, .md file, .pdf file, or docs",
		},
		...serverArgs,
	},
	async run({ args }) {
		await runWebCommand(args as WebCommandArgs);
	},
});
