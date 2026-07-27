import path from "node:path";
import { mkdir, rm } from "node:fs/promises";

import type { ContentProjectSnapshot } from "../../application/read-models/project-snapshot.ts";
import type { StaticArtifactOptions } from "../../application/use-cases/build-site.ts";
import { renderPage } from "../../application/use-cases/render-page.ts";
import { routeOutputPath } from "../../domain/routes/generate.ts";
import type { BuildPlatform } from "../../application/commands/cli-helpers.ts";
import { createFilesystemAssetStore } from "../filesystem/asset-store.ts";
import { bundleClient } from "./client-bundle.ts";
import { dataFileAliases } from "./data-files.ts";

export async function writeStaticArtifacts(
	outDir: string,
	project: ContentProjectSnapshot,
	options: StaticArtifactOptions = {},
): Promise<string[]> {
	const store = createFilesystemAssetStore(outDir);
	const emitted: string[] = [];

	for (const route of project.routes) {
		if (route.kind === "asset") {
			const outputPath = routeOutputPath(route);
			await store.write(outputPath, Bun.file(route.asset.filePath));
			emitted.push(outputPath);
			continue;
		}

		const rendered = await renderPage(
			{
				snapshot: project,
				url: route.url,
				runtimeConfig: {
					enableLiveReload: false,
				},
			},
		);

		const outputPath = routeOutputPath(route);
		await store.write(
			outputPath,
			prefixArtifactUrls(rendered.body, rendered.contentType, options.basePath),
		);
		emitted.push(outputPath);
	}

	const clientEntryPath = new URL(
		"../../presentation/client/main.tsx",
		import.meta.url,
	);
	const bundle = await bundleClient(clientEntryPath.pathname);
	await store.write("_readrun/client.js", bundle.script);
	emitted.push("_readrun/client.js");

	if (bundle.style.length > 0) {
		await store.write("_readrun/client.css", bundle.style);
		emitted.push("_readrun/client.css");
	}

	const dataFilesEmitted = await copyDataFiles(outDir, project);
	emitted.push(...dataFilesEmitted);

	return emitted;
}

function prefixArtifactUrls(
	body: string | Blob | ArrayBuffer,
	contentType: string,
	basePath?: string,
): string | Blob | ArrayBuffer {
	if (!basePath || typeof body !== "string") {
		return body;
	}

	const withJsonUrls = prefixJsonUrlFields(body, basePath);
	if (!contentType.startsWith("text/html")) {
		return withJsonUrls;
	}

	return withJsonUrls.replace(
		/(\s(?:href|src|poster|action|data-[a-z0-9-]*(?:src|href|url))=)(["'])(\/(?!\/)[^"']*)\2/gi,
		(_match, attribute: string, quote: string, url: string) =>
			`${attribute}${quote}${prefixRootRelativeUrl(url, basePath)}${quote}`,
	);
}

function prefixJsonUrlFields(value: string, basePath: string): string {
	return value.replace(
		/("([^"\\]+)"\s*:\s*")(\/(?!\/)[^"\\]*)(")/g,
		(match, opening: string, key: string, url: string, closing: string) => {
			if (key !== "url" && key !== "href" && !key.endsWith("Url")) {
				return match;
			}
			return `${opening}${prefixRootRelativeUrl(url, basePath)}${closing}`;
		},
	);
}

function prefixRootRelativeUrl(url: string, basePath: string): string {
	const normalizedBase = `/${basePath.split("/").filter(Boolean).join("/")}`;
	if (url === normalizedBase || url.startsWith(`${normalizedBase}/`)) {
		return url;
	}
	return url === "/" ? `${normalizedBase}/` : `${normalizedBase}${url}`;
}

async function copyDataFiles(
	outDir: string,
	project: ContentProjectSnapshot,
): Promise<string[]> {
	const emitted: string[] = [];

	for (const file of dataFileAliases(project.assetIndex)) {
		const destPath = path.join(outDir, ...file.outputPath.split("/"));
		await mkdir(path.dirname(destPath), { recursive: true });
		await Bun.write(destPath, Bun.file(file.sourcePath));
		emitted.push(file.outputPath);
	}

	return emitted;
}

export async function writePlatformSiteFiles(
	outDir: string,
	platform: BuildPlatform,
): Promise<string[]> {
	await removeLegacyPlatformFiles(outDir);
	if (platform !== "github") {
		return [];
	}

	const store = createFilesystemAssetStore(outDir);
	await store.write(".nojekyll", "");
	return [".nojekyll"];
}

async function removeLegacyPlatformFiles(outDir: string): Promise<void> {
	for (const relPath of [
		".nojekyll",
		".github/workflows/deploy.yml",
		"vercel.json",
		"netlify.toml",
	]) {
		await rm(path.join(outDir, ...relPath.split("/")), { force: true });
	}
}
