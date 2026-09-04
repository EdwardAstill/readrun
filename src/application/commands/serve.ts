import { isIP } from "node:net";
import path from "node:path";
import { defineCommand } from "citty";
import type { ProjectConfigDocuments } from "../../domain/project/config-schema.ts";
import { launchDesktop } from "../../infrastructure/desktop/launcher.ts";
import { startServer } from "../../infrastructure/runtime/server.ts";
import {
	serveProject,
	type ServeProjectPorts,
} from "../use-cases/serve-project.ts";
import {
	fail,
	httpOptions,
	openBrowser,
	resolveServeContentTarget,
	serverArgs,
	type ServerArgsValues,
} from "./cli-helpers.ts";

export interface ServeCommandArgs extends ServerArgsValues {}

export type ServeViewer = "desktop" | "browser" | null;

export interface ServeProjectInput {
	contentDir: string;
	filePath?: string;
	openPath: string;
	port: number;
	host: string;
	viewer: ServeViewer;
	source: "serve" | "docs" | "docs-wiki";
	readProjectConfigDocuments?: (
		root: string,
	) => Promise<ProjectConfigDocuments>;
}

export interface RunServeCommandOptions {
	source?: "serve" | "docs" | "docs-wiki";
	readProjectConfigDocuments?: (
		root: string,
	) => Promise<ProjectConfigDocuments>;
	startServer?: ServeProjectPorts["startServer"];
	launchDesktop?: (url: string) => Promise<void>;
	viewer?: Exclude<ServeViewer, null>;
	openBrowser?: (url: string) => void;
}

function normalizedHost(host: string): string {
	return host.startsWith("[") && host.endsWith("]")
		? host.slice(1, -1)
		: host;
}

function isLoopbackHost(host: string): boolean {
	const normalized = normalizedHost(host);
	if (normalized.toLowerCase() === "localhost" || normalized === "::1") {
		return true;
	}

	return isIP(normalized) === 4 && normalized.startsWith("127.");
}

function serverUrl(host: string, port: number, openPath: string): string {
	const normalized = normalizedHost(host);
	const urlHost = isIP(normalized) === 6 ? `[${normalized}]` : normalized;
	return new URL(openPath, `http://${urlHost}:${port}`).toString();
}

export async function runServeCommand(
	args: ServeCommandArgs,
	options: RunServeCommandOptions = {},
): Promise<void> {
	const target = await resolveServeContentTarget(args.path);
	const http = httpOptions(args);
	const viewer: ServeViewer = http.noOpen
		? null
		: (options.viewer ?? "desktop");
	if (viewer === "desktop" && !isLoopbackHost(http.host)) {
		fail(
			"Desktop mode requires a loopback host; use rr web or --no-open for remote hosts.",
		);
	}

	const input: ServeProjectInput = {
		...target,
		port: http.port,
		host: http.host,
		viewer,
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
		{ startServer: options.startServer ?? startServer },
	);
	const url = serverUrl(handle.host, handle.port, input.openPath);

	console.log(`readrun ${input.source} running at ${url}`);
	console.log(`Serving content from: ${input.contentDir}`);
	if (input.viewer === null) {
		return;
	}
	if (input.viewer === "browser") {
		(options.openBrowser ?? openBrowser)(url);
		return;
	}

	try {
		await (options.launchDesktop ?? launchDesktop)(url);
	} finally {
		handle.stop();
	}
}

export const serveCommand = defineCommand({
	meta: {
		name: "serve",
		description: "Serve a folder, .md file, or .pdf file with readrun runtime features.",
	},
	args: {
		path: {
			type: "positional",
			required: false,
			description: "Folder, .md file, or .pdf file (default: cwd)",
		},
		...serverArgs,
	},
	async run({ args }) {
		await runServeCommand(args as ServeCommandArgs);
	},
});
