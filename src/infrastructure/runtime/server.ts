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
	const contentSource = createFilesystemContentSource(options.root);
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
		...options.runtimeConfig,
		enableLocalPython:
			options.runtimeConfig?.enableLocalPython ?? uvPythonAvailable,
	};
	let snapshotRoutes = createSnapshotRouteLookup({ snapshot, runtimeConfig });
	let watcher: WatchHandle | undefined;
	let reloadQueue = Promise.resolve();

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
			fetch: async (request) => {
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
		runtimeState = updateProjectRuntimeState(
			runtimeState,
			change.reason,
			change.relPath,
		);
		liveChannel.publish({
			type: "snapshot",
			at: runtimeState.lastChange?.at ?? Date.now(),
			version: runtimeState.version,
			reason: change.reason,
			relPath: change.relPath,
		});
	};

	const queueReload = (change: ReloadChange): Promise<void> => {
		const reload = reloadQueue.then(() => performReload(change));
		reloadQueue = reload.catch(() => undefined);
		return reload;
	};

	if (options.watch) {
		watcher = startFileWatcher({
			root: options.root,
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
		stop() {
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
