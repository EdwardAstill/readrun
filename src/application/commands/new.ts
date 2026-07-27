import { defineCommand } from "citty";
import path from "node:path";
import {
  ensureDirectory,
  fail,
  pathExists,
  resolvePath,
  titleFromFileName,
} from "./cli-helpers.ts";

const DEFAULT_PAGE_BODY = `One-sentence summary of what this page is.

## Overview

Explanatory prose here.
`;

export interface NewCommandArgs {
  path: string;
  title?: string | null;
  force?: boolean | null;
}

export interface WritePageOptions {
  targetFile: string;
  title?: string | null;
  force?: boolean;
}

export interface WritePageResult {
  path: string;
  created: boolean;
  skipped?: "exists";
}

export async function writePage(options: WritePageOptions): Promise<WritePageResult> {
  const targetFile = withMarkdownExtension(resolvePath(options.targetFile));
  if ((await pathExists(targetFile)) && !options.force) {
    return {
      path: targetFile,
      created: false,
      skipped: "exists",
    };
  }

  const title = options.title?.trim() || titleFromFileName(targetFile) || "Untitled";
  await ensureDirectory(path.dirname(targetFile));
  await Bun.write(targetFile, `# ${title}\n\n${DEFAULT_PAGE_BODY}`);

  return {
    path: targetFile,
    created: true,
  };
}

export async function runNewCommand(args: NewCommandArgs): Promise<void> {
  const result = await writePage({
    targetFile: args.path,
    title: args.title,
    force: Boolean(args.force),
  });

  if (result.skipped === "exists") {
    fail(`File already exists: ${result.path} (use --force to overwrite)`);
  }

  console.log(`created ${result.path}`);
}

function withMarkdownExtension(targetFile: string): string {
  return targetFile.endsWith(".md") ? targetFile : `${targetFile}.md`;
}

export const newCommand = defineCommand({
  meta: {
    name: "new",
    description: "Scaffold a new Markdown page.",
  },
  args: {
    path: {
      type: "positional",
      required: true,
      description: "Path for the new page (for example notes/topic.md)",
    },
    title: {
      type: "string",
      required: false,
      description: "Page title (default: derived from filename)",
    },
    force: {
      type: "boolean",
      required: false,
      default: false,
      description: "Overwrite an existing file",
    },
  },
  async run({ args }) {
    await runNewCommand(args as NewCommandArgs);
  },
});
