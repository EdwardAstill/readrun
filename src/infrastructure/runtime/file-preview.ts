import path from "node:path";
import type { LiveChannel } from "../../application/ports/live-channel.ts";
import type { ContentChangeReason, ProjectRuntimeState } from "../../application/read-models/project-snapshot.ts";
import { discoverProject } from "../../application/use-cases/discover-project.ts";
import type { ReadrunRuntimeConfig } from "../../shared/runtime-config.ts";
import { createFilesystemContentSource } from "../filesystem/content-source.ts";
import { readProjectConfigDocuments } from "../filesystem/project-config-source.ts";
import { buildContentWidgets, isWidgetSourceRelPath } from "../widgets/content-widgets.ts";
import { createRuntimeRequestHandler, createSnapshotRouteLookup, dispatchSnapshotRequest } from "./routes.ts";
import { selectionCommandResponse } from "./selection-command-routes.ts";
import { startFileWatcher } from "./watch.ts";

export interface FilePreview {
	basePath: string;
	url: string;
	fetch(request: Request): Promise<Response>;
	stop(): void;
}

export async function createFilePreview(options: {
	filePath: string;
	watch?: boolean;
	runtimeConfig: Partial<ReadrunRuntimeConfig>;
	liveChannel: LiveChannel;
	getRuntimeState(): ProjectRuntimeState;
	onChange(change: { reason: ContentChangeReason; relPath: string }): void;
	clientEntry?: string;
	uvPythonAvailable: boolean;
	uvCommand?: string | string[];
}): Promise<FilePreview> {
	const root = path.dirname(options.filePath);
	const basePath = `/_readrun/opened/${crypto.randomUUID()}`;
	const contentSource = createFilesystemContentSource(root, { filePath: options.filePath });
	const discover = () => discoverProject({ root }, { contentSource, readProjectConfigDocuments });
	await buildContentWidgets(root);
	let snapshot = await discover();
	const page = [...snapshot.contentIndex.byRelPath.values()].find((page) => page.filePath === options.filePath);
	if (!page) throw new Error(`This file is excluded by its readrun project: ${options.filePath}`);
	let routes = createSnapshotRouteLookup({ snapshot, runtimeConfig: options.runtimeConfig, basePath });
	const runtime = createRuntimeRequestHandler({
		...options,
		root,
		getRuntimeState: () => ({ ...options.getRuntimeState(), root }),
	});
	let stopped = false;
	let reloadQueue = Promise.resolve();
	const watcher = options.watch ? startFileWatcher({
		root,
		filePath: options.filePath,
		getScope: () => snapshot.scope,
		onChange(change) {
			reloadQueue = reloadQueue.then(async () => {
				if (stopped) return;
				if (isWidgetSourceRelPath(change.relPath)) await buildContentWidgets(root);
				const next = await discover();
				if (stopped) return;
				routes = createSnapshotRouteLookup({ snapshot: next, runtimeConfig: options.runtimeConfig, basePath });
				snapshot = next;
				options.onChange(change);
			}).catch((error) => {
				if (!stopped) options.liveChannel.publish({ type: "error", at: Date.now(), message: String(error) });
			});
		},
	}) : undefined;
	return {
		basePath,
		url: `${basePath}${page.url.split("/").map(encodeURIComponent).join("/")}`,
		async fetch(request) {
			const url = new URL(request.url);
			url.pathname = url.pathname.slice(basePath.length) || "/";
			const scopedRequest = new Request(url, request);
			return await selectionCommandResponse(scopedRequest, root) ??
				await runtime(scopedRequest) ?? dispatchSnapshotRequest(scopedRequest, routes);
		},
		stop() { stopped = true; watcher?.stop(); },
	};
}
