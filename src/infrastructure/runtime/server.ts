import { isLoopback, selectionCommandResponse } from "./selection-command-routes.ts";
import path from "node:path";
import { stat } from "node:fs/promises";
import { createFilePreview, type FilePreview } from "./file-preview.ts";
import { createFilesystemContentSource } from "../filesystem/content-source.ts";
import { readProjectConfigDocuments } from "../filesystem/project-config-source.ts";
import {
	createLiveRuntime,
	createProjectRuntimeState,
	updateProjectRuntimeState,
} from "./live.ts";
import {
	createRuntimeRequestHandler,
	createSnapshotRouteLookup,
	dispatchSnapshotRequest,
} from "./routes.ts";
import { startFileWatcher, type WatchHandle } from "./watch.ts";
import { discoverProject } from "../../application/use-cases/discover-project.ts";
import type { LiveChannel } from "../../application/ports/live-channel.ts";
import type { ContentChangeReason } from "../../application/read-models/project-snapshot.ts";
import type { ServerHandle } from "../../application/use-cases/serve-project.ts";
import type { ReadrunRuntimeConfig } from "../../shared/runtime-config.ts";
import type { ProjectConfigDocuments } from "../../domain/project/config-schema.ts";
import {
	buildContentWidgets,
	isWidgetSourceRelPath,
} from "../widgets/content-widgets.ts";
import { isUvPythonAvailable } from "../execution/uv-python.ts";

const MAX_PORT = 65535;

export interface StartServerOptions {
	root: string;
	filePath?: string;
	desktopToken?: string;
	port: number;
	host?: string;
	watch?: boolean;
	liveChannel?: LiveChannel;
	runtimeConfig?: Partial<ReadrunRuntimeConfig>;
	uvCommand?: string | string[];
	clientEntry?: string;
	readProjectConfigDocuments?: (
		root: string,
	) => Promise<ProjectConfigDocuments>;
}

interface ReloadChange {
	reason: ContentChangeReason;
	relPath?: string;
}

export async function startServer(
	options: StartServerOptions,
): Promise<ServerHandle> {
	const filesystemSource = createFilesystemContentSource(options.root, { filePath: options.filePath });
	const previewSources = new Map<string, string>();
	const contentSource = {
		...filesystemSource,
		async readText(relPath: string) {
			return previewSources.get(relPath) ?? filesystemSource.readText(relPath);
		},
	};
	const readConfig =
		options.readProjectConfigDocuments ?? readProjectConfigDocuments;
	const liveChannel = options.liveChannel ?? createLiveRuntime();
	let runtimeState = createProjectRuntimeState({ root: options.root });
	await buildContentWidgets(options.root);
	let snapshot = await discoverProject(
		{ root: options.root },
		{ contentSource, readProjectConfigDocuments: readConfig },
	);
	const uvPythonAvailable = await isUvPythonAvailable(options.uvCommand);
	const runtimeConfig = {
		enableSelectionCommands: true,
		enableLiveReload: options.watch === true,
		...options.runtimeConfig,
		enableLocalPython:
			options.runtimeConfig?.enableLocalPython ?? uvPythonAvailable,
	};
	let snapshotRoutes = createSnapshotRouteLookup({ snapshot, runtimeConfig });
	let watcher: WatchHandle | undefined;
	let reloadQueue = Promise.resolve();
	const openedFiles = new Map<string, Promise<FilePreview>>();
	const filePreviews = new Map<string, FilePreview>();
	let stopped = false;
	const publishChange = (change: ReloadChange) => {
		runtimeState = updateProjectRuntimeState(runtimeState, change.reason, change.relPath);
		liveChannel.publish({
			type: "snapshot",
			at: runtimeState.lastChange?.at ?? Date.now(),
			version: runtimeState.version,
			reason: change.reason,
			relPath: change.relPath,
		});
	};
	const openFile = async (filePath: string): Promise<string> => {
		if (stopped) throw new Error("The readrun window has closed.");
		if (!path.isAbsolute(filePath) || !/\.(md|pdf)$/i.test(filePath) || !(await stat(filePath)).isFile()) {
			throw new Error("Choose a Markdown or PDF file.");
		}
		filePath = path.resolve(filePath);
		const existing = [...snapshot.contentIndex.byRelPath.values()].find((page) => page.filePath === filePath);
		if (existing) return existing.url.split("/").map(encodeURIComponent).join("/");
		let preview = openedFiles.get(filePath);
		if (!preview) {
			preview = createFilePreview({
				filePath, watch: options.watch, runtimeConfig, liveChannel,
				getRuntimeState: () => runtimeState, onChange: publishChange,
				clientEntry: options.clientEntry, uvPythonAvailable, uvCommand: options.uvCommand,
			}).then((opened) => {
				filePreviews.set(opened.basePath, opened);
				return opened;
			});
			openedFiles.set(filePath, preview);
			void preview.catch(() => openedFiles.delete(filePath));
		}
		const opened = await preview;
		if (stopped) { opened.stop(); throw new Error("The readrun window has closed."); }
		return opened.url;
	};

	const dispatchRuntimeRequest = createRuntimeRequestHandler({
		root: options.root,
		getRuntimeState: () => runtimeState,
		liveChannel,
		clientEntry: options.clientEntry,
		uvPythonAvailable,
		uvCommand: options.uvCommand,
	});

	const serve = (port: number) =>
		Bun.serve({
			port,
			hostname: options.host,
			fetch: async (request, server) => {
				const url = new URL(request.url);
				if (url.pathname === "/_readrun/desktop/open-file" && options.desktopToken) {
					const address = server.requestIP(request)?.address;
					if (!address || !isLoopback(address) || request.headers.get("Authorization") !== `Bearer ${options.desktopToken}` ||
						(request.headers.has("origin") && request.headers.get("origin") !== url.origin)) {
						return new Response("Desktop access required", { status: 403 });
					}
					if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
					try {
						const input = await request.json();
						if (typeof input?.filePath !== "string" || input.filePath.length > 4096) throw new Error("Expected a file path.");
						return Response.json({ url: await openFile(input.filePath) });
					} catch (error) {
						return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
					}
				}
				if (url.pathname.startsWith("/_readrun/opened/")) {
					const address = server.requestIP(request)?.address;
					if (!address || !isLoopback(address)) return new Response("Local access required", { status: 403 });
					const preview = filePreviews.get(url.pathname.split("/").slice(0, 4).join("/"));
					if (preview) return preview.fetch(request);
				}
				if (url.pathname.startsWith("/_readrun/selection-commands")) {
					const address = server.requestIP(request)?.address;
					if (!address || !isLoopback(address)) return new Response("Local access required", { status: 403 });
					const response = await selectionCommandResponse(request, options.root);
					if (response) return response;
				}
				const runtimeResponse = await dispatchRuntimeRequest(request);
				return (
					runtimeResponse ?? dispatchSnapshotRequest(request, snapshotRoutes)
				);
			},
		});

	const server = startOnAvailablePort(options.port, serve);

	const performReload = async (change: ReloadChange) => {
		if (change.relPath && isWidgetSourceRelPath(change.relPath)) {
			await buildContentWidgets(options.root);
		}

		const nextSnapshot = await discoverProject(
			{ root: options.root },
			{ contentSource, readProjectConfigDocuments: readConfig },
		);
		const nextRoutes = createSnapshotRouteLookup({
			snapshot: nextSnapshot,
			runtimeConfig,
		});

		// These assignments are synchronous, so every request observes either the old
		// or the complete new snapshot and lookup.
		snapshot = nextSnapshot;
		snapshotRoutes = nextRoutes;
		publishChange(change);
	};

	const queueReload = (change: ReloadChange, update?: () => void): Promise<void> => {
		const reload = reloadQueue.then(() => {
			update?.();
			return performReload(change);
		});
		reloadQueue = reload.catch(() => undefined);
		return reload;
	};

	if (options.watch) {
		watcher = startFileWatcher({
			root: options.root,
			filePath: options.filePath,
			getScope: () => snapshot.scope,
			onChange: (change) => {
				void queueReload(change).catch((error) => {
					liveChannel.publish({
						type: "error",
						at: Date.now(),
						message: error instanceof Error ? error.message : String(error),
					});
				});
			},
		});
	}

	return {
		port: server.port ?? options.port,
		host: server.hostname ?? options.host ?? "localhost",
		pageUrlForFile(filePath) {
			return [...snapshot.contentIndex.byRelPath.values()].find((page) => page.filePath === filePath)?.url;
		},
		openFile,
		async setPreviewSource(filePath, source) {
			const page = [...snapshot.contentIndex.byRelPath.values()].find((page) => page.filePath === filePath);
			if (!page || page.kind !== "markdown") throw new Error("Editor preview requires a Markdown file in this project.");
			await queueReload({ reason: "content-updated", relPath: page.relPath }, () => {
				if (source === null) previewSources.delete(page.relPath);
				else previewSources.set(page.relPath, source);
			});
		},
		stop() {
			stopped = true;
			for (const preview of openedFiles.values()) void preview.then((opened) => opened.stop(), () => {});
			watcher?.stop();
			server.stop(true);
		},
		reload: () => queueReload({ reason: "manual-reload" }),
	};
}

function startOnAvailablePort(
	startPort: number,
	serve: (port: number) => Bun.Server<undefined>,
): Bun.Server<undefined> {
	if (startPort === 0) {
		return serve(startPort);
	}

	for (let port = startPort; port <= MAX_PORT; port++) {
		try {
			return serve(port);
		} catch (error) {
			if (!isAddressInUseError(error) || port === MAX_PORT) {
				throw error;
			}
		}
	}

	throw new Error(`No available port found from ${startPort} to ${MAX_PORT}.`);
}

function isAddressInUseError(error: unknown): boolean {
	return (
		error instanceof Error &&
		"code" in error &&
		(error as { code?: unknown }).code === "EADDRINUSE"
	);
}
