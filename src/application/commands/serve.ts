import path from "node:path";
import { defineCommand } from "citty";
import type { ProjectConfigDocuments } from "../../domain/project/config-schema.ts";
import { startServer } from "../../infrastructure/runtime/server.ts";
import { serveProject } from "../use-cases/serve-project.ts";
import {
	httpOptions,
	openBrowser,
	resolveServeContentTarget,
	serverArgs,
	type ServerArgsValues,
} from "./cli-helpers.ts";

export interface ServeCommandArgs extends ServerArgsValues {}

export interface ServeProjectInput {
	contentDir: string;
	filePath?: string;
	openPath: string;
	port: number;
	host: string;
	openBrowser: boolean;
	source: "serve" | "docs" | "docs-wiki";
	readProjectConfigDocuments?: (
		root: string,
	) => Promise<ProjectConfigDocuments>;
}

export async function runServeCommand(
	args: ServeCommandArgs,
	options: {
		source?: "serve" | "docs" | "docs-wiki";
		readProjectConfigDocuments?: (
			root: string,
		) => Promise<ProjectConfigDocuments>;
	} = {},
): Promise<void> {
	const target = await resolveServeContentTarget(args.path);
	const http = httpOptions(args);
	const input: ServeProjectInput = {
		...target,
		port: http.port,
		host: http.host,
		openBrowser: !http.noOpen,
		source: options.source ?? "serve",
		readProjectConfigDocuments: options.readProjectConfigDocuments,
	};

	const handle = await serveProject(
		{
			root: input.contentDir,
			port: input.port,
			host: input.host,
			watch: true,
			clientEntry: path.resolve(
				import.meta.dirname,
				"../../presentation/client/main.tsx",
			),
			readProjectConfigDocuments: input.readProjectConfigDocuments,
		},
		{ startServer },
	);
	const url = `http://${handle.host}:${handle.port}${input.openPath}`;

	console.log(`readrun ${input.source} running at ${url}`);
	console.log(`Serving content from: ${input.contentDir}`);
	if (input.openBrowser) {
		openBrowser(url);
	}
}

export const serveCommand = defineCommand({
	meta: {
		name: "serve",
		description: "Serve a folder or .md file with readrun runtime features.",
	},
	args: {
		path: {
			type: "positional",
			required: false,
			description: "Folder or .md file (default: cwd)",
		},
		...serverArgs,
	},
	async run({ args }) {
		await runServeCommand(args as ServeCommandArgs);
	},
});
