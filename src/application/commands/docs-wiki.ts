import { defineCommand } from "citty";
import type { ProjectConfigDocuments } from "../../domain/project/config-schema.ts";
import { readProjectConfigDocuments } from "../../infrastructure/filesystem/project-config-source.ts";
import { READRUN_ENTRY_PATH } from "../../shared/paths.ts";
import {
	builtInDocsDir,
	resolveExistingPath,
	serverArgs,
	type ServerArgsValues,
} from "./cli-helpers.ts";
import { runServeCommand } from "./serve.ts";

export interface DocsWikiCommandArgs extends ServerArgsValues {}

export function asWikiProjectDocuments(
	documents: ProjectConfigDocuments,
): ProjectConfigDocuments {
	const wikiDocuments: ProjectConfigDocuments = {
		...documents,
		entry: {
			path: READRUN_ENTRY_PATH,
			text: "welcome.md\n",
		},
	};
	delete wikiDocuments.navigation;
	return wikiDocuments;
}

async function readDocsWikiConfigDocuments(
	root: string,
): Promise<ProjectConfigDocuments> {
	return asWikiProjectDocuments(await readProjectConfigDocuments(root));
}

export async function runDocsWikiCommand(
	args: DocsWikiCommandArgs,
): Promise<void> {
	const docsDir = await resolveExistingPath(
		builtInDocsDir(),
		() => "Built-in docs folder not found.",
	);

	await runServeCommand(
		{
			...args,
			path: docsDir,
		},
		{
			source: "docs-wiki",
			readProjectConfigDocuments: readDocsWikiConfigDocuments,
		},
	);
}

export const docsWikiCommand = defineCommand({
	meta: {
		name: "docs-wiki",
		description: "Serve the built-in readrun docs in wiki mode.",
	},
	args: { ...serverArgs },
	async run({ args }) {
		await runDocsWikiCommand(args as DocsWikiCommandArgs);
	},
});
