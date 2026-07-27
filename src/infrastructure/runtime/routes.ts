import type { LiveChannel } from "../../application/ports/live-channel.ts";
import type {
	ContentProjectSnapshot,
	ProjectRuntimeState,
} from "../../application/read-models/project-snapshot.ts";
import { renderPage } from "../../application/use-cases/render-page.ts";
import type { ReadrunRuntimeConfig } from "../../shared/runtime-config.ts";
import { parsePythonImports } from "../execution/python-imports.ts";
import { runUvPython } from "../execution/uv-python.ts";
import { bundleClient } from "./client-bundle.ts";
import { createSseResponse } from "./live.ts";
import { dataFileAliases } from "./data-files.ts";

type RouteHandler = (request: Request) => Response | Promise<Response>;
type RouteMethods = Partial<Record<"GET" | "POST", RouteHandler>>;

export type SnapshotRouteLookup = ReadonlyMap<string, RouteMethods>;

export interface CreateRuntimeRequestHandlerOptions {
	root: string;
	getRuntimeState(): ProjectRuntimeState;
	liveChannel?: LiveChannel;
	clientEntry?: string;
	uvPythonAvailable: boolean;
	uvCommand?: string | string[];
}

export interface CreateSnapshotRouteLookupOptions {
	snapshot: ContentProjectSnapshot;
	runtimeConfig?: Partial<ReadrunRuntimeConfig>;
}

export function createRuntimeRequestHandler(
	options: CreateRuntimeRequestHandlerOptions,
): (request: Request) => Promise<Response | null> {
	const getClientBundle = createClientBundleLoader(options.clientEntry);
	const routes = new Map<string, RouteMethods>();

	routes.set("/_readrun/client.js", {
		GET: async () => {
			const bundle = await getClientBundle();
			return new Response(bundle.script, {
				headers: { "Content-Type": "application/javascript; charset=utf-8" },
			});
		},
	});

	routes.set("/_readrun/client.css", {
		GET: async () => {
			const bundle = await getClientBundle();
			return new Response(bundle.style, {
				headers: { "Content-Type": "text/css; charset=utf-8" },
			});
		},
	});

	routes.set("/_readrun/live/status", {
		GET: () => {
			const state = options.getRuntimeState();
			return Response.json({
				root: state.root,
				version: state.version,
				lastChange: state.lastChange ?? null,
			});
		},
	});

	if (options.liveChannel) {
		routes.set("/_readrun/live/events", {
			GET: () => createSseResponse(options.liveChannel!),
		});
	}

	routes.set("/api/exec/python", {
		POST: (request) => executeLocalPython(request, options),
	});

	return async (request) => {
		const url = new URL(request.url);
		const handler = routes.get(url.pathname)?.[request.method as "GET" | "POST"];
		return handler ? handler(request) : null;
	};
}

export function createSnapshotRouteLookup(
	options: CreateSnapshotRouteLookupOptions,
): SnapshotRouteLookup {
	const routes = new Map<string, RouteMethods>();

	for (const route of options.snapshot.routes) {
		routes.set(route.url, {
			GET: async () => {
				if (route.kind === "asset") {
					return new Response(Bun.file(route.asset.filePath));
				}

				const rendered = await renderPage({
					snapshot: options.snapshot,
					url: route.url,
					runtimeConfig: options.runtimeConfig,
				});
				return new Response(rendered.body, {
					status: rendered.status,
					headers: { "Content-Type": rendered.contentType },
				});
			},
		});
	}

	for (const file of dataFileAliases(options.snapshot.assetIndex)) {
		routes.set(file.url, {
			GET: () => new Response(Bun.file(file.sourcePath)),
		});
	}

	return routes;
}

export async function dispatchSnapshotRequest(
	request: Request,
	routes: SnapshotRouteLookup,
): Promise<Response> {
	const url = new URL(request.url);
	const pathname = normaliseRoutePathname(url.pathname);
	const handler = routes.get(pathname)?.[request.method as "GET" | "POST"];
	return handler ? handler(request) : new Response("Not found", { status: 404 });
}

function normaliseRoutePathname(pathname: string): string {
	return pathname.endsWith("/") || pathname.includes(".")
		? pathname
		: `${pathname}/`;
}

function createClientBundleLoader(
	entry?: string,
): () => Promise<{ script: string; style: string }> {
	let bundlePromise: Promise<{ script: string; style: string }> | undefined;

	return () => {
		bundlePromise ??= bundleClient(entry).then((result) => {
			for (const warning of result.warnings) {
				console.warn(`readrun: client bundle: ${warning}`);
			}
			return { script: result.script, style: result.style };
		});
		return bundlePromise;
	};
}

async function executeLocalPython(
	request: Request,
	options: CreateRuntimeRequestHandlerOptions,
): Promise<Response> {
	if (!options.uvPythonAvailable) {
		return jsonError("Local Python execution requires uv to be installed.", 403);
	}

	const url = new URL(request.url);
	if (!isLoopbackHostname(url.hostname)) {
		return jsonError(
			"Local Python execution is only available from localhost.",
			403,
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError("Expected a JSON request body.", 400);
	}

	const code =
		body && typeof body === "object" && "code" in body
			? (body as { code?: unknown }).code
			: undefined;
	if (typeof code !== "string" || code.length === 0) {
		return jsonError("Expected a non-empty Python code string.", 400);
	}
	if (code.length > 1_000_000) {
		return jsonError("Python code is too large to execute.", 413);
	}

	const result = await runUvPython({
		contentDir: options.root,
		code,
		packages: parsePythonImports(code),
		uvCommand: options.uvCommand,
	});

	return Response.json({
		...result,
		files: result.files.map((file) => ({
			name: file.name,
			data: Buffer.from(file.data).toString("base64"),
			encoding: "base64",
			extension: file.extension,
			isImage: file.isImage,
		})),
	});
}

function isLoopbackHostname(hostname: string): boolean {
	const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
	return (
		host === "localhost" || host === "::1" || /^127(?:\.\d{1,3}){3}$/.test(host)
	);
}

function jsonError(message: string, status: number): Response {
	return Response.json({ error: message }, { status });
}
