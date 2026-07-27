import { defineCommand } from "citty";
import path from "node:path";
import { buildStaticProject } from "../../infrastructure/runtime/project-build.ts";
import {
  parseBuildPlatform,
  relativeToCwd,
  resolveDirectory,
  resolvePath,
} from "./cli-helpers.ts";

export interface BuildCommandArgs {
  path?: string | null;
  platform?: string | null;
  out?: string | null;
  output?: string | null;
}

export async function runBuildCommand(args: BuildCommandArgs): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  const outArg = args.out ?? args.output;
  const outDir = outArg ? resolvePath(outArg) : path.resolve(process.cwd(), "dist");
  const platform = parseBuildPlatform(args.platform);
  const result = await buildStaticProject({
    contentDir,
    outDir,
    platform,
    projectDir: process.cwd(),
  });

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
  const emittedFiles = result.authOutputWritten
    ? [...result.emittedFiles, ".vercel/output"]
    : result.emittedFiles;

  for (const file of emittedFiles) {
    console.log(file);
  }

  console.log(
    `Built ${result.snapshot.contentIndex.pages.length} pages and ${emittedFiles.length} files from ${relativeToCwd(contentDir)} into ${relativeToCwd(outDir)}.`,
  );
}

export const buildCommand = defineCommand({
  meta: {
    name: "build",
    description: "Build a static site from a content folder.",
  },
  args: {
    path: {
      type: "positional",
      required: true,
      description: "Content folder",
    },
    platform: {
      type: "string",
      required: false,
      description: "Target platform: plain, github, vercel, or netlify",
    },
    out: {
      type: "string",
      required: false,
      description: "Output folder (default: ./dist)",
    },
    output: {
      type: "string",
      required: false,
      description: "Output folder (alias for --out)",
    },
  },
  async run({ args }) {
    await runBuildCommand(args as BuildCommandArgs);
  },
});
